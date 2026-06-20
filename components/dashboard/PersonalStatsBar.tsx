'use client';

import { Card, CardContent } from '@/components/ui/card';

type PersonalStats = {
  totalYouOwe: number;
  totalOwedToYou: number;
  netPosition: number;
  activeGroupsCount: number;
};

export default function PersonalStatsBar({ stats }: { stats: PersonalStats }) {
  const netPositionColor =
    stats.netPosition > 0
      ? 'text-green-600'
      : stats.netPosition < 0
        ? 'text-red-600'
        : '';

  const netPositionLabel =
    stats.netPosition > 0
      ? 'You\'re owed overall'
      : stats.netPosition < 0
        ? 'You owe overall'
        : 'Settled';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold text-red-600">₹{stats.totalYouOwe.toFixed(2)}</div>
          <div className="text-sm text-muted-foreground">You Owe</div>
        </CardContent>
      </Card>
<Card>
         <CardContent className="pt-6">
           <div className="text-2xl font-bold text-green-600">₹{stats.totalOwedToYou.toFixed(2)}</div>
           <div className="text-sm text-muted-foreground">Owed to You</div>
         </CardContent>
       </Card>
       <Card>
        <CardContent className="pt-6">
          <div className={`text-2xl font-bold ${netPositionColor}`}>₹{Math.abs(stats.netPosition).toFixed(2)}</div>
          <div className="text-sm text-muted-foreground">{netPositionLabel}</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold">{stats.activeGroupsCount}</div>
          <div className="text-sm text-muted-foreground">Active Groups</div>
        </CardContent>
      </Card>
    </div>
  );
}