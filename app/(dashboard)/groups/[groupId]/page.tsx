'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MemberList from '@/components/groups/MemberList';

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
  const { data: session, status } = useSession();
  const [group, setGroup] = useState<Group | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadGroup() {
      if (!groupId) {
        return;
      }

      const response = await fetch(`/api/groups/${groupId}`);
      const data = await response.json();

      if (response.ok && !ignore) {
        setGroup(data);
      }
    }

    loadGroup();

    return () => {
      ignore = true;
    };
  }, [groupId]);

  const handleRemoveMember = async (userId: string) => {
    const response = await fetch(`/api/groups/${groupId}/members/${userId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      const refetchResponse = await fetch(`/api/groups/${groupId}`);
      const refetchData = await refetchResponse.json();

      if (refetchResponse.ok) {
        setGroup(refetchData);
      }
    }
  };

  if (status === 'loading' || !session?.user?.id || !group) {
    return null;
  }

  const currentUserId = (session.user as { id: string }).id;
  const myRole =
    group.members.find((member) => member.userId._id === currentUserId)?.role ?? 'member';

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-6">
      {/* GroupHeader component goes here */}

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
