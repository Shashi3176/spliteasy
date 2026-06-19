'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Receipt, Utensils, Plane, Hotel } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import CategoryFilterTabs from '@/components/expenses/CategoryFilterTabs';
import EmptyExpensesState from '@/components/expenses/EmptyExpensesState';
import ExpenseSummaryBar from '@/components/expenses/ExpenseSummaryBar';

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

type ExpenseListProps = {
  groupId: string;
  onExpenseClick?: (expense: Expense) => void;
  onAddExpenseClick: () => void;
};

function getCategoryIcon(category: Expense['category']) {
  switch (category) {
    case 'food':
      return Utensils;
    case 'travel':
      return Plane;
    case 'accommodation':
      return Hotel;
    case 'other':
      return Receipt;
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getPaidByName(paidBy: Expense['paidBy']) {
  return paidBy.name || paidBy._id;
}

export default function ExpenseList({ groupId, onExpenseClick, onAddExpenseClick }: ExpenseListProps) {
  const { data: session } = useSession();
  const currentUserId = (session?.user as { id?: string } | undefined)?.id;
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'food' | 'travel' | 'accommodation' | 'other'>('all');

  const filteredExpenses = selectedCategory === 'all'
    ? expenses
    : expenses.filter((expense) => expense.category === selectedCategory);

  const totalGroupSpend = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const youPaid = expenses
    .filter((expense) => expense.paidBy._id === currentUserId)
    .reduce((sum, expense) => sum + expense.amount, 0);
  const yourShare = expenses.reduce((sum, expense) => {
    const userSplit = expense.splitAmong.find((s) => s.userId._id === currentUserId);
    return sum + (userSplit?.amount ?? 0);
  }, 0);
  const netBalance = youPaid - yourShare;

  const fetchExpenses = useCallback(async () => {
    if (!groupId) {
      return;
    }

    try {
      const response = await fetch(`/api/expenses?groupId=${encodeURIComponent(groupId)}`);
      if (response.ok) {
        const data = await response.json();
        setExpenses(data);
      }
    } catch {
      // Silently fail
    }
  }, [groupId]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleRowClick = (expense: Expense) => {
    onExpenseClick?.(expense);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        {expenses.length === 0 ? (
          <EmptyExpensesState variant="no-expenses" onAddExpenseClick={onAddExpenseClick} />
        ) : (
          <>
            <ExpenseSummaryBar
              totalGroupSpend={totalGroupSpend}
              yourShare={yourShare}
              youPaid={youPaid}
              netBalance={netBalance}
              currency="INR"
            />
            <CategoryFilterTabs selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
            {filteredExpenses.length === 0 ? (
              <EmptyExpensesState variant="no-results" />
            ) : (
              <div className="space-y-4">
                {filteredExpenses.map((expense) => {
                  const Icon = getCategoryIcon(expense.category);
                  const userSplit = expense.splitAmong.find((s) => s.userId._id === currentUserId);
                  const hasUserSplit = userSplit !== undefined;

                  return (
                    <div
                      key={expense._id}
                      className="border-b pb-4 last:border-0 cursor-pointer hover:bg-muted/50 transition-colors rounded-lg p-2"
                      onClick={() => handleRowClick(expense)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium">{expense.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(expense.date)} • Paid by {getPaidByName(expense.paidBy)}
                            </p>
                          </div>
                        </div>
                        <p className="font-semibold">₹{expense.amount.toFixed(2)}</p>
                      </div>
                      <div className="mt-2 text-sm">
                        {hasUserSplit ? (
                          <span className="text-muted-foreground">Your share: </span>
                        ) : (
                          <span className="text-muted-foreground">You didn&apos;t split this</span>
                        )}
                        {hasUserSplit && <span className="font-medium">₹{userSplit!.amount.toFixed(2)}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}