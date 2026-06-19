'use client';

import { useSession } from 'next-auth/react';
import { X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type GroupMember = {
  userId: {
    _id: string;
    name?: string;
    email?: string;
    avatar?: string | null;
  };
  role: 'admin' | 'member';
  joinedAt: string;
};

type MemberListProps = {
  members: GroupMember[];
  currentUserRole: 'admin' | 'member';
  onRemoveMember: (userId: string) => void | Promise<void>;
};

function getDisplayName(user: GroupMember['userId']) {
  return user.name || user.email || 'User';
}

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

export default function MemberList({ members, currentUserRole, onRemoveMember }: MemberListProps) {
  const { data: session, status } = useSession();
  const currentUserId = (session?.user as { id?: string } | undefined)?.id;
  const canManageMembers = currentUserRole === 'admin';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Members</h2>
        <Badge variant="secondary">{members.length}</Badge>
      </div>

      <ul className="space-y-2">
        {members.map((member) => {
          const user = member.userId;
          const displayName = getDisplayName(user);
          const isCurrentUser = Boolean(currentUserId && currentUserId === user._id);
          const canRemove = canManageMembers && status !== 'loading' && currentUserId && currentUserId !== user._id;

          return (
            <li
              key={user._id}
              className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar>
                  {user.avatar ? <AvatarImage src={user.avatar} alt={displayName} /> : null}
                  <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{displayName}</p>
                  {isCurrentUser ? (
                    <p className="text-xs text-muted-foreground">You</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">{member.joinedAt}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>{member.role}</Badge>
                {canRemove ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 shrink-0 gap-1 px-2 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onRemoveMember(user._id)}
                    aria-label={`Remove ${displayName}`}
                  >
                    <X className="h-3.5 w-3.5" />
                    Remove
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
