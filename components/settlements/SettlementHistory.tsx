'use client';

import { useState } from 'react';

import MarkPaidDialog from './MarkPaidDialog';
import SettlementCard, { SettlementStatus } from './SettlementCard';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EmptySettlementState from './EmptySettlementState';

type Settlement = {
  _id: string;
  from: { _id: string; name?: string; avatar?: string | null };
  to: { _id: string; name?: string; avatar?: string | null };
  amount: number;
  status: SettlementStatus;
  createdAt: string;
};

type SettlementHistoryProps = {
  history: Settlement[];
  onRefetch: () => void;
};

export default function SettlementHistory({ history, onRefetch }: SettlementHistoryProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [dialogSettlement, setDialogSettlement] = useState<Settlement | null>(null);

  const filteredHistory = history.filter((item) => {
    if (activeFilter === 'all') return true;
    return item.status === activeFilter;
  });

  const openDialogFor = (settlement: Settlement) => {
    setDialogSettlement(settlement);
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      setDialogSettlement(null);
    }
  };

  if (history.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="mb-4">
        <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as typeof activeFilter)}>
          <TabsList className="w-full md:w-auto overflow-x-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

{filteredHistory.length === 0 ? (
          <EmptySettlementState />
        ) : (
        <div className="space-y-3">
          {filteredHistory.map((item) => (
            <SettlementCard
              key={item._id}
              from={{ name: item.from.name || 'Unknown', avatar: item.from.avatar }}
              to={{ name: item.to.name || 'Unknown', avatar: item.to.avatar }}
              amount={item.amount}
              status={item.status}
              onMarkPaid={item.status === 'pending' ? () => openDialogFor(item) : undefined}
            />
          ))}
        </div>
      )}

      <MarkPaidDialog
        settlementId={dialogSettlement?._id ?? ''}
        fromName={dialogSettlement?.from?.name || 'Unknown'}
        toName={dialogSettlement?.to?.name || 'Unknown'}
        amount={dialogSettlement?.amount ?? 0}
        open={!!dialogSettlement}
        onOpenChange={handleDialogOpenChange}
        onConfirmed={onRefetch}
      />
    </div>
  );
}