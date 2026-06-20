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

type TimeSeriesPoint = {
  period: string;
  total: number;
};

function getObjectId(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    const obj = value as { _id?: unknown; toString?: () => string };
    if (obj._id) return getObjectId(obj._id);
    if (typeof obj.toString === 'function') return obj.toString();
  }
  return null;
}

function roundMoney(amount: number) {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() - ((day + 6) % 7));
  return d;
}

function getWeekRangeLabel(date: Date): string {
  const start = getMonday(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
  return `${fmt.format(start)} - ${fmt.format(end)}`;
}

function getPeriodKey(date: Date, groupBy: string): string {
  if (groupBy === 'week') {
    return getMonday(date).toISOString().slice(0, 10);
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getPeriodLabel(date: Date, groupBy: string): string {
  if (groupBy === 'week') return getWeekRangeLabel(date);
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(date);
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
      (m: { userId: mongoose.Types.ObjectId | { _id: mongoose.Types.ObjectId } }) =>
        getObjectId(m.userId) === session.user.id
    );
    if (!isMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const expenses = await Expense.find({ groupId }).select('paidBy amount category date').lean();

    const perPersonMap = new Map<string, PersonSpend>();
    group.members.forEach((m: { userId: mongoose.Types.ObjectId | { _id: mongoose.Types.ObjectId; name?: string; email?: string; avatar?: string | null } }) => {
      const uid = getObjectId(m.userId);
      if (!uid) return;
      const user = m.userId as { name?: string; email?: string; avatar?: string | null };
      perPersonMap.set(uid, {
        userId: uid,
        name: user.name || user.email || 'Unknown',
        avatar: user.avatar ?? null,
        totalPaid: 0,
      });
    });

    const categoryTotals = new Map<string, number>();
    let totalSpend = 0;

    expenses.forEach((e) => {
      const amount = Number(e.amount) || 0;
      totalSpend += amount;

      const paidById = getObjectId(e.paidBy);
      if (paidById && perPersonMap.has(paidById)) {
        perPersonMap.get(paidById)!.totalPaid += amount;
      }

      const category = typeof e.category === 'string' && e.category.trim() ? e.category : 'other';
      categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + amount);
    });

    const perPersonSpend = Array.from(perPersonMap.values())
      .map((p) => ({ ...p, totalPaid: roundMoney(p.totalPaid) }))
      .sort((a, b) => b.totalPaid - a.totalPaid || a.name.localeCompare(b.name));

    const byCategory = Array.from(categoryTotals.entries())
      .map(([category, total]): CategorySpend => ({ category, total: roundMoney(total) }))
      .sort((a, b) => b.total - a.total || a.category.localeCompare(b.category));

    const url = new URL(_request.url);
    const startDateParam = url.searchParams.get('startDate');
    const endDateParam = url.searchParams.get('endDate');
    const groupBy = url.searchParams.get('groupBy') === 'week' ? 'week' : 'month';

    const startDate = startDateParam ? new Date(startDateParam) : null;
    const endDate = endDateParam ? new Date(endDateParam) : null;

    if (startDateParam && Number.isNaN(startDate!.getTime())) {
      return NextResponse.json({ error: 'Invalid startDate' }, { status: 400 });
    }
    if (endDateParam && Number.isNaN(endDate!.getTime())) {
      return NextResponse.json({ error: 'Invalid endDate' }, { status: 400 });
    }

    const buckets = new Map<string, { period: string; total: number }>();
    expenses.forEach((e) => {
      const amount = Number(e.amount) || 0;
      const d = new Date(e.date as Date);
      if (startDate && d < startDate!) return;
      if (endDate) {
        const endBoundary = new Date(endDate);
        endBoundary.setHours(23, 59, 59, 999);
        if (d > endBoundary) return;
      }
      const key = getPeriodKey(d, groupBy);
      const label = getPeriodLabel(d, groupBy);
      const existing = buckets.get(key);
      if (existing) {
        existing.total += amount;
      } else {
        buckets.set(key, { period: label, total: amount });
      }
    });

    const timeSeries = Array.from(buckets.values())
      .map((b) => ({ period: b.period, total: roundMoney(b.total) }))
      .sort((a, b) => a.period.localeCompare(b.period));

    return NextResponse.json({
      totalSpend: roundMoney(totalSpend),
      perPersonSpend,
      byCategory,
      topSpender: perPersonSpend[0] ?? null,
      timeSeries,
    });
  } catch (error) {
    console.error('Error fetching group analytics:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
