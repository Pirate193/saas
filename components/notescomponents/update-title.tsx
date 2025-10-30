"use client";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface UpdateTitleProps {
  noteId: Id<"notes">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UpdateTitle = ({ noteId, open, onOpenChange }: UpdateTitleProps) => {
  const updateTitle = useMutation(api.notes.renameNote);
  const note = useQuery(api.notes.getNoteId, { noteId: noteId });
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (note && open) {
      queueMicrotask(() => {
        setTitle(note.title);
      });
    }
  }, [note, open]);
  const handlerename = async () => {
    setLoading(true);
    setError(null);
    try {
      await updateTitle({ noteId: noteId, title: title });
      setLoading(false);
      onOpenChange(false);
      toast.success("Note renamed successfully");
    } catch (error) {
      console.log(error);
      setError("Failed to rename note.");
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rename Note</DialogTitle>
        </DialogHeader>
        <div>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button disabled={loading} onClick={handlerename}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Rename
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateTitle;
