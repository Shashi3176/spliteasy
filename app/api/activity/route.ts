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

type ActivityEvent = {
  type: 'expense_added' | 'member_joined' | 'settlement_completed';
  timestamp: string;
  actor: Actor;
  details: {
    description?: string;
    amount?: number;
    category?: string;
    to?: Actor;
  };
};

function roundMoney(amount: number) {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

function getObjectId(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof (value as any).toHexString === 'function') return (value as any).toHexString();
  if (typeof value === 'object' && value !== null && '_id' in value) {
    const innerId = (value as any)._id;
    if (innerId) {
      if (typeof innerId === 'string') return innerId;
      if (typeof innerId.toHexString === 'function') return innerId.toHexString();
      if (typeof innerId.toString === 'function') return innerId.toString();
    }
  }
  if (typeof (value as any).toString === 'function') {
    const str = (value as any).toString();
    if (str && str !== '[object Object]') return str;
  }
  return null;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const groupId = new URL(request.url).searchParams.get('groupId');
    if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
      return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 });
    }

    await connectDB();

    const group = await Group.findById(groupId).populate('members.userId', 'name email avatar');
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const isMember = group.members.some(
      (m: { userId: mongoose.Types.ObjectId | { _id: mongoose.Types.ObjectId } }) =>
        getObjectId(m.userId) === session.user.id
    );
    if (!isMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const events: ActivityEvent[] = [];

    group.members.forEach(
      (m: {
        userId: mongoose.Types.ObjectId | { _id: mongoose.Types.ObjectId; name?: string; email?: string; avatar?: string | null };
        joinedAt: Date;
      }) => {
        const uid = getObjectId(m.userId);
        if (!uid) return;
        const user = m.userId as { name?: string; email?: string; avatar?: string | null };
        events.push({
          type: 'member_joined',
          timestamp: m.joinedAt.toISOString(),
          actor: {
            name: user.name || user.email || 'Unknown',
            avatar: user.avatar ?? null,
          },
          details: {},
        });
      }
    );

    const expenses = await Expense.find({ groupId })
      .select('paidBy amount category date createdAt')
      .populate('paidBy', 'name email avatar')
      .sort({ createdAt: -1 });

    expenses.forEach((e) => {
      const paidByUser = e.paidBy as { name?: string; email?: string; avatar?: string | null } | null;
      const actorName = paidByUser?.name || paidByUser?.email || 'Unknown';
      events.push({
        type: 'expense_added',
        timestamp: e.createdAt.toISOString(),
        actor: {
          name: actorName,
          avatar: paidByUser?.avatar ?? null,
        },
        details: {
          description: e.description,
          amount: roundMoney(e.amount),
          category: e.category,
        },
      });
    });

    const settlements = await Settlement.find({ groupId, status: 'completed' })
      .sort({ settledAt: -1 })
      .populate('from', 'name email avatar')
      .populate('to', 'name email avatar');

    settlements.forEach((s) => {
      const fromUser = s.from as { name?: string; email?: string; avatar?: string | null } | null;
      const toUser = s.to as { name?: string; email?: string; avatar?: string | null } | null;
      events.push({
        type: 'settlement_completed',
        timestamp: (s.settledAt || s.createdAt).toISOString(),
        actor: {
          name: fromUser?.name || fromUser?.email || 'Unknown',
          avatar: fromUser?.avatar ?? null,
        },
        details: {
          amount: roundMoney(s.amount),
          to: {
            name: toUser?.name || toUser?.email || 'Unknown',
            avatar: toUser?.avatar ?? null,
          },
        },
      });
    });

    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json(events.slice(0, 100));
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
