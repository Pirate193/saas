import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

import { Skeleton } from "@/components/ui/skeleton";

import SavedDashboard from "./dashboard";
import { fetchQuery } from "convex/nextjs";

export default async function SavedFolderPage({
  params,
}: {
  params: { savedId: string };
}) {
  const { savedId } = await params;

  // Fetch the current folder
  const folder = fetchQuery(api.saving.getFolderById, {
    folderId: savedId as Id<"folders">,
  });

  if (folder === undefined) {
    return (
      <div className="p-6">
        <Skeleton className="h-12 w-1/3 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-full w-full min-h-[300px]" />
          </div>
        </div>
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="p-6 flex items-center justify-center">
        <h1 className="text-2xl font-bold">Folder not found or is private.</h1>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <SavedDashboard folderId={savedId as Id<"folders">} />
    </div>
  );
}
