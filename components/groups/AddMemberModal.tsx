'use client';

import { useState, type FormEvent, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

type UserSearchResult = {
  _id: string;
  name: string;
  email: string;
  avatar: string | null;
};

type AddMemberModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  onSuccess: () => void;
};

// TODO: Move to a shared utility file (e.g., '@/lib/utils/string.ts') to eliminate duplication with MemberList.tsx
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

export default function AddMemberModal({
  open,
  onOpenChange,
  groupId,
  onSuccess,
}: AddMemberModalProps) {
  const [email, setEmail] = useState('');
  const [foundUser, setFoundUser] = useState<UserSearchResult | null>(null);
  const [error, setError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  // Track the active search to abort stale network requests
  const abortControllerRef = useRef<AbortController | null>(null);

  function resetLocalState() {
    // Abort any ongoing searches when resetting or closing
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setEmail('');
    setFoundUser(null);
    setError('');
    setIsSearching(false);
    setIsAdding(false);
  }

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);

    if (!nextOpen) {
      resetLocalState();
    }
  }

  function handleEmailChange(nextEmail: string) {
    setEmail(nextEmail);

    // Cancel an active fetch if the user edits the input mid-request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsSearching(false);
    }

    if (foundUser || error) {
      setFoundUser(null);
      setError('');
    }
  }

  async function handleSearch(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setFoundUser(null);
      setError('Enter an email to search.');
      return;
    }

    // Cancel any previous pending search requests before starting a new one
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsSearching(true);
    setError('');
    setFoundUser(null);

    try {
      const response = await fetch(
        `/api/users/search?${new URLSearchParams({ email: trimmedEmail, groupId })}`,
        { signal: controller.signal }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error((data as { error?: string }).error || 'User not found');
      }

      setFoundUser(data as UserSearchResult);
      setIsSearching(false);
    } catch (err) {
      // Ignore errors caused by manual code cancellations
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      setFoundUser(null);
      setError(err instanceof Error ? err.message : 'User not found');
      setIsSearching(false);
    } finally {
      // Clear the ref if this specific controller finished its execution lifecycle
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }

  async function handleAddMember() {
    if (!foundUser) {
      return;
    }

    setIsAdding(true);
    setError('');

    try {
      const response = await fetch(`/api/groups/${encodeURIComponent(groupId)}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: foundUser.email }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error((data as { error?: string }).error || 'Failed to add member');
      }

      onOpenChange(false);
      resetLocalState();
      toast({ title: 'Member added', description: foundUser.name });
      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add member';
      setError(message);
      toast({ title: 'Member not added', description: message, variant: 'destructive' });
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Member</DialogTitle>
          <DialogDescription>
            Search for a user by email, preview their profile, then add them to this group.
          </DialogDescription>
        </DialogHeader>

         <div className="space-y-4">
           <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
            <Input
              type="email"
              value={email}
              onChange={(event) => handleEmailChange(event.target.value)}
              placeholder="user@example.com"
              aria-label="User email"
              disabled={isSearching || isAdding}
            />
            <Button type="submit" disabled={isSearching || isAdding || email.trim() === ''}>
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </form>

          {foundUser ? (
            <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
              <Avatar size="lg">
                {foundUser.avatar ? <AvatarImage src={foundUser.avatar} alt={foundUser.name} /> : null}
                <AvatarFallback>{getInitials(foundUser.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{foundUser.name}</p>
                <p className="truncate text-xs text-muted-foreground">{foundUser.email}</p>
              </div>
            </div>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isAdding}>
            Cancel
          </Button>
          <Button type="button" disabled={!foundUser || isAdding} onClick={handleAddMember}>
            {isAdding ? 'Adding...' : 'Add to Group'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
