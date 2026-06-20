'use client';

import { useState } from 'react';
import { Settings } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

type GroupHeaderProps = {
  group: {
    name: string;
    description?: string | null;
    currency: string;
    members: unknown[];
  };
  currentUserRole: 'admin' | 'member';
  onAddMemberClick: () => void;
  onDeleteGroup: () => void | Promise<void>;
};

export default function GroupHeader({
  group,
  currentUserRole,
  onAddMemberClick,
  onDeleteGroup,
}: GroupHeaderProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const description = group.description?.trim();

  async function handleDeleteGroup() {
    setIsDeleting(true);

    try {
      await onDeleteGroup();
      toast({ title: 'Group deleted' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete group';
      toast({ title: 'Group not deleted', description: message, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className="space-y-4 rounded-xl border bg-card p-6 text-card-foreground shadow-xs">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{group.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {description || 'No description'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{group.currency}</Badge>
            <span className="text-sm text-muted-foreground">
              {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
            </span>
          </div>
        </div>

        {currentUserRole === 'admin' ? (
          <div className="flex shrink-0 items-center gap-2">
            <Button type="button" onClick={onAddMemberClick}>
              + Add Member
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="icon" aria-label="Group settings">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setIsDeleteDialogOpen(true)}
                >
                  Delete Group
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : null}
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete group?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the group. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button type="button" variant="destructive" disabled={isDeleting} onClick={handleDeleteGroup}>
                {isDeleting ? 'Deleting...' : 'Delete Group'}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
