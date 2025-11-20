"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { Skeleton } from "../ui/skeleton";
import { PublicFolderTreeItem } from "./public-folder-tree";

interface PublicNavProps {
  rootFolderId: Id<"folders">;
}

const Publicnav = ({ rootFolderId }: PublicNavProps) => {
  const rootfolder = useQuery(api.public.getPublicFolderById, {
    folderId: rootFolderId,
  });

  if (!rootfolder) {
    return (
      <div>
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }
  return (
    <div className="w-full py-2">
      {/* Start the recursion at Level 0 */}
      <PublicFolderTreeItem
        folder={rootfolder}
        level={0}
        rootPublicId={rootfolder._id}
      />
    </div>
  );
};

export default Publicnav;
