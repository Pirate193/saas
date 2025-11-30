"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "../ui/skeleton";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "../ui/empty";
import { FolderOpen } from "lucide-react";
import { Button } from "../ui/button";
interface MoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: Id<"folders">;
}
const MoveDialog = ({ open, onOpenChange, folderId }: MoveDialogProps) => {
  const folders = useQuery(api.folders.fetchFolders);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const move = useMutation(api.folders.movefolder);
  const [loading, setLoading] = useState(false);
  const folder = useQuery(api.folders.getFolderById, { folderId });
  const makeRoot = useMutation(api.folders.makeroot);
  const handleMove = async () => {
    try {
      if (!selectedFolderId) {
        throw new Error("No folder selected");
      }
      setLoading(true);
      move({
        folderId: folderId,
        parentId: selectedFolderId as Id<"folders">,
      });
      onOpenChange(false);
      setSelectedFolderId(null);
      toast.success(`Folder moved successfully`);
    } catch (error) {
      console.error(error);
      toast.error(`Failed to move folder`);
    } finally {
      setLoading(false);
    }
  };
  const handleMakeRoot = async () => {
    try {
      setLoading(true);
      makeRoot({ folderId });
      onOpenChange(false);
      toast.success(`Folder made root successfully`);
    } catch (error) {
      console.error(error);
      toast.error(`Failed to make folder root`);
    } finally {
      setLoading(false);
    }
  };
  if (folders === undefined) {
    return (
      <div>
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }
  const filteredFolders = folders
    .filter((folder) => folder._id !== folderId)
    .filter((folder) => folder.parentId !== folderId);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col  max-h-[calc(100vh-2rem)]  md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px] overflow-y-auto scrollbar-hidden">
        <DialogHeader>
          <DialogTitle>Move Folder</DialogTitle>
        </DialogHeader>
        <div>
          {folders.length === 0 && (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FolderOpen />
                </EmptyMedia>
                <EmptyTitle>No Folders Yet</EmptyTitle>
                <EmptyDescription>
                  You haven&apos;t created any folders yet to move to.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
          {folders.length > 0 && (
            <div>
              {filteredFolders.map((folder) => (
                <div
                  key={folder._id}
                  onClick={() => setSelectedFolderId(folder._id)}
                  className={`cursor-pointer p-4 my-2 bg-card rounded-md hover:bg-primary/10 
                     ${selectedFolderId === folder._id && "bg-primary hover:bg-primary"}`}
                >
                  <p>{folder.name}</p>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button onClick={() => setSelectedFolderId(null)}>Cancel</Button>
            <Button
              onClick={handleMove}
              disabled={loading || !selectedFolderId}
            >
              Move
            </Button>
            <Button
              onClick={handleMakeRoot}
              disabled={loading || folder?.parentId !== null}
            >
              Make Root
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MoveDialog;
