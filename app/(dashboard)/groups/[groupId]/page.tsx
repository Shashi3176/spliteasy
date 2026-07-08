'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { PlusIcon, RefreshCw } from 'lucide-react';
import AddMemberModal from '@/components/groups/AddMemberModal';
import AddExpenseModal from '@/components/expenses/AddExpenseModal';
import ExpenseList from '@/components/expenses/ExpenseList';
import ExpenseDetailModal from '@/components/expenses/ExpenseDetailModal';
import GroupHeader from '@/components/groups/GroupHeader';
import GroupDetailSkeleton from '@/components/groups/GroupDetailSkeleton';
import MemberList from '@/components/groups/MemberList';
import BalancesView from '@/components/settlements/BalancesView';
import SettlementSuggestions from '@/components/settlements/SettlementSuggestions';
import SettlementHistory from '@/components/settlements/SettlementHistory';
import SettledUpState from '@/components/settlements/SettledUpState';
import GroupAnalytics from '@/components/analytics/GroupAnalytics';
import ActivityFeed from '@/components/activity/ActivityFeed';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';

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
  const { toast } = useToast();
  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorState, setErrorState] = useState<'not-found' | 'unauthorized' | 'generic' | null>(null);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [expenseKey, setExpenseKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
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
    createdBy: { _id: string };
  }>(null);

  const [settlementsData, setSettlementsData] = useState<{
    balances: Array<{ userId: string; amount: number }>;
    greedy: { transactions: Array<{ from: string; to: string; amount: number }>; count: number; timeMs: number };
    optimal: { transactions: Array<{ from: string; to: string; amount: number }>; count: number; timeMs: number } | { skipped: true; reason: string };
    history: Array<{
      _id: string;
      from: { _id: string; name?: string; avatar?: string | null };
      to: { _id: string; name?: string; avatar?: string | null };
      amount: number;
      status: 'pending' | 'completed';
      createdAt: string;
    }>;
    beforeEdges: Array<{ from: string; to: string; amount: number }>;
  } | null>(null);

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

  const fetchSettlements = useCallback(async () => {
    if (!groupId) {
      return;
    }

    try {
      const response = await fetch(`/api/settlements?groupId=${encodeURIComponent(groupId)}`);
      if (response.ok) {
        const data = await response.json();
        setSettlementsData(data);
      }
    } catch {
      // Silently fail
    }
  }, [groupId]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSettlements();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [fetchSettlements]);

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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchGroup(), fetchSettlements()]);
      setExpenseKey((k) => k + 1);
    } catch {
      // Silently fail
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      const response = await fetch(`/api/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        await refetchGroup();
        toast({ title: 'Member removed' });
        return;
      }

      const message = typeof data.error === 'string' ? data.error : 'Failed to remove member';
      toast({ title: 'Member not removed', description: message, variant: 'destructive' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove member';
      toast({ title: 'Member not removed', description: message, variant: 'destructive' });
    }
  };

  const handleDeleteGroup = async () => {
    const response = await fetch(`/api/groups/${encodeURIComponent(groupId)}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      router.push('/groups');
      return;
    }

    const data = await response.json().catch(() => ({}));
    const message = typeof data.error === 'string' ? data.error : 'Failed to delete group';
    throw new Error(message);
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

  const allSettled =
    settlementsData?.balances.every((b) => Math.abs(b.amount) < 0.01) &&
    (settlementsData?.history?.filter((h) => h.status === 'pending').length ?? 0) === 0;

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
          <TabsList className="w-full md:w-auto overflow-x-auto">
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="balances">Balances</TabsTrigger>
            <TabsTrigger value="settlements">Settlements</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="ml-auto"
              aria-label="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </TabsList>

        <TabsContent value="expenses" className="space-y-4">
          <ErrorBoundary>
            <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
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
                  const source = expense as {
                    _id: string;
                    description: string;
                    amount: number;
                    category: 'food' | 'travel' | 'accommodation' | 'other';
                    date: string;
                    paidBy: { _id: string };
                    splitAmong: Array<{ userId: { _id: string }; amount: number }>;
                    createdBy?: { _id: string };
                  };
                  setExpenseForEdit({
                    _id: source._id,
                    description: source.description,
                    amount: source.amount,
                    category: source.category,
                    date: source.date,
                    paidBy: source.paidBy._id,
                    splitAmong: source.splitAmong.map((s) => ({
                      userId: s.userId._id,
                      amount: s.amount,
                    })),
                    createdBy: source.createdBy ?? { _id: '' },
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
            </div>
          </ErrorBoundary>
        </TabsContent>

<TabsContent value="balances">
          <ErrorBoundary>
            <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-200">
              <BalancesView
                balances={
                  settlementsData?.balances.map((b) => {
                    const member = group?.members.find((m) => m.userId._id === b.userId)?.userId;
                    return {
                      userId: b.userId,
                      name: member?.name || member?.email || 'Unknown',
                      avatar: member?.avatar,
                      netBalance: b.amount,
                    };
                  }) || []
                }
              />
            </div>
          </ErrorBoundary>
        </TabsContent>

<TabsContent value="settlements">
          <ErrorBoundary>
            <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-200">
              {settlementsData ? (
              allSettled ? (
                <SettledUpState />
              ) : (
                <div className="space-y-6">

                  <SettlementSuggestions
                    groupId={groupId}
                    greedy={settlementsData.greedy}
                    optimal={settlementsData.optimal}
                    groupMembers={group?.members.map((m) => ({
                      userId: m.userId._id,
                      name: m.userId.name || m.userId.email || 'Unknown',
                      avatar: m.userId.avatar,
                    })) || []}
                    onSettlementsSaved={fetchSettlements}
                    balancesCount={settlementsData.balances.length}
                  />

                  {settlementsData.history && settlementsData.history.length > 0 ? (
                    <SettlementHistory history={settlementsData.history} onRefetch={fetchSettlements} />
                  ) : null}
                </div>
              )
            ) : (
              <Card>
              <CardHeader>
                <CardTitle>Settlements</CardTitle>
                <CardDescription>Loading suggestions...</CardDescription>
              </CardHeader>
            </Card>
            )}
          </div>
        </ErrorBoundary>
      </TabsContent>

      <TabsContent value="activity">
        <ErrorBoundary>
          <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-200">
            <ActivityFeed groupId={groupId as string} />
          </div>
        </ErrorBoundary>
      </TabsContent>

      <TabsContent value="analytics">
        <ErrorBoundary>
          <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-200">
            <GroupAnalytics groupId={groupId} currency={group.currency} />
          </div>
        </ErrorBoundary>
      </TabsContent>
      </Tabs>
    </div>
  );
}
