'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Receipt, Utensils, Plane, Hotel, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import CategoryFilterTabs from '@/components/expenses/CategoryFilterTabs';
import EmptyExpensesState from '@/components/expenses/EmptyExpensesState';
import ExpenseSummaryBar from '@/components/expenses/ExpenseSummaryBar';
import { Skeleton } from '@/components/ui/skeleton';
import { Trie } from '@/lib/trie';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const searchFilteredExpenses = useMemo(() => {
    if (!searchQuery.trim()) {
      return expenses;
    }

    const descriptionTrie = new Trie<Expense>();
    const payerTrie = new Trie<Expense>();

    for (const expense of expenses) {
      descriptionTrie.insert(expense.description, expense);
      const payerName = getPaidByName(expense.paidBy);
      payerTrie.insert(payerName, expense);
    }

    const descriptionMatches = new Set(descriptionTrie.search(searchQuery));
    const payerMatches = new Set(payerTrie.search(searchQuery));

    return expenses.filter(
      (expense) => descriptionMatches.has(expense) || payerMatches.has(expense)
    );
  }, [expenses, searchQuery]);

  const filteredExpenses = selectedCategory === 'all'
    ? searchFilteredExpenses
    : searchFilteredExpenses.filter((expense) => expense.category === selectedCategory);

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
    } finally {
      setIsInitialLoad(false);
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
        {isInitialLoad ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <Skeleton className="h-10 w-full max-w-sm" />
              <Skeleton className="h-9 w-full max-w-md" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        ) : expenses.length === 0 ? (
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
               <div className="relative flex-1 max-w-sm">
                 <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input
                   type="text"
                   placeholder="Search expenses..."
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="pl-8"
                 />
               </div>
               <CategoryFilterTabs selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
             </div>
            {filteredExpenses.length === 0 ? (
              <EmptyExpensesState variant="no-results" />
            ) : (
               <div className="space-y-4">
                 {filteredExpenses.map((expense, index) => {
                  const Icon = getCategoryIcon(expense.category);
                  const userSplit = expense.splitAmong.find((s) => s.userId._id === currentUserId);
                  const hasUserSplit = userSplit !== undefined;

                   return (
                    <div
                      key={expense._id}
                      className={`border-b pb-4 last:border-0 cursor-pointer hover:bg-muted/50 transition-colors rounded-lg p-2 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300 ${index < 6 ? `motion-safe:delay-[${index * 20}ms]` : ''}`}
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