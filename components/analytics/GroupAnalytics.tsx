'use client';

import { useEffect, useMemo, useState } from 'react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import TopSpenderCard from '@/components/analytics/TopSpenderCard';

type PersonSpend = {
  userId: string;
  name: string;
  avatar?: string | null;
  totalPaid: number;
};

type CategorySpend = {
  category: string;
  total: number;
};

type AnalyticsResponse = {
  totalSpend: number;
  perPersonSpend: PersonSpend[];
  byCategory: CategorySpend[];
  topSpender: PersonSpend | null;
};

type GroupAnalyticsProps = {
  groupId: string;
  currency: string;
};

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7', '#84cc16', '#f97316'];

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function formatCategory(category: string) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return 'U';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function CategoryPieChart({ data, currency }: { data: CategorySpend[]; currency: string }) {
  const chartData = data.map((item, index) => ({
    ...item,
    color: COLORS[index % COLORS.length],
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-[260px] flex-col items-center justify-center text-center text-sm text-muted-foreground">
        <p>No category spend yet</p>
        <p>Add expenses to see the spending breakdown.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="total"
          nameKey="category"
          cx="50%"
          cy="50%"
          innerRadius={64}
          outerRadius={100}
          paddingAngle={2}
          label={(entry: PieLabelRenderProps) => `${(entry.percent * 100).toFixed(0)}%`}
        >
          {chartData.map((entry) => (
            <Cell key={entry.category} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, _name, item) => {
            const payload = item.payload as CategorySpend & { percent?: number };
            const percent = payload?.percent ?? 0;

            return [`${formatMoney(Number(value), currency)} (${(percent * 100).toFixed(1)}%)`, 'Total'];
          }}
        />
        <Legend
          formatter={(value) => (
            <span className="text-sm">{formatCategory(String(value))}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

function PerPersonBreakdown({ items, currency }: { items: PersonSpend[]; currency: string }) {
  const maxPaid = items[0]?.totalPaid ?? 0;

  if (items.length === 0) {
    return (
      <div className="flex min-h-[180px] flex-col items-center justify-center text-center text-sm text-muted-foreground">
        <p>No spending breakdown yet</p>
        <p>Add expenses to compare member totals.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const width = maxPaid > 0 ? Math.max((item.totalPaid / maxPaid) * 100, 6) : 0;

        return (
          <div key={item.userId} className="space-y-2">
            <div className="flex items-center justify-between gap-4 text-sm">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar size="sm">
                  {item.avatar ? <AvatarImage src={item.avatar} alt={item.name} /> : null}
                  <AvatarFallback>{getInitials(item.name)}</AvatarFallback>
                </Avatar>
                <span className="truncate font-medium">{item.name}</span>
              </div>
              <span className="shrink-0 font-semibold">{formatMoney(item.totalPaid, currency)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function GroupAnalytics({ groupId, currency }: GroupAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadAnalytics() {
      try {
        const response = await fetch(`/api/groups/${encodeURIComponent(groupId)}/analytics`);

        if (!response.ok) {
          if (!ignore) {
            setError('Unable to load analytics');
          }
          return;
        }

        const data: AnalyticsResponse = await response.json();

        if (!ignore) {
          setAnalytics(data);
        }
      } catch {
        if (!ignore) {
          setError('Unable to load analytics');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadAnalytics();

    return () => {
      ignore = true;
    };
  }, [groupId]);

  const sortedPerPersonSpend = useMemo(() => {
    return [...(analytics?.perPersonSpend ?? [])].sort(
      (a, b) => b.totalPaid - a.totalPaid || a.name.localeCompare(b.name)
    );
  }, [analytics?.perPersonSpend]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
          <Card>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-40" />
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-36" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[280px] w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[280px] w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics unavailable</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Spend</CardTitle>
            <CardDescription>All expenses in this group</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{formatMoney(analytics?.totalSpend ?? 0, currency)}</p>
            <Badge variant="secondary" className="mt-2">
              {analytics?.perPersonSpend.length ?? 0} members
            </Badge>
          </CardContent>
        </Card>
        <TopSpenderCard topSpender={analytics?.topSpender ?? null} currency={currency} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
            <CardDescription>Spending by expense category</CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryPieChart data={analytics?.byCategory ?? []} currency={currency} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Per-Person Spending</CardTitle>
            <CardDescription>Total paid by each member</CardDescription>
          </CardHeader>
          <CardContent>
            <PerPersonBreakdown items={sortedPerPersonSpend} currency={currency} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
