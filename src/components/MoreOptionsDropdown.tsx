import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical } from 'lucide-react';

interface MoreOptionsDropdownProps {
  onExport: () => void;
  onImport: () => void;
  onNewSet: () => void;
  onEdit: () => void;
}

export function MoreOptionsDropdown({ onExport, onImport, onNewSet, onEdit }: MoreOptionsDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="sm:hidden">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">More options</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onExport}>
          Export
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onImport}>
          Import
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onNewSet}>
          New Set
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}>
          Edit
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
