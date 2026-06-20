'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import SettlementCard from '@/components/settlements/SettlementCard';

type Transaction = {
  from: string;
  to: string;
  amount: number;
};

type GreedyResult = {
  transactions: Transaction[];
  count: number;
  timeMs: number;
};

type OptimalResult = {
  transactions: Transaction[];
  count: number;
  timeMs: number;
};

type SkippedOptimal = {
  skipped: true;
  reason: string;
};

type SettlementSuggestionsProps = {
  groupId: string;
  greedy: GreedyResult;
  optimal: OptimalResult | SkippedOptimal;
  groupMembers: Array<{ userId: string; name: string; avatar?: string | null }>;
  onSettlementsSaved: () => void;
  balancesCount: number;
};

function getMemberName(userId: string, members: SettlementSuggestionsProps['groupMembers']) {
  const member = members.find((m) => m.userId === userId);
  return member?.name || 'Unknown';
}

function getMemberAvatar(userId: string, members: SettlementSuggestionsProps['groupMembers']) {
  const member = members.find((m) => m.userId === userId);
  return member?.avatar || null;
}

export default function SettlementSuggestions({
  groupId,
  greedy,
  optimal,
  groupMembers,
  onSettlementsSaved,
  balancesCount,
}: SettlementSuggestionsProps) {
  const [selectedMode, setSelectedMode] = useState<'greedy' | 'optimal'>('greedy');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const selectedTransactions = selectedMode === 'greedy' ? greedy.transactions : 'skipped' in optimal ? [] : optimal.transactions;
  const selectedCount = selectedMode === 'greedy' ? greedy.count : 'skipped' in optimal ? 0 : optimal.count;

  const originalBaseline = balancesCount > 0 ? balancesCount : 1;

  const reductionPercentage = originalBaseline > 0
    ? Math.round(((originalBaseline - selectedCount) / originalBaseline) * 100)
    : 0;

  const canSelectOptimal = !('skipped' in optimal);

  const handleSave = async () => {
    if (selectedTransactions.length === 0) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          algorithmUsed: selectedMode,
          transactions: selectedTransactions,
        }),
      });

      if (response.ok) {
        onSettlementsSaved();
        toast({ title: 'Settlements saved', description: `${selectedCount} transactions saved` });
      } else {
        const data = await response.json().catch(() => ({}));
        const message = typeof data.error === 'string' ? data.error : 'Failed to save settlements';
        setError(message);
        toast({ title: 'Settlements not saved', description: message, variant: 'destructive' });
      }
    } catch {
      const message = 'Failed to save settlements';
      setError(message);
      toast({ title: 'Settlements not saved', description: message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Original:</span>{' '}
          <span className="font-medium">{originalBaseline} txns</span>
        </div>
        <div>
          <span className="text-muted-foreground">Greedy:</span>{' '}
          <span className="font-medium">{greedy.count} txns</span>{' '}
          <span className="text-muted-foreground">({greedy.timeMs}ms)</span>
        </div>
        <div>
          <span className="text-muted-foreground">Optimal:</span>{' '}
          {'skipped' in optimal ? (
            <span className="text-muted-foreground">Skipped — group has more than 20 members</span>
          ) : (
            <>
              <span className="font-medium">{optimal.count} txns</span>{' '}
              <span className="text-muted-foreground">({optimal.timeMs}ms)</span>
            </>
          )}
        </div>
        {canSelectOptimal && optimal.count < greedy.count && (
          <Badge variant="secondary">
            Optimal saves {greedy.count - optimal.count} transactions vs greedy
          </Badge>
        )}
        <div>
          <span className="text-muted-foreground">Reduction:</span>{' '}
          <span className="font-medium">{reductionPercentage}%</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            variant={selectedMode === 'greedy' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedMode('greedy')}
          >
            Greedy
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    variant={selectedMode === 'optimal' && canSelectOptimal ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => canSelectOptimal && setSelectedMode('optimal')}
                    disabled={!canSelectOptimal}
                    className={!canSelectOptimal ? 'opacity-50' : ''}
                  >
                    Optimal
                  </Button>
                </div>
              </TooltipTrigger>
              {!canSelectOptimal && (
                <TooltipContent>
                  <p>Optimal algorithm only runs for groups of 20 or fewer members</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Greedy Transactions</h4>
            {greedy.transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No transactions needed</p>
            ) : (
              <div className="space-y-2">
                {greedy.transactions.map((t, i) => (
                  <SettlementCard
                    key={i}
                    from={{ name: getMemberName(t.from, groupMembers), avatar: getMemberAvatar(t.from, groupMembers) }}
                    to={{ name: getMemberName(t.to, groupMembers), avatar: getMemberAvatar(t.to, groupMembers) }}
                    amount={t.amount}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Optimal Transactions</h4>
            {'skipped' in optimal ? (
              <p className="text-sm text-muted-foreground">Skipped — group has more than 20 members</p>
            ) : optimal.transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No transactions needed</p>
            ) : (
              <div className="space-y-2">
                {optimal.transactions.map((t, i) => (
                  <SettlementCard
                    key={i}
                    from={{ name: getMemberName(t.from, groupMembers), avatar: getMemberAvatar(t.from, groupMembers) }}
                    to={{ name: getMemberName(t.to, groupMembers), avatar: getMemberAvatar(t.to, groupMembers) }}
                    amount={t.amount}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <Button
          onClick={handleSave}
          disabled={selectedTransactions.length === 0 || isSaving}
        >
          {isSaving ? 'Saving...' : 'Save These Settlements'}
        </Button>
      </div>
    </div>
  );
}