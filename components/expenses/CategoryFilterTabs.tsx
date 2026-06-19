'use client';

import { Utensils, Plane, Hotel, Receipt, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';

type CategoryFilterTabsProps = {
  selectedCategory: 'all' | 'food' | 'travel' | 'accommodation' | 'other';
  onCategoryChange: (category: 'all' | 'food' | 'travel' | 'accommodation' | 'other') => void;
};

const categories: Array<{
  value: 'all' | 'food' | 'travel' | 'accommodation' | 'other';
  label: string;
  icon: typeof Utensils;
}> = [
  { value: 'all', label: 'All', icon: Layers },
  { value: 'food', label: 'Food', icon: Utensils },
  { value: 'travel', label: 'Travel', icon: Plane },
  { value: 'accommodation', label: 'Accommodation', icon: Hotel },
  { value: 'other', label: 'Other', icon: Receipt },
];

export default function CategoryFilterTabs({
  selectedCategory,
  onCategoryChange,
}: CategoryFilterTabsProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {categories.map(({ value, label, icon: Icon }) => (
        <Button
          key={value}
          variant={selectedCategory === value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onCategoryChange(value)}
        >
          <Icon className="h-4 w-4 mr-1.5" />
          {label}
        </Button>
      ))}
    </div>
  );
}