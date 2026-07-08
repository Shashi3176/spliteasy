import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Group from '@/models/Group';
import Expense from '@/models/Expense';
import { buildBalancesFromExpenses } from '@/lib/algorithms';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const groups = await Group.find({ 'members.userId': session.user.id }).sort({ createdAt: -1 });

    let totalYouOwe = 0;
    let totalOwedToYou = 0;

    for (const group of groups) {
      const expenses = await Expense.find({ groupId: group._id });
      const { balances } = buildBalancesFromExpenses(group._id.toString(), expenses);

      const userBalance = balances.find((b) => b.userId === session.user.id);
      if (userBalance) {
        if (userBalance.amount < 0) {
          totalYouOwe += Math.abs(userBalance.amount);
        } else {
          totalOwedToYou += userBalance.amount;
        }
      }
    }

    const netPosition = totalOwedToYou - totalYouOwe;

    return NextResponse.json({
      totalYouOwe,
      totalOwedToYou,
      netPosition,
      activeGroupsCount: groups.length,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}