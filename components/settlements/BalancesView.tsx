'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';

// Note: This component expects the parent group page to fetch GET /api/settlements once
// and share the response (balances, greedy, optimal, history) across BalancesView,
// the Settlements tab content, and history to avoid duplicate API calls.

type Balance = {
  userId: string;
  name: string;
  avatar?: string | null;
  netBalance: number;
};

type BalancesViewProps = {
  balances: Balance[];
};

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

function getBalanceDisplay(balance: number) {
  const absBalance = Math.abs(balance);
  if (balance > 0) {
    return {
      text: `+₹${absBalance.toFixed(2)} owed to them`,
      className: 'text-green-600',
    };
  } else if (balance < 0) {
    return {
      text: `-₹${absBalance.toFixed(2)} owes`,
      className: 'text-red-600',
    };
  }
  return {
    text: 'Settled up',
    className: 'text-muted-foreground',
  };
}

export default function BalancesView({ balances }: BalancesViewProps) {
  const sortedBalances = [...balances].sort((a, b) => Math.abs(b.netBalance) - Math.abs(a.netBalance));

  return (
    <Card>
      <CardContent className="pt-6">
        {sortedBalances.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No balances to display</p>
        ) : (
          <ul className="space-y-3">
            {sortedBalances.map((balance) => {
              const { text, className } = getBalanceDisplay(balance.netBalance);

              return (
                <li
                  key={balance.userId}
                  className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar>
                      {balance.avatar ? (
                        <AvatarImage src={balance.avatar} alt={balance.name} />
                      ) : null}
                      <AvatarFallback>{getInitials(balance.name)}</AvatarFallback>
                    </Avatar>
                    <p className="truncate text-sm font-medium">{balance.name}</p>
                  </div>
                  <p className={`text-sm font-medium ${className}`}>{text}</p>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}