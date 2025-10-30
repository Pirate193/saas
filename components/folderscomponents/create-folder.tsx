'use client'
import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { Loader2, Plus } from 'lucide-react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';

interface CreateFolderProps {
   
    parentId?: string ;
    open:boolean;
    onOpenChange:(open:boolean)=>void;
}


const CreateFolder = ({open,onOpenChange,parentId}:CreateFolderProps) => {
   
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const createfolder = useMutation(api.folders.createFolder)
    
    const handleSubmit = async (e: React.FormEvent)=>{
        e.preventDefault();
        setLoading(true);
        setError(null);
        if(!formData.name.trim()){
            setError("Folder name is required.");
            setLoading(false);
            return;
        }
        try {
            await createfolder({
                name:formData.name,
                description:formData.description || undefined,
                parentId:parentId ,
            })
            toast.success("Folder created successfully");
            onOpenChange(false);
            setFormData({ name: '', description: '' });
        } catch (error) {
            console.error(error);
            setError("Failed to create folder. Please try again.");

        }
    }

    const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      // Reset form when closing
      setFormData({ name: '', description: '' });
   
    }
  }; 
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Create a new folder to organize your learning materials.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Machine Learning Course"
                disabled={loading}
                maxLength={100}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
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
            <Button type="submit" disabled={loading || !formData.name.trim()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Folder
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateFolder