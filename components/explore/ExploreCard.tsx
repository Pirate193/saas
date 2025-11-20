"use client";

import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Folder,
  FileText,
  CreditCard,
  File as FileIcon,
  Eye,
  Copy,
  Bookmark,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Skeleton } from "../ui/skeleton";
import { SaveButton } from "../saved/SaveButton";

interface ExploreCardProps {
  folder: Doc<"folders">;
}

function ItemCount({
  icon: Icon,
  label,
  count,
}: {
  icon: React.ElementType;
  label: string;
  count: number;
}) {
  if (count === 0) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      <span>
        {label}: {count}
      </span>
    </div>
  );
}

export const ExploreCardSkeleton = () => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Skeleton className="h-5 w-5 shrink-0" />
            <Skeleton className="h-5 w-3/4" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 h-10">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="pt-3 border-t">
          <Skeleton className="h-4 w-24" />
        </div>
      </CardContent>
    </Card>
  );
};

export const ExploreCard = ({ folder }: ExploreCardProps) => {
  const router = useRouter();

  // Fetch counts using public queries
  const notes = useQuery(api.public.getPublicFolderNotes, {
    folderId: folder._id,
  });
  const files = useQuery(api.public.getPublicFolderFiles, {
    folderId: folder._id,
  });
  const flashcards = useQuery(api.public.getPublicFolderFlashcards, {
    folderId: folder._id,
  });

  const isLoading =
    notes === undefined || files === undefined || flashcards === undefined;

  const handleCardClick = () => {
    router.push(`/public/${folder._id}`);
  };

  if (isLoading) {
    return <ExploreCardSkeleton />;
  }

  return (
    <Card
      key={folder._id}
      className="group  cursor-pointer overflow-hidden flex flex-col"
      onClick={handleCardClick}
    >
      <CardHeader className="">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Folder className="h-5 w-5 shrink-0 text-myprimary" />
            <CardTitle className="text-lg truncate" title={folder.name}>
              {folder.name}
            </CardTitle>
          </div>
          <SaveButton folderId={folder._id} variant="ghost" />
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4 flex flex-col flex-1">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 flex-1">
          <ItemCount icon={FileText} label="notes" count={notes?.length ?? 0} />
          <ItemCount icon={FileIcon} label="files" count={files?.length ?? 0} />
          <ItemCount
            icon={CreditCard}
            label="flashcards"
            count={flashcards?.length ?? 0}
          />
          {/* Display View and Clone counts */}
          <ItemCount icon={Eye} label="views" count={folder.viewCount ?? 0} />
          <ItemCount
            icon={Copy}
            label="clones"
            count={folder.cloneCount ?? 0}
          />
          <ItemCount
            icon={Bookmark}
            label="saved"
            count={folder.savedCount ?? 0}
          />
        </div>

        <div className="text-sm text-muted-foreground pt-3 border-t">
          <span>{format(new Date(folder._creationTime), "MMM dd, yyyy")}</span>
        </div>
      </CardContent>
    </Card>
  );
};
