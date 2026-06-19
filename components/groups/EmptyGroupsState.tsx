'use client';

import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

type EmptyGroupsStateProps = {
  onCreateClick: () => void;
};

export default function EmptyGroupsState({ onCreateClick }: EmptyGroupsStateProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center px-4 py-12 text-center">
      <Users className="mb-4 size-16 text-muted-foreground" />
      <h2 className="mb-2 text-2xl font-semibold">No groups yet</h2>
      <p className="mb-6 max-w-sm text-muted-foreground">
        Create a group to start splitting expenses with friends or roommates.
      </p>
      <Button onClick={onCreateClick}>Create your first group</Button>
    </div>
  );
}