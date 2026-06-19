'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Receipt, Utensils, Plane, Hotel } from 'lucide-react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

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
      email?: string;
      avatar?: string;
    };
    amount: number;
  }>;
  createdBy: {
    _id: string;
    name?: string;
  };
};

type ExpenseDetailModalProps = {
  expenseId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canEdit?: boolean;
  onEdit?: (expense: Expense) => void;
  onDeleted?: () => void;
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

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function getDisplayName(userId: Expense['splitAmong'][0]['userId']) {
  return userId.name || userId.email || 'User';
}

export default function ExpenseDetailModal({ expenseId, open, onOpenChange, canEdit, onEdit, onDeleted }: ExpenseDetailModalProps) {
  const { data: session } = useSession();
  const currentUserId = (session?.user as { id?: string } | undefined)?.id;
  const [expense, setExpense] = useState<Expense | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchExpense = useCallback(async () => {
    if (!expenseId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/expenses/${encodeURIComponent(expenseId)}`);
      if (!response.ok) {
        throw new Error('Failed to load expense');
      }
      const data = await response.json();
      setExpense(data);
    } catch {
      setError('Failed to load expense details');
    } finally {
      setIsLoading(false);
    }
  }, [expenseId]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (open && expenseId) {
      fetchExpense();
    }
  }, [open, expenseId, fetchExpense]);

  useEffect(() => {
    if (!open) {
      setExpense(null);
      setError(null);
      setDeleteError(null);
    }
  }, [open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleDelete = async () => {
    if (!expenseId) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/expenses/${encodeURIComponent(expenseId)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Expense deleted');
        onOpenChange(false);
        onDeleted?.();
      } else {
        let message = 'Failed to delete expense. Please try again.';
        if (response.status === 403) {
          message = 'You do not have permission to delete this expense.';
        } else {
          try {
            const data = await response.json();
            message = data.error || message;
          } catch {
            // ignore parse error
          }
        }
        setDeleteError(message);
        toast.error("Couldn't delete expense", { description: message });
      }
    } catch {
      const message = 'Failed to delete expense. Please try again.';
      setDeleteError(message);
      toast.error("Couldn't delete expense", { description: message });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!expenseId) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Expense Details</DialogTitle>
          <DialogDescription>View the full split breakdown for this expense.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-5 w-16" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="size-8 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16 ml-auto" />
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <p className="text-sm text-destructive py-4">{error}</p>
        ) : expense ? (
          <div className="space-y-4 py-4">
            <div>
              <h3 className="text-lg font-semibold">{expense.description}</h3>
              <p className="text-2xl font-bold">₹{expense.amount.toFixed(2)}</p>
            </div>

            <div className="flex items-center gap-3">
              {(() => {
                const Icon = getCategoryIcon(expense.category);
                return <Icon className="h-5 w-5 text-muted-foreground" />;
              })()}
              <Badge variant="secondary" className="capitalize">
                {expense.category}
              </Badge>
              <span className="text-sm text-muted-foreground">{formatDate(expense.date)}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Paid by:</span>
              <Avatar size="sm" className="h-6 w-6">
                {expense.paidBy.avatar ? (
                  <AvatarImage src={expense.paidBy.avatar} alt={expense.paidBy.name || ''} />
                ) : null}
                <AvatarFallback className="text-xs">
                  {getInitials(expense.paidBy.name || expense.paidBy._id)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">
                {expense.paidBy.name || expense.paidBy._id}
              </span>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Split Among</h4>
              <ul className="space-y-2">
                {expense.splitAmong.map((split) => {
                  const isCurrentUser = split.userId._id === currentUserId;
                  const percentage = ((split.amount / expense.amount) * 100).toFixed(1);

                  return (
                    <li
                      key={split.userId._id}
                      className={`flex items-center justify-between rounded-lg p-2 ${
                        isCurrentUser ? 'bg-muted/50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar size="sm" className="h-6 w-6">
                          {split.userId.avatar ? (
                            <AvatarImage src={split.userId.avatar} alt={split.userId.name || ''} />
                          ) : null}
                          <AvatarFallback className="text-xs">
                            {getInitials(getDisplayName(split.userId))}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{getDisplayName(split.userId)}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">₹{split.amount.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{percentage}%</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
              {canEdit && expense && onEdit && (
                <Button
                  onClick={() => {
                    onEdit(expense);
                  }}
                >
                  Edit
                </Button>
              )}
              {canEdit && expense && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Delete</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this expense?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the expense and its split details.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    {deleteError && (
                      <p className="text-sm text-destructive">{deleteError}</p>
                    )}
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={handleDelete}
                        disabled={isDeleting}
                      >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </DialogFooter>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}