import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Group from '@/models/Group';
import Expense from '@/models/Expense';

type PersonSpend = {
  userId: string;
  name: string;
  avatar: string | null;
  totalPaid: number;
};

type CategorySpend = {
  category: string;
  total: number;
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

function roundMoney(amount: number) {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export async function GET(_request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId } = await params;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 });
    }

    await connectDB();

    const group = await Group.findById(groupId).populate('members.userId', 'name email avatar');

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const isMember = group.members.some(
      (member: { userId: mongoose.Types.ObjectId | { _id: mongoose.Types.ObjectId } }) =>
        getObjectId(member.userId) === session.user.id
    );

    if (!isMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const expenses = await Expense.find({ groupId })
      .select('paidBy amount category')
      .lean();

    const perPersonMap = new Map<string, PersonSpend>();

    group.members.forEach((member: { userId: mongoose.Types.ObjectId | { _id: mongoose.Types.ObjectId; name?: string; email?: string; avatar?: string | null } }) => {
      const userId = getObjectId(member.userId);

      if (!userId) {
        return;
      }

      const user = member.userId as { name?: string; email?: string; avatar?: string | null };

      perPersonMap.set(userId, {
        userId,
        name: user.name || user.email || 'Unknown',
        avatar: user.avatar ?? null,
        totalPaid: 0,
      });
    });

    const categoryTotals = new Map<string, number>();
    let totalSpend = 0;

    expenses.forEach((expense) => {
      const amount = Number(expense.amount) || 0;
      totalSpend += amount;

      const paidById = getObjectId(expense.paidBy);

      if (paidById && perPersonMap.has(paidById)) {
        const current = perPersonMap.get(paidById)!;
        current.totalPaid += amount;
      }

      const category = typeof expense.category === 'string' && expense.category.trim() ? expense.category : 'other';
      categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + amount);
    });

    const perPersonSpend = Array.from(perPersonMap.values())
      .map((person) => ({
        ...person,
        totalPaid: roundMoney(person.totalPaid),
      }))
      .sort((a, b) => b.totalPaid - a.totalPaid || a.name.localeCompare(b.name));

    const byCategory = Array.from(categoryTotals.entries())
      .map(([category, total]): CategorySpend => ({
        category,
        total: roundMoney(total),
      }))
      .sort((a, b) => b.total - a.total || a.category.localeCompare(b.category));

    return NextResponse.json({
      totalSpend: roundMoney(totalSpend),
      perPersonSpend,
      byCategory,
      topSpender: perPersonSpend[0] ?? null,
    });
  } catch (error) {
    console.error('Error fetching group analytics:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
