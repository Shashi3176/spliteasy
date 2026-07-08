'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Download } from 'lucide-react';
import { exportExpensesToCsv } from '@/lib/csvExport';

type Expense = {
  _id: string;
  description: string;
  amount: number;
  category: 'food' | 'travel' | 'accommodation' | 'other';
  date: string;
  paidBy: {
    _id: string;
    name?: string;
    avatar?: string;
  };
  splitAmong: Array<{
    userId: {
      _id: string;
      name?: string;
      avatar?: string;
    };
    amount: number;
  }>;
  createdBy: {
    _id: string;
    name?: string;
  };
};

type ExpenseSummaryBarProps = {
  totalGroupSpend: number;
  yourShare: number;
  youPaid: number;
  netBalance: number;
  currency: string;
  expenses?: Expense[];
  groupName?: string;
};

function getCurrencySymbol(currency: string): string {
  switch (currency.toUpperCase()) {
    case 'INR':
      return '₹';
    case 'USD':
      return '$';
    case 'EUR':
      return '€';
    case 'GBP':
      return '£';
    default:
      return currency;
  }
}

function formatMoney(amount: number, currency: string): string {
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${amount.toFixed(2)}`;
}

export default function ExpenseSummaryBar({
  totalGroupSpend,
  yourShare,
  youPaid,
  netBalance,
  currency,
  expenses,
  groupName,
}: ExpenseSummaryBarProps) {
  const netBalanceLabel = netBalance > 0
    ? `+${formatMoney(netBalance, currency)}`
    : netBalance < 0
      ? formatMoney(netBalance, currency)
      : 'Settled up';

  const netBalanceClass = netBalance > 0
    ? 'text-green-600'
    : netBalance < 0
      ? 'text-red-600'
      : 'text-muted-foreground';

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
      <Card>
        <CardContent className="p-3">
          <p className="text-xs text-muted-foreground">Total Group Spend</p>
          <p className="text-lg font-semibold">{formatMoney(totalGroupSpend, currency)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-3">
          <p className="text-xs text-muted-foreground">Your Share</p>
          <p className="text-lg font-semibold">{formatMoney(yourShare, currency)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-3">
          <p className="text-xs text-muted-foreground">You Paid</p>
          <p className="text-lg font-semibold">{formatMoney(youPaid, currency)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-3">
          <p className="text-xs text-muted-foreground">Net Balance</p>
          <p className={`text-lg font-semibold ${netBalanceClass}`}>{netBalanceLabel}</p>
        </CardContent>
      </Card>
      {expenses && groupName && (
        <Card>
          <CardContent className="p-3 flex items-center justify-center">
            <button
              onClick={() => exportExpensesToCsv(expenses, groupName)}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}