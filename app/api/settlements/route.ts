import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { runGreedy, runOptimal } from '@/lib/algorithms/runner';
import { buildBalancesFromExpenses } from '@/lib/algorithms';
import Expense from '@/models/Expense';
import Group from '@/models/Group';
import Settlement from '@/models/Settlement';
import type { Balance, Transaction } from '@/lib/algorithms/runner';

type GreedyResponse = {
  transactions: Transaction[];
  count: number;
  timeMs: number;
};

type OptimalResponse = {
  transactions: Transaction[];
  count: number;
  timeMs: number;
};

type SkippedOptimal = {
  skipped: true;
  reason: string;
};

type SettlementDoc = any;

type APIResponse = {
  balances: Balance[];
  greedy: GreedyResponse;
  optimal: OptimalResponse | SkippedOptimal;
  history: SettlementDoc[];
  beforeEdges: Transaction[];
};

// Note: This does not check for or prevent duplicate/overlapping settlement submissions
// (e.g., re-saving suggestions when pending settlements already cover the same debt).
// That's a future consideration, out of scope for this task.

type TransactionInput = {
  from: string;
  to: string;
  amount: number;
};

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const groupId = request.nextUrl.searchParams.get('groupId');

    if (!groupId) {
      return NextResponse.json({ error: 'groupId is required' }, { status: 400 });
    }

    await connectDB();

    const group = await Group.findById(groupId);

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const isMember = group.members.some(
      (member: { userId: mongoose.Types.ObjectId }) => member.userId.toString() === session.user.id
    );

    if (!isMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const expenses = await Expense.find({ groupId }).sort({ date: -1 });

    const beforeEdges: Transaction[] = [];
    for (const expense of expenses) {
      const paidById = expense.paidBy.toString();
      const splitItems = expense.splitAmong ?? [];
      for (const split of splitItems) {
        if (split.userId.toString() !== paidById) {
          beforeEdges.push({
            from: split.userId.toString(),
            to: paidById,
            amount: split.amount,
          });
        }
      }
    }

    const { balances } = buildBalancesFromExpenses(groupId, expenses);

    const greedyResult = await runGreedy(balances);
    const greedy: GreedyResponse = {
      transactions: greedyResult.transactions,
      count: greedyResult.count,
      timeMs: greedyResult.timeMs,
    };

    const memberCount = group.members.length;
    let optimal: OptimalResponse | SkippedOptimal;

    if (memberCount > 20) {
      optimal = {
        skipped: true,
        reason: 'Optimal algorithm only runs for groups of 20 or fewer members',
      };
    } else {
      const optimalResult = await runOptimal(balances);
      optimal = {
        transactions: optimalResult.transactions,
        count: optimalResult.optimalCount,
        timeMs: optimalResult.timeMs,
      };
    }

    const history = await Settlement.find({ groupId })
      .sort({ createdAt: -1 })
      .populate('from', 'name email avatar')
      .populate('to', 'name email avatar');

    const response: APIResponse = {
      balances,
      greedy,
      optimal,
      history,
      beforeEdges,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching settlements:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { groupId, algorithmUsed, transactions } = body as {
      groupId: string;
      algorithmUsed: 'greedy' | 'optimal';
      transactions: TransactionInput[];
    };

    if (!groupId) {
      return NextResponse.json({ error: 'groupId is required' }, { status: 400 });
    }

    if (!algorithmUsed || !['greedy', 'optimal'].includes(algorithmUsed)) {
      return NextResponse.json({ error: 'algorithmUsed must be "greedy" or "optimal"' }, { status: 400 });
    }

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json({ error: 'transactions must be a non-empty array' }, { status: 400 });
    }

    for (const txn of transactions) {
      if (!mongoose.Types.ObjectId.isValid(txn.from) || !mongoose.Types.ObjectId.isValid(txn.to) || typeof txn.amount !== 'number' || txn.amount <= 0) {
        return NextResponse.json({ error: 'Each transaction must have valid from/to user ids and amount > 0' }, { status: 400 });
      }
    }

    await connectDB();

    const group = await Group.findById(groupId);

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const isMember = group.members.some(
      (member: { userId: mongoose.Types.ObjectId }) => member.userId.toString() === session.user.id
    );

    if (!isMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const settlementDocs = transactions.map((txn) => ({
      groupId,
      from: txn.from,
      to: txn.to,
      amount: txn.amount,
      algorithmUsed,
      status: 'pending' as const,
    }));

    const created = await Settlement.insertMany(settlementDocs);

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating settlements:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}