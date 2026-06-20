'use client';

import { useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

type MarkPaidDialogProps = {
  settlementId: string;
  fromName: string;
  toName: string;
  amount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmed: () => void;
};

function formatAmount(amount: number) {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function MarkPaidDialog({
  settlementId,
  fromName,
  toName,
  amount,
  open,
  onOpenChange,
  onConfirmed,
}: MarkPaidDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);

    if (!nextOpen) {
      setError(null);
    }
  };

  const handleConfirm = async () => {
    setIsConfirming(true);
    setError(null);

    try {
      const response = await fetch(`/api/settlements/${encodeURIComponent(settlementId)}`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        let message = 'Failed to mark settlement as paid';

        const data = await response.json().catch(() => ({}));

        if (typeof data?.error === 'string') {
          message = data.error;
        }

        setError(message);
        toast({ title: 'Settlement not paid', description: message, variant: 'destructive' });
        return;
      }

      onOpenChange(false);
      onConfirmed();
      toast({ title: 'Settlement paid' });
    } catch {
      const message = 'Failed to mark settlement as paid';
      setError(message);
      toast({ title: 'Settlement not paid', description: message, variant: 'destructive' });
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Mark this settlement as paid?</AlertDialogTitle>
          <AlertDialogDescription>
            {fromName} → {toName}: ₹{formatAmount(amount)}. This confirms the payment has been completed and cannot be
            easily undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button type="button" onClick={handleConfirm} disabled={isConfirming}>
              {isConfirming ? 'Marking as paid...' : 'Confirm'}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
