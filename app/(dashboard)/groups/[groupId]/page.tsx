'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';
import AddMemberModal from '@/components/groups/AddMemberModal';
import AddExpenseModal from '@/components/expenses/AddExpenseModal';
import ExpenseList from '@/components/expenses/ExpenseList';
import ExpenseDetailModal from '@/components/expenses/ExpenseDetailModal';
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
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [expenseKey, setExpenseKey] = useState(0);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [expenseForEdit, setExpenseForEdit] = useState<null | {
    _id: string;
    description: string;
    amount: number;
    category: 'food' | 'travel' | 'accommodation' | 'other';
    date: string;
    paidBy: string;
    splitAmong: Array<{ userId: string; amount: number }>;
  }>(null);

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

        <TabsContent value="expenses" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Expenses</h3>
              <p className="text-sm text-muted-foreground">Track and manage group expenses</p>
            </div>
            <Button onClick={() => setAddExpenseOpen(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </div>

          <ExpenseList
            key={expenseKey}
            groupId={groupId}
            onExpenseClick={(expense) => {
              setSelectedExpenseId(expense._id);
              setDetailModalOpen(true);
            }}
            onAddExpenseClick={() => setAddExpenseOpen(true)}
          />
          <ExpenseDetailModal
            expenseId={selectedExpenseId}
            open={detailModalOpen}
            onOpenChange={setDetailModalOpen}
            canEdit={group?.createdBy._id === currentUserId || myRole === 'admin'}
            onEdit={(expense) => {
              setExpenseForEdit({
                _id: expense._id,
                description: expense.description,
                amount: expense.amount,
                category: expense.category,
                date: expense.date,
                paidBy: expense.paidBy._id,
                splitAmong: expense.splitAmong.map((s) => ({
                  userId: s.userId._id,
                  amount: s.amount,
                })),
              });
              setDetailModalOpen(false);
              setAddExpenseOpen(true);
            }}
            onDeleted={() => {
              setExpenseKey((k) => k + 1);
            }}
          />
          <AddExpenseModal
            open={addExpenseOpen}
            onOpenChange={(open) => {
              setAddExpenseOpen(open);
              if (!open) {
                setExpenseForEdit(null);
              }
            }}
            groupId={groupId}
            groupMembers={group.members.map((m) => ({
              userId: m.userId._id,
              name: m.userId.name || m.userId.email || 'Unknown',
              avatar: m.userId.avatar,
            }))}
            currentUserId={currentUserId}
            onSuccess={() => {
              setExpenseKey((k) => k + 1);
              setExpenseForEdit(null);
            }}
            existingExpense={expenseForEdit}
          />
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
