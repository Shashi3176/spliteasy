'use client';

import { Receipt } from 'lucide-react';

export default function EmptyActivityState() {
  return (
    <div className="flex min-h-[160px] flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
      <Receipt className="mb-3 size-10 text-muted-foreground" />
      <h3 className="text-sm font-medium">No activity yet</h3>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        Actions in this group will show up here.
      </p>
    </div>
  );
}