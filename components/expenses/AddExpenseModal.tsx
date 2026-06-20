'use client';

import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { calculateEqualSplit, calculatePercentageSplit, calculateExactSplit, validateSplitSum } from '@/lib/splitCalculator';
import { useToast } from '@/hooks/use-toast';

type GroupMember = {
  userId: string;
  name: string;
  avatar?: string;
};

type Expense = {
  _id: string;
  description: string;
  amount: number;
  category: 'food' | 'travel' | 'accommodation' | 'other';
  date: string;
  paidBy: string;
  splitAmong: Array<{
    userId: string;
    amount: number;
  }>;
  createdBy: {
    _id: string;
    name?: string;
    email?: string;
    avatar?: string;
  };
};

type AddExpenseModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  groupMembers: GroupMember[];
  onSuccess: () => void;
  currentUserId: string;
  existingExpense?: Expense | null;
};

export default function AddExpenseModal({
  open,
  onOpenChange,
  groupId,
  groupMembers,
  onSuccess,
  currentUserId,
  existingExpense,
}: AddExpenseModalProps) {
  const isEditing = !!existingExpense;
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paidBy, setPaidBy] = useState(currentUserId);
  const [splitMode, setSplitMode] = useState<'equal' | 'percentage' | 'exact'>('equal');

  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [percentageValues, setPercentageValues] = useState<Record<string, string>>({});
  const [exactAmountValues, setExactAmountValues] = useState<Record<string, string>>({});

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const abortControllerRef = useRef<AbortController | null>(null);

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }
  }

  function inferSplitMode(expense: Expense): 'equal' | 'percentage' | 'exact' {
    const splitAmounts = expense.splitAmong.map((s) => s.amount);
    const isAllEqual = splitAmounts.every((a, _, arr) => Math.abs(a - arr[0]) < 0.01);
    if (isAllEqual) return 'equal';
    return 'exact';
  }

  const prevOpenRef = useRef(open);
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      if (existingExpense) {
        setDescription(existingExpense.description);
        setAmount(existingExpense.amount.toString());
        setCategory(existingExpense.category);
        setDate(existingExpense.date);
        setPaidBy(existingExpense.paidBy);
        setSelectedMemberIds(existingExpense.splitAmong.map((s) => s.userId));
        setExactAmountValues(
          existingExpense.splitAmong.reduce(
            (acc, s) => ({ ...acc, [s.userId]: s.amount.toString() }),
            {}
          )
        );
        setSplitMode(inferSplitMode(existingExpense));
        setPercentageValues({});
      } else {
        setSelectedMemberIds(groupMembers.map((m) => m.userId));
        setPaidBy(currentUserId);
        setDescription('');
        setAmount('');
        setCategory('food');
        setDate(new Date().toISOString().split('T')[0]);
        setPercentageValues({});
        setExactAmountValues({});
      }
      setError('');
    }
    prevOpenRef.current = open;
  }, [open, groupMembers, currentUserId, existingExpense]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function getInitials(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  const totalAmount = parseFloat(amount) || 0;

  const equalSplits = calculateEqualSplit(
    totalAmount,
    selectedMemberIds.map((id) => {
      const member = groupMembers.find((m) => m.userId === id);
      return { userId: id, name: member?.name || '' };
    })
  );

  const percentageSplits = calculatePercentageSplit(
    totalAmount,
    groupMembers.map((m) => ({
      userId: m.userId,
      percentage: parseFloat(percentageValues[m.userId] || '0'),
    }))
  );

  const exactSplits = calculateExactSplit(
    groupMembers.map((m) => ({
      userId: m.userId,
      amount: parseFloat(exactAmountValues[m.userId] || '0'),
    })),
    totalAmount
  );

  const percentageTotal = groupMembers.reduce(
    (sum, m) => sum + (parseFloat(percentageValues[m.userId] || '0')),
    0
  );

  const { isValid: equalValid } = validateSplitSum(equalSplits, totalAmount);
  const { isValid: exactValid, difference: exactDiff } = validateSplitSum(exactSplits, totalAmount);
  const percentageValid = Math.abs(percentageTotal - 100) <= 1;

  const isSplitValid = splitMode === 'equal' ? equalValid : splitMode === 'percentage' ? percentageValid : exactValid;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isSplitValid) {
      return;
    }

    const numericAmount = parseFloat(amount);
    if (!description.trim() || !numericAmount || numericAmount <= 0) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const allSplits = splitMode === 'equal' ? equalSplits : splitMode === 'percentage' ? percentageSplits : exactSplits;
    const splits = allSplits.filter((s) => selectedMemberIds.includes(s.userId));

    try {
      const url = isEditing
        ? `/api/expenses/${encodeURIComponent(existingExpense!._id)}`
        : '/api/expenses';
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(isEditing ? {} : { groupId }),
          description: description.trim(),
          amount: numericAmount,
          paidBy,
          splitAmong: splits.map((s) => ({ userId: s.userId, amount: s.amount })),
          category,
          date,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${isEditing ? 'update' : 'create'} expense`);
      }

      if (isEditing) {
        toast({ title: 'Expense updated' });
      } else {
        toast({
          title: 'Expense added',
          description: `${description.trim()} - ₹${numericAmount.toFixed(2)}`,
        });
      }

      onOpenChange(false);
      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : `Failed to ${isEditing ? 'update' : 'create'} expense`;
      setError(message);
      toast({
        title: isEditing ? 'Expense not updated' : 'Expense not added',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function toggleMemberSelection(userId: string) {
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update this expense.' : 'Add a new expense to this group.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What did you spend on?"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory} disabled={isSubmitting}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="food">Food</SelectItem>
                  <SelectItem value="travel">Travel</SelectItem>
                  <SelectItem value="accommodation">Accommodation</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paidBy">Paid by</Label>
            <Select value={paidBy} onValueChange={setPaidBy} disabled={isSubmitting}>
              <SelectTrigger id="paidBy">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {groupMembers.map((m) => (
                  <SelectItem key={m.userId} value={m.userId}>
                    <div className="flex items-center gap-2">
                      <Avatar size="sm" className="h-6 w-6">
                        {m.avatar ? <AvatarImage src={m.avatar} alt={m.name} /> : null}
                        <AvatarFallback className="text-xs">{getInitials(m.name)}</AvatarFallback>
                      </Avatar>
                      <span>{m.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Split Mode</Label>
            <Tabs value={splitMode} onValueChange={(v) => setSplitMode(v as typeof splitMode)}>
              <TabsList className="grid w-full grid-cols-3 sm:grid-cols-3">
                <TabsTrigger value="equal">Equal</TabsTrigger>
                <TabsTrigger value="percentage">Percentage</TabsTrigger>
                <TabsTrigger value="exact">Exact Amount</TabsTrigger>
              </TabsList>

              <TabsContent value="equal" className="space-y-2">
                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {groupMembers.map((m) => (
                    <label key={m.userId} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedMemberIds.includes(m.userId)}
                        onChange={() => toggleMemberSelection(m.userId)}
                        disabled={isSubmitting}
                      />
                      <span className="flex-1 text-sm">{m.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {selectedMemberIds.includes(m.userId)
                          ? `₹${equalSplits.find((s) => s.userId === m.userId)?.amount.toFixed(2) || '0.00'}`
                          : '-'}
                      </span>
                    </label>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="percentage" className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Total:</span>
                  <span className={`text-xs ${percentageValid ? 'text-muted-foreground' : 'text-destructive'}`}>
                    {percentageTotal.toFixed(0)}%
                  </span>
                </div>
                {!percentageValid && (
                  <p className="text-xs text-destructive">Percentages must total 100%</p>
                )}
                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {groupMembers.map((m) => {
                    const split = percentageSplits.find((s) => s.userId === m.userId);
                    return (
                      <div key={m.userId} className="flex items-center gap-2">
                        <span className="w-32 text-sm">{m.name}</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={percentageValues[m.userId] || ''}
                          onChange={(e) =>
                            setPercentageValues((prev) => ({ ...prev, [m.userId]: e.target.value }))
                          }
                          placeholder="0"
                          disabled={isSubmitting}
                          className="h-7 w-20"
                        />
                        <span className="w-16 text-xs">%</span>
                        <span className="text-xs">₹{split?.amount.toFixed(2) || '0.00'}</span>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="exact" className="space-y-2">
                {!exactValid && (
                  <p className="text-xs text-destructive">
                    {exactDiff > 0 ? `₹${exactDiff.toFixed(2)} unaccounted for` : `₹${Math.abs(exactDiff).toFixed(2)} over allocated`}
                  </p>
                )}
                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {groupMembers.map((m) => (
                    <div key={m.userId} className="flex items-center gap-2">
                      <span className="w-32 text-sm">{m.name}</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={exactAmountValues[m.userId] || ''}
                        onChange={(e) =>
                          setExactAmountValues((prev) => ({ ...prev, [m.userId]: e.target.value }))
                        }
                        placeholder="0.00"
                        disabled={isSubmitting}
                        className="h-7 w-24"
                      />
                      <span className="text-xs text-muted-foreground">
                        {exactSplits.find((s) => s.userId === m.userId)?.percentage.toFixed(1) || 0}%
                      </span>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !isSplitValid}>
              {isSubmitting ? (isEditing ? 'Saving...' : 'Adding...') : isEditing ? 'Save Changes' : 'Add Expense'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
