'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import AddMemberModal from '@/components/groups/AddMemberModal';
import GroupHeader from '@/components/groups/GroupHeader';
import GroupDetailSkeleton from '@/components/groups/GroupDetailSkeleton';
import MemberList from '@/components/groups/MemberList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type GroupMember = {
  userId: {
    _id: string;
    name?: string;
    email?: string;
    avatar?: string;
  };
  role: 'admin' | 'member';
  joinedAt: string;
};

type Group = {
  _id: string;
  name: string;
  description?: string;
  currency: string;
  members: GroupMember[];
  createdBy: {
    _id: string;
    name?: string;
    email?: string;
    avatar?: string;
  };
  createdAt: string;
};

export default function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorState, setErrorState] = useState<'not-found' | 'unauthorized' | 'generic' | null>(null);
  const [addMemberOpen, setAddMemberOpen] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadGroup() {
      if (!groupId) {
        return;
      }

      try {
        const response = await fetch(`/api/groups/${encodeURIComponent(groupId)}`);
        const data = await response.json();

        if (!ignore) {
          if (response.ok) {
            setGroup(data);
            setErrorState(null);
          } else if (response.status === 404) {
            setErrorState('not-found');
          } else if (response.status === 403) {
            setErrorState('unauthorized');
          } else {
            setErrorState('generic');
          }
        }
      } catch {
        if (!ignore) {
          setErrorState('generic');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadGroup();

    return () => {
      ignore = true;
    };
  }, [groupId]);

  const refetchGroup = async () => {
    if (!groupId) {
      return;
    }

    try {
      const response = await fetch(`/api/groups/${encodeURIComponent(groupId)}`);
      const data = await response.json();

      if (response.ok) {
        setGroup(data);
        setErrorState(null);
      } else if (response.status === 404) {
        setErrorState('not-found');
      } else if (response.status === 403) {
        setErrorState('unauthorized');
      } else {
        setErrorState('generic');
      }
    } catch {
      setErrorState('generic');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    const response = await fetch(`/api/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      await refetchGroup();
    }
  };

  const handleDeleteGroup = async () => {
    const response = await fetch(`/api/groups/${encodeURIComponent(groupId)}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      router.push('/groups');
    }
  };

  if (!isLoading && errorState === 'not-found') {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center px-4 py-12 text-center">
        <h2 className="mb-2 text-2xl font-semibold">Group not found</h2>
        <p className="mb-6 max-w-sm text-muted-foreground">This group may have been deleted or the link is incorrect.</p>
        <Button asChild>
          <Link href="/groups">Back to groups</Link>
        </Button>
      </div>
    );
  }

  if (!isLoading && errorState === 'unauthorized') {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center px-4 py-12 text-center">
        <h2 className="mb-2 text-2xl font-semibold">Access denied</h2>
        <p className="mb-6 max-w-sm text-muted-foreground">You&apos;re not authorized to view this group.</p>
        <Button asChild>
          <Link href="/groups">Back to groups</Link>
        </Button>
      </div>
    );
  }

  if (!isLoading && errorState === 'generic') {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center px-4 py-12 text-center">
        <h2 className="mb-2 text-2xl font-semibold">Something went wrong</h2>
        <Button onClick={refetchGroup}>Try again</Button>
      </div>
    );
  }

  if (isLoading || status === 'loading' || !session?.user?.id || !group) {
    return <GroupDetailSkeleton />;
  }

  const currentUserId = (session.user as { id: string }).id;
  const myRole =
    group.members.find((member) => member.userId._id === currentUserId)?.role ?? 'member';

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-6">
      <GroupHeader
        group={group}
        currentUserRole={myRole}
        onAddMemberClick={() => setAddMemberOpen(true)}
        onDeleteGroup={handleDeleteGroup}
      />
      <AddMemberModal
        open={addMemberOpen}
        onOpenChange={setAddMemberOpen}
        groupId={groupId}
        onSuccess={refetchGroup}
      />

      <aside className="rounded-lg border bg-card p-6 text-card-foreground shadow-xs">
        <MemberList
          members={group.members}
          currentUserRole={myRole}
          onRemoveMember={handleRemoveMember}
        />
      </aside>

      <Tabs defaultValue="expenses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="settlements">Settlements</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle>Expenses</CardTitle>
              <CardDescription>Expense tracking coming soon</CardDescription>
            </CardHeader>
            <CardContent>Expense tracking coming soon</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balances">
          <Card>
            <CardHeader>
              <CardTitle>Balances</CardTitle>
              <CardDescription>Balance calculations coming soon</CardDescription>
            </CardHeader>
            <CardContent>Balance calculations coming soon</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settlements">
          <Card>
            <CardHeader>
              <CardTitle>Settlements</CardTitle>
              <CardDescription>Settlement tracking coming soon</CardDescription>
            </CardHeader>
            <CardContent>Settlement tracking coming soon</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
              <CardDescription>Group activity coming soon</CardDescription>
            </CardHeader>
            <CardContent>Group activity coming soon</CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
