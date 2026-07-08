"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface AccountInfoCardProps {
  memberSince: Date | string;
}

interface DashboardStats {
  activeGroupsCount: number;
}

function formatMemberSince(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return `Member since ${date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })}`;
}

export default function AccountInfoCard({ memberSince }: AccountInfoCardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      try {
        const res = await fetch("/api/dashboard/stats");
        if (!res.ok) throw new Error();
        const data = (await res.json()) as DashboardStats;
        if (!cancelled) {
          setStats(data);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    }

    loadStats();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card size="sm">
      <CardContent className="space-y-2 text-sm">
        <p className="text-foreground">{formatMemberSince(memberSince)}</p>
        {loading ? (
          <Skeleton className="h-4 w-36" />
        ) : error ? (
          <p className="text-muted-foreground">Active groups unavailable</p>
        ) : (
          <p className="text-muted-foreground">
            Active in {stats?.activeGroupsCount} group{stats?.activeGroupsCount === 1 ? "" : "s"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
