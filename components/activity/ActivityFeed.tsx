'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Receipt, UserPlus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyActivityState from './EmptyActivityState';

type Actor = {
  name: string;
  avatar: string | null;
};

type ActivityEvent = {
  type: 'expense_added' | 'member_joined' | 'settlement_completed';
  timestamp: string;
  actor: Actor;
  details: {
    description?: string;
    amount?: number;
    category?: string;
    to?: Actor;
  };
};

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

function formatTimeAgo(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 30) {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined }).format(date);
  }

  if (diffDays > 0) {
    return diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`;
  }

  if (diffHours > 0) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }

  if (diffMinutes > 0) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  }

  return 'Just now';
}

function EventIcon({ type }: { type: ActivityEvent['type'] }) {
  const className = 'size-4';

  if (type === 'expense_added') {
    return <Receipt className={className} />;
  }

  if (type === 'member_joined') {
    return <UserPlus className={className} />;
  }

  return <CheckCircle2 className={className} />;
}

function EventRow({ event }: { event: ActivityEvent }) {
  let sentence = '';
  const actor = event.actor.name;

  if (event.type === 'expense_added') {
    const description = event.details.description || 'an expense';
    const amount = event.details.amount != null ? event.details.amount : 0;
    sentence = `${actor} added an expense: ${description} (₹${amount.toLocaleString('en-IN')})`;
  } else if (event.type === 'member_joined') {
    sentence = `${actor} joined the group`;
  } else if (event.type === 'settlement_completed') {
    const toName = event.details.to?.name || 'Unknown';
    const amount = event.details.amount != null ? event.details.amount : 0;
    sentence = `${actor} paid ${toName} ₹${amount.toLocaleString('en-IN')}`;
  }

  return (
    <li className="flex items-start gap-3 rounded-lg border bg-card p-3">
      <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
        <EventIcon type={event.type} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug">{sentence}</p>
        <p className="mt-1 text-xs text-muted-foreground">{formatTimeAgo(event.timestamp)}</p>
      </div>
      <Avatar size="sm" className="hidden shrink-0 sm:flex">
        {event.actor.avatar ? <AvatarImage src={event.actor.avatar} alt={event.actor.name} /> : null}
        <AvatarFallback>{getInitials(event.actor.name)}</AvatarFallback>
      </Avatar>
    </li>
  );
}

type ActivityFeedProps = {
  groupId: string;
};

export default function ActivityFeed({ groupId }: ActivityFeedProps) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadActivity() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/activity?groupId=${encodeURIComponent(groupId)}`);

        if (!response.ok) {
          throw new Error('Unable to load activity');
        }

        const data: ActivityEvent[] = await response.json();

        if (!ignore) {
          setEvents(data);
        }
      } catch {
        if (!ignore) {
          setError('Unable to load activity feed');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadActivity();

    return () => {
      ignore = true;
    };
  }, [groupId]);

  const sortedEvents = useMemo(() => {
    return Array.isArray(events) 
  ? [...events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  : [];
  }, [events]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {sortedEvents.length === 0 ? (
          <EmptyActivityState />
        ) : (
          <ul className="space-y-3">
            {sortedEvents.map((event, index) => (
              <EventRow key={`${event.type}-${event.timestamp}-${event.actor.name}-${index}`} event={event} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
