
'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, View, Edit } from 'lucide-react';

interface ItemActionMenuProps {
  onView: () => void;
  onEdit: () => void;
}

export function ItemActionMenu({ onView, onEdit }: ItemActionMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onView}>
          <View className="mr-2 h-4 w-4" />
          <span>View</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}>
          <Edit className="mr-2 h-4 w-4" />
          <span>Edit</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
