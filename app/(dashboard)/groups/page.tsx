'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import CreateGroupModal from '@/components/groups/CreateGroupModal';
import EmptyGroupsState from '@/components/groups/EmptyGroupsState';
import GroupCardSkeleton from '@/components/groups/GroupCardSkeleton';

type Group = {
  _id: string;
  name: string;
  description?: string;
  currency: string;
  createdAt: string;
  memberCount: number;
};

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const refetchGroups = async () => {
    setIsLoading(true);
    setFetchError(false);
    try {
      const response = await fetch('/api/groups');
      const data = await response.json();

      if (response.ok) {
        setGroups(data);
      } else {
        setFetchError(true);
      }
    } catch {
      setFetchError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    async function loadGroups() {
      try {
        const response = await fetch('/api/groups');
        const data = await response.json();

        if (response.ok) {
          setGroups(data);
        } else {
          setFetchError(true);
        }
      } catch {
        setFetchError(true);
      } finally {
        setIsLoading(false);
      }
    }

    loadGroups();
  }, []);

  const formatDate = (date: string) =>
    new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date));

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Your Groups</h1>
        <Button onClick={() => setIsModalOpen(true)}>+ Create Group</Button>
      </div>

      <CreateGroupModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={refetchGroups}
      />

      {fetchError && (
        <div className="flex min-h-[300px] flex-col items-center justify-center px-4 py-12 text-center">
          <h2 className="mb-2 text-2xl font-semibold">Could not load your groups</h2>
          <Button onClick={refetchGroups}>Try again</Button>
        </div>
      )}

      {!fetchError && isLoading && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <GroupCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!fetchError && !isLoading && groups.length === 0 && (
        <EmptyGroupsState onCreateClick={() => setIsModalOpen(true)} />
      )}

      {!isLoading && !fetchError && groups.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Link key={group._id} href={`/groups/${group._id}`}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-xl font-semibold">{group.name}</CardTitle>
                    <Badge variant="secondary">{group.currency}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <CardDescription className="line-clamp-3">
                    {group.description || 'No description'}
                  </CardDescription>
                </CardContent>
                <CardFooter className="flex flex-col items-start gap-2">
                  <span className="text-sm text-muted-foreground">
                    {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Created {formatDate(group.createdAt)}
                  </span>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
