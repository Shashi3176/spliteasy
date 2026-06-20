import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { connectDB } from '@/lib/db';
import Group from '@/models/Group';
import Expense from '@/models/Expense';
import { buildBalancesFromExpenses } from '@/lib/algorithms';
import PersonalStatsBar from '@/components/dashboard/PersonalStatsBar';

type PersonalStats = {
  totalYouOwe: number;
  totalOwedToYou: number;
  netPosition: number;
  activeGroupsCount: number;
};

async function getDashboardStats(userId: string): Promise<PersonalStats> {
  await connectDB();

  const groups = await Group.find({ 'members.userId': userId }).sort({ createdAt: -1 });

  let totalYouOwe = 0;
  let totalOwedToYou = 0;

  for (const group of groups) {
    const expenses = await Expense.find({ groupId: group._id });
    const { balances } = buildBalancesFromExpenses(group._id.toString(), expenses);

    const userBalance = balances.find((b) => b.userId === userId);
    if (userBalance) {
      if (userBalance.amount < 0) {
        totalYouOwe += Math.abs(userBalance.amount);
      } else {
        totalOwedToYou += userBalance.amount;
      }
    }
  }

  return {
    totalYouOwe,
    totalOwedToYou,
    netPosition: totalOwedToYou - totalYouOwe,
    activeGroupsCount: groups.length,
  };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  const stats = await getDashboardStats(session.user.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Welcome back, {session.user?.name}!</h1>
      <PersonalStatsBar stats={stats} />
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your profile details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <span className="text-sm font-medium text-muted-foreground">Name:</span>
            <span className="ml-2">{session.user?.name}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-muted-foreground">Email:</span>
            <span className="ml-2">{session.user?.email}</span>
          </div>
        </CardContent>
      </Card>
      {/* Groups section will appear here */}
    </div>
  );
}