'use client';

import { CheckCircle } from 'lucide-react';

export default function EmptySettlementState() {
  return (
    <div className="flex min-h-[160px] flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
      <CheckCircle className="mb-3 size-10 text-muted-foreground" />
      <h3 className="text-sm font-medium">No settlements in this category</h3>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        Completed or pending settlements will appear here.
      </p>
    </div>
  );
}