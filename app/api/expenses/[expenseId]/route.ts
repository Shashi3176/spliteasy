import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Expense from '@/models/Expense';
import Group from '@/models/Group';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ expenseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { expenseId } = await params;

    if (!mongoose.Types.ObjectId.isValid(expenseId)) {
      return NextResponse.json({ error: 'Invalid expense ID' }, { status: 400 });
    }

    await connectDB();

    const expense = await Expense.findById(expenseId)
      .populate('paidBy', 'name email avatar')
      .populate('splitAmong.userId', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    const group = await Group.findById(expense.groupId);

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const isMember = group.members.some(
      (member: { userId: mongoose.Types.ObjectId }) => member.userId.toString() === session.user.id
    );

    if (!isMember) {
      return NextResponse.json({ error: "You don't have access to this expense" }, { status: 403 });
    }

    return NextResponse.json(expense);
  } catch (error) {
    console.error('Error fetching expense:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ expenseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { expenseId } = await params;

    if (!mongoose.Types.ObjectId.isValid(expenseId)) {
      return NextResponse.json({ error: 'Invalid expense ID' }, { status: 400 });
    }

    await connectDB();

    const expense = await Expense.findById(expenseId);

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    const group = await Group.findById(expense.groupId);

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const userMember = group.members.find(
      (member: { userId: mongoose.Types.ObjectId }) => member.userId.toString() === session.user.id
    );

    if (!userMember) {
      return NextResponse.json({ error: "You don't have access to this expense" }, { status: 403 });
    }

    const isCreator = expense.createdBy.toString() === session.user.id;
    const isAdmin = userMember.role === 'admin';

    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        { error: 'Only the expense creator or a group admin can edit this expense' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { description, amount, paidBy, splitAmong, category, date } = body;

    if (amount !== undefined || splitAmong !== undefined) {
      if (amount === undefined || splitAmong === undefined) {
        return NextResponse.json(
          { error: 'Both amount and splitAmong are required when updating either' },
          { status: 400 }
        );
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

      expense.amount = amount;
      expense.splitAmong = splitAmong;
    }

    if (description !== undefined) {
      expense.description = description.trim();
    }
    if (paidBy !== undefined) {
      expense.paidBy = paidBy;
    }
    if (category !== undefined) {
      expense.category = category;
    }
    if (date !== undefined) {
      expense.date = new Date(date);
    }

    await expense.save();

    const updatedExpense = await Expense.findById(expenseId)
      .populate('paidBy', 'name email avatar')
      .populate('splitAmong.userId', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    return NextResponse.json(updatedExpense);
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ expenseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { expenseId } = await params;

    if (!mongoose.Types.ObjectId.isValid(expenseId)) {
      return NextResponse.json({ error: 'Invalid expense ID' }, { status: 400 });
    }

    await connectDB();

    const expense = await Expense.findById(expenseId);

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    const group = await Group.findById(expense.groupId);

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const userMember = group.members.find(
      (member: { userId: mongoose.Types.ObjectId }) => member.userId.toString() === session.user.id
    );

    if (!userMember) {
      return NextResponse.json({ error: "You don't have access to this expense" }, { status: 403 });
    }

    const isCreator = expense.createdBy.toString() === session.user.id;
    const isAdmin = userMember.role === 'admin';

    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        { error: 'Only the expense creator or a group admin can delete this expense' },
        { status: 403 }
      );
    }

    await Expense.findByIdAndDelete(expenseId);

    return NextResponse.json({ message: 'Expense deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}