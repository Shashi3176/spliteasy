'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsList } from '@/components/ui/tabs';

export default function GroupDetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 py-6">
      <section className="space-y-4 rounded-xl border bg-card p-6 text-card-foreground shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <div>
              <Skeleton className="mb-2 h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-5 w-12 rounded-full" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-9 rounded-md" />
          </div>
        </div>
      </section>

      <aside className="rounded-lg border bg-card p-6 text-card-foreground shadow-xs">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-8 rounded-full" />
          </div>

          <ul className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Skeleton className="size-8 rounded-full" />
                  <div className="min-w-0">
                    <Skeleton className="mb-1 h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-5 w-12 rounded-full" />
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <Tabs defaultValue="expenses" className="space-y-4">
        <TabsList>
          <Skeleton className="h-8 w-16 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-full" />
        </TabsList>

        <Card>
          <CardHeader>
            <Skeleton className="mb-2 h-6 w-24" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}