"use client";

import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "../ui/empty";
import { Button } from "../ui/button";
import { FolderOpen } from "lucide-react"; // Import FolderOpen
import { useState } from "react";

import { useRouter } from "next/navigation";
import { FolderCardSkeleton, SavedCard } from "./SavedCard";

function FolderListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <FolderCardSkeleton key={i} />
      ))}
    </div>
  );
}

export const SavedList = () => {
  const router = useRouter();
  const folders = useQuery(api.saving.getSavedFolderDetails);

  const [opencreatefolderdialog, setOpenCreateFolderDialog] = useState(false);

  if (folders === undefined) {
    return <FolderListSkeleton />;
  }

  return (
    <div className="flex-1">
      {folders.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderOpen />
            </EmptyMedia>
            <EmptyTitle>No Folders Yet</EmptyTitle>
            <EmptyDescription>
              You haven&apos;t saved any folders yet. Get started by saving your
              first folder in the Explore Page.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <div className="flex ">
              <Button onClick={() => router.push("/explore")}>Explore</Button>
            </div>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Map over folders and use the new FolderCard component */}
          {folders.map((folder) => (
            <SavedCard
              key={folder._id}
              folder={folder}
              allFolders={folders} // Pass all folders for subfolder counting
            />
          ))}
        </div>
      )}
    </div>
  );
};
