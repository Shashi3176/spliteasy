'use client';

import { Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';

type EmptyExpensesStateProps =
  | {
      variant: 'no-expenses';
      onAddExpenseClick: () => void;
    }
  | {
      variant: 'no-results';
      onAddExpenseClick?: never;
    };

export default function EmptyExpensesState({ variant, onAddExpenseClick }: EmptyExpensesStateProps) {
  if (variant === 'no-expenses') {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center px-4 py-12 text-center">
        <Receipt className="mb-4 size-16 text-muted-foreground" />
        <h2 className="mb-2 text-2xl font-semibold">No expenses yet</h2>
        <p className="mb-6 max-w-sm text-muted-foreground">
          Add your first expense to start tracking group spending.
        </p>
        <Button onClick={onAddExpenseClick}>Add Expense</Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[160px] flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
      <h3 className="text-sm font-medium">No expenses match this filter</h3>
      <p className="mt-2 text-sm text-muted-foreground">Try selecting a different category.</p>
    </div>
  );
}
