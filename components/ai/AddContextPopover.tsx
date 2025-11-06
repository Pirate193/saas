'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Doc } from '@/convex/_generated/dataModel';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Folder, Plus, Search } from 'lucide-react';

interface AddContextPopoverProps {
  onSelectFolder: (folder: Doc<'folders'>) => void;
}

export function AddContextPopover({ onSelectFolder }: AddContextPopoverProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const folders = useQuery(api.folders.fetchFolders);

  const filteredFolders = folders?.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (folder: Doc<'folders'>) => {
    onSelectFolder(folder);
    setOpen(false);
    setSearch('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-1"
          aria-label="Add context"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Add Context</h4>
            <p className="text-sm text-muted-foreground">
              Select a folder to use as context for your question.
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search folders..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            {filteredFolders && filteredFolders.length > 0 ? (
              filteredFolders.map((folder) => (
                <Button
                  key={folder._id}
                  variant="ghost"
                  className="justify-start gap-2"
                  onClick={() => handleSelect(folder)}
                >
                  <Folder className="h-4 w-4" />
                  <span className="truncate">{folder.name}</span>
                </Button>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">
                {folders === undefined ? 'Loading...' : 'No folders found.'}
              </p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}