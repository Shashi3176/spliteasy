import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Group from '@/models/Group';
import Expense from '@/models/Expense';
import Settlement from '@/models/Settlement';

type Actor = {
  name: string;
  avatar: string | null;
};

type Event = {
  type: 'expense_added' | 'member_joined' | 'settlement_completed';
  timestamp: string;
  actor: Actor;
  details: Record<string, unknown>;
};

function getObjectId(value: unknown): string | null {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'object') {
    const maybeObjectId = value as { _id?: unknown; toString?: () => string };

    if (maybeObjectId._id) {
      return getObjectId(maybeObjectId._id);
    }

    if (typeof maybeObjectId.toString === 'function') {
      return maybeObjectId.toString();
    }
  }

  return null;
}

export async function GET(_request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json([], { status: 401 });
    }

    const { groupId } = await params;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return NextResponse.json([], { status: 400 });
    }

    await connectDB();

    const group = await Group.findById(groupId).populate('members.userId', 'name email avatar');

    if (!group) {
      return NextResponse.json([], { status: 404 });
    }

    const isMember = group.members.some(
      (member: { userId: mongoose.Types.ObjectId | { _id: mongoose.Types.ObjectId } }) =>
        getObjectId(member.userId) === session.user.id
    );

    if (!isMember) {
      return NextResponse.json([], { status: 403 });
    }

    const [expenses, settlements] = await Promise.all([
      Expense.find({ groupId })
        .select('createdBy description amount category createdAt')
        .populate('createdBy', 'name email avatar')
        .lean(),
      Settlement.find({ groupId, status: 'completed' })
        .select('from to amount settledAt createdAt')
        .populate('from', 'name email avatar')
        .populate('to', 'name email avatar')
        .lean(),
    ]);

    const events: Event[] = [];

    expenses.forEach((expense) => {
      const createdBy = expense.createdBy as { _id: unknown; name?: string; email?: string; avatar?: string | null } | null;

      events.push({
        type: 'expense_added',
        timestamp: new Date(expense.createdAt as Date).toISOString(),
        actor: {
          name: createdBy?.name || createdBy?.email || 'Unknown',
          avatar: createdBy?.avatar ?? null,
        },
        details: {
          description: expense.description,
          amount: Number(expense.amount) || 0,
          category: expense.category,
        },
      });
    });

    group.members.forEach((member: { userId: mongoose.Types.ObjectId | { _id: mongoose.Types.ObjectId; name?: string; email?: string; avatar?: string | null }; joinedAt: Date }) => {
      const user = member.userId as { _id: unknown; name?: string; email?: string; avatar?: string | null };

      events.push({
        type: 'member_joined',
        timestamp: new Date(member.joinedAt).toISOString(),
        actor: {
          name: user.name || user.email || 'Unknown',
          avatar: user.avatar ?? null,
        },
        details: {},
      });
    });

    settlements.forEach((settlement) => {
      const from = settlement.from as { _id: unknown; name?: string; email?: string; avatar?: string | null } | null;
      const to = settlement.to as { _id: unknown; name?: string; email?: string; avatar?: string | null } | null;

      events.push({
        type: 'settlement_completed',
        timestamp: settlement.settledAt ? new Date(settlement.settledAt).toISOString() : new Date(settlement.createdAt as Date).toISOString(),
        actor: {
          name: from?.name || from?.email || 'Unknown',
          avatar: from?.avatar ?? null,
        },
        details: {
          to: {
            name: to?.name || to?.email || 'Unknown',
            avatar: to?.avatar ?? null,
          },
          amount: Number(settlement.amount) || 0,
        },
      });
    });

    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching activity feed:', error);
    return NextResponse.json([], { status: 500 });
  }
}
