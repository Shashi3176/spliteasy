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

  const refetchGroups = async () => {
    const response = await fetch('/api/groups');
    const data = await response.json();

    if (response.ok) {
      setGroups(data);
    }
  };

  useEffect(() => {
    async function loadGroups() {
      const response = await fetch('/api/groups');
      const data = await response.json();

      if (response.ok) {
        setGroups(data);
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

      {groups.length > 0 && (
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
