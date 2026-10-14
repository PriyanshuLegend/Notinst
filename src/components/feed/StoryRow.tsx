'use client';

import StoryAvatar from './StoryAvatar';
import type { StoryGroup } from '@/lib/types';

interface StoryRowProps {
  groups: StoryGroup[];
  onSelectGroup: (groupIndex: number) => void;
}

export default function StoryRow({ groups, onSelectGroup }: StoryRowProps) {
  return (
    <div className="overflow-x-auto scrollbar-hide">
      <div className="flex gap-4 px-4 py-3">
        {groups.map((group, i) => (
          <StoryAvatar
            key={group.user.id}
            group={group}
            onClick={() => onSelectGroup(i)}
          />
        ))}
      </div>
    </div>
  );
}
