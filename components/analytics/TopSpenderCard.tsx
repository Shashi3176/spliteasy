'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type TopSpender = {
  userId: string;
  name: string;
  avatar?: string | null;
  totalPaid: number;
};

type TopSpenderCardProps = {
  topSpender: TopSpender | null;
  currency: string;
};

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return 'U';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default function TopSpenderCard({ topSpender, currency }: TopSpenderCardProps) {
  if (!topSpender) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <Avatar size="lg">
                <AvatarFallback>TS</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>No spending yet</CardTitle>
                <CardDescription>No member has paid in this group</CardDescription>
              </div>
            </div>
            <Badge variant="secondary">Top Spender</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{formatMoney(0, currency)}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar size="lg">
              {topSpender.avatar ? <AvatarImage src={topSpender.avatar} alt={topSpender.name} /> : null}
              <AvatarFallback>{getInitials(topSpender.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <CardTitle className="truncate">{topSpender.name}</CardTitle>
              <CardDescription>has paid the most in this group</CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300">
            Top Spender
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{formatMoney(topSpender.totalPaid, currency)}</p>
        <p className="text-xs text-muted-foreground">Total paid across all group expenses</p>
      </CardContent>
    </Card>
  );
}
