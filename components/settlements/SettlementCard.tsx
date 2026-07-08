'use client';

import { ArrowRight } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Person = {
  name: string;
  avatar?: string | null;
};

export type SettlementStatus = 'pending' | 'completed';

export type SettlementCardProps = {
  from: Person;
  to: Person;
  amount: number;
  currency?: string;
  status?: SettlementStatus;
  onMarkPaid?: () => void;
  className?: string;
};

const currencySymbols: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
};

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .filter(Boolean)
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?'
  );
}

function formatAmount(amount: number, currency?: string) {
  const formattedNumber = amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const normalizedCurrency = currency?.trim().toUpperCase();

  if (!normalizedCurrency) {
    return formattedNumber;
  }

  const symbol = currencySymbols[normalizedCurrency];

  if (symbol) {
    return `${symbol}${formattedNumber}`;
  }

  return `${normalizedCurrency} ${formattedNumber}`;
}

export default function SettlementCard({
  from,
  to,
  amount,
  currency,
  status,
  onMarkPaid,
  className,
}: SettlementCardProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar size="lg" aria-label={from.name}>
              {from.avatar ? <AvatarImage src={from.avatar} alt={from.name} /> : null}
              <AvatarFallback>{getInitials(from.name)}</AvatarFallback>
            </Avatar>

            <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />

            <Avatar size="lg" aria-label={to.name}>
              {to.avatar ? <AvatarImage src={to.avatar} alt={to.name} /> : null}
              <AvatarFallback>{getInitials(to.name)}</AvatarFallback>
            </Avatar>

            <p className="min-w-0 truncate text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{from.name}</span> pays{' '}
              <span className="font-medium text-foreground">{to.name}</span>
            </p>
          </div>

          <div className="flex flex-col items-start gap-2 sm:items-end">
            <div className="text-lg font-semibold tracking-tight sm:text-xl">
              {formatAmount(amount, currency)}
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              {status === 'pending' ? (
                <Badge
                  variant="outline"
                  className="border-yellow-400/60 bg-yellow-400/10 text-yellow-700 dark:border-yellow-300/40 dark:text-yellow-300"
                >
                  Pending
                </Badge>
              ) : status === 'completed' ? (
                <Badge className="bg-green-500 text-white hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-500">
                  Completed
                </Badge>
              ) : null}

              {status === 'pending' && onMarkPaid ? (
                <Button type="button" size="sm" variant="outline" onClick={onMarkPaid}>
                  Mark as Paid
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
