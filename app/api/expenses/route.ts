import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Group from '@/models/Group';
import Expense from '@/models/Expense';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const groupId = new URL(request.url).searchParams.get('groupId');

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

    const expenses = await Expense.find({ groupId })
      .sort({ date: -1 })
      .populate('paidBy', 'name email avatar')
      .populate('splitAmong.userId', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    return NextResponse.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
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
    const { groupId, description, amount, paidBy, splitAmong, category, date } = body;

    if (!description || description.trim() === '') {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 });
    }

    if (!paidBy) {
      return NextResponse.json({ error: 'paidBy is required' }, { status: 400 });
    }

    if (!splitAmong || !Array.isArray(splitAmong) || splitAmong.length === 0) {
      return NextResponse.json({ error: 'splitAmong must be a non-empty array' }, { status: 400 });
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

    const splitSum = splitAmong.reduce(
      (sum: number, item: { amount: number }) => sum + (item.amount || 0),
      0
    );

    if (Math.abs(splitSum - amount) >= 0.01) {
      return NextResponse.json(
        { error: 'Split amounts must add up to the total expense amount' },
        { status: 400 }
      );
    }

    const expense = await Expense.create({
      groupId,
      description: description.trim(),
      amount,
      paidBy,
      splitAmong,
      category: category || 'other',
      date: date ? new Date(date) : new Date(),
      createdBy: session.user.id,
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
