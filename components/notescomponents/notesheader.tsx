"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { SidebarTrigger } from "../ui/sidebar";
import { Skeleton } from "../ui/skeleton";
import Link from "next/link";
import {
  Copy,
  Download,
  Folder,
  Mic,
  MoreHorizontal,
  Pencil,
  SlashIcon,
  Sparkles,
  Trash,
} from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { useState } from "react";
import UpdateTitle from "./update-title";
import DeleteDialog from "../DeleteDialog";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  blockNoteToMarkdown,
  blockNoteToPlainText,
} from "@/lib/convertmarkdowntoblock";
import { useAiStore } from "@/stores/aiStore";
import { TranscribeDialog } from "./Transcribe";

interface Props {
  noteId: Id<"notes">;
}

const Notesheader = ({ noteId }: Props) => {
  const router = useRouter();
  const note = useQuery(api.notes.getNoteId, { noteId: noteId });
  const folder = useQuery(api.folders.getFolderById, {
    folderId: note?.folderId as Id<"folders">,
  });
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openRenameDialog, setOpenRenameDialog] = useState(false);
  const [openTranscribeDialog, setOpenTranscribeDialog] = useState(false);
  const deletenote = useMutation(api.notes.deleteNote);
  const { onOpen, isOpen } = useAiStore();

  if (!note || !folder) {
    return (
      <div>
        <Skeleton className="h-10 w-10" />
      </div>
    );
  }

  const handledelete = async () => {
    try {
      await deletenote({ noteId: noteId });
      toast.success("Note deleted successfully");
      router.push(`/folders/${folder._id}`);
    } catch (error) {
      console.log(error);
      toast.error("Failed to delete note");
    }
  };

  // --- FIX: Updated handleCopy to be async ---
  const handleCopy = async () => {
    if (!note.content) return;
    try {
      // 1. Await the async conversion
      const data = await blockNoteToPlainText(note.content);
      // 2. Write to clipboard
      navigator.clipboard.writeText(data);
      toast.success("Note copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy note.");
    }
  };

  // --- FIX: This is the new Export function ---
  const handleExportAsMarkdown = async () => {
    if (!note.content) return;
    try {
      // 1. Await the async conversion
      const markdown = await blockNoteToMarkdown(note.content);

      // 2. Create a Blob (a file in memory)
      const blob = new Blob([markdown], {
        type: "text/markdown;charset=utf-8",
      });

      // 3. Create a temporary URL for the Blob
      const url = URL.createObjectURL(blob);

      // 4. Create a hidden <a> element to trigger the download
      const a = document.createElement("a");
      a.href = url;
      a.download = `${note.title.replace(/ /g, "_")}.md`; // Create a clean filename

      // 5. Simulate a click to download the file
      document.body.appendChild(a); // Add link to the page
      a.click(); // Click the link

      // 6. Clean up
      document.body.removeChild(a); // Remove the link
      URL.revokeObjectURL(url); // Free up memory

      toast.success("Note exported as Markdown");
    } catch (error) {
      console.error("Failed to export note:", error);
      toast.error("Failed to export note.");
    }
  };
  return (
    <>
      <div className="p-4 flex items-center justify-between gap-2">
        {/*breadcrumb  */}
        <div>
          <div className="flex items-center gap-2  ">
            <SidebarTrigger />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link
                      href={`/folders/${folder._id}`}
                      className="flex items-center gap-2"
                    >
                      <Folder className="h-4 w-4" />
                      <span> {folder.name} </span>{" "}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <SlashIcon />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbPage>{note.title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isOpen && (
            <Button
              onClick={() => onOpen({ type: "note", id: noteId, name: "note" })}
            >
              <Sparkles className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setOpenTranscribeDialog(true)}
          >
            <Mic className=" h-8 w-8" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" aria-label="Open menu" size="icon-sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            {/* --- FIX: Updated DropdownMenuContent --- */}
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setOpenRenameDialog(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setOpenDeleteDialog(true)}
                className="text-destructive"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleExportAsMarkdown}>
                <Download className="mr-2 h-4 w-4" />
                Export as MD
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleCopy}>
                <Copy className="mr-2 h-4 w-4" />
                Copy as Text
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <UpdateTitle
        open={openRenameDialog}
        onOpenChange={setOpenRenameDialog}
        noteId={noteId}
      />
      <DeleteDialog
        open={openDeleteDialog}
        onOpenChange={setOpenDeleteDialog}
        title="Delete Note"
        description={`Are you sure you want to delete ${note.title} This action cannot be undone.`}
        itemName={note.title}
        onConfirm={handledelete}
      />
      <TranscribeDialog
        open={openTranscribeDialog}
        onOpenChange={setOpenTranscribeDialog}
        noteId={noteId}
      />
    </>
  );
};

export default Notesheader;
