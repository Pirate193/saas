'use client'

import { Edit, Loader2 } from 'lucide-react'
import React, { useState, useEffect } from 'react'

import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Id } from '@/convex/_generated/dataModel'
import { toast } from 'sonner'

interface Props {
    open:boolean;
    onOpenChange: (open: boolean) => void;
    folderId:Id<'folders'>
}

const UpdateDialog = ({ open, onOpenChange,folderId }: Props)  => {
   
    const updateFolder = useMutation(api.folders.updateFolder);
    const folder = useQuery(api.folders.getFolderById,{folderId:folderId})
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
   
    const [form, setForm] = useState({
        name: '',
        description: '',
    })
    
    useEffect(() => {
  if (!open || !folder) return;

  // Defer state update to avoid React warning
  queueMicrotask(() => {
    setForm(prev => {
      if (prev.name === folder.name && prev.description === folder.description) {
        return prev; // no changes
      }
      return {
        name: folder.name || '',
        description: folder.description || '',
      };
    });
  });
}, [open, folder?.name, folder?.description]);

   

   
    // Initialize form with folder data when dialog opens
  
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
       
        if (!form.name.trim()) {
            setError('Folder name is required.');
            setLoading(false);
            return;
        }
      
        try {
            await updateFolder({
                folderId:folderId,
                name: form.name.trim(),
                description: form.description.trim() || undefined,
            })
            toast.success('Folder updated successfully');
            setForm({ name: '', description: '' });
            onOpenChange(false);
            setLoading(false);
        } catch (err) {
          console.error(err);
            toast.error('Failed to update folder');
        }
    };
    const handleOpenChange = (isOpen: boolean) => {
        onOpenChange(isOpen);
        if (!isOpen) {
            // Reset form when closing
            setForm({ name: '', description: '' });
            setError(null);
        }
    };

    // Don't render if no folder is provided
    if (!folder) {
        return null;
    }
    

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
   
    <DialogContent className="sm:max-w-[425px]">
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>Update Folder</DialogTitle>
          <DialogDescription>
            Update the folder name and description.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Machine Learning Course"
              disabled={loading}
              maxLength={100}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Optional description for this folder..."
              disabled={loading}
              maxLength={500}
              rows={3}
            />
          </div>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !form.name.trim()}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Folder
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
  )
}

export default UpdateDialog