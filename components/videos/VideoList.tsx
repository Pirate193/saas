"use client";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import React from "react";
import { Skeleton } from "../ui/skeleton";
import Videocard from "./Videocard";
import { useRouter } from "next/navigation";

const VideoList = ({ folderId }: { folderId: Id<"folders"> }) => {
  const router = useRouter();
  const videos = useQuery(api.videos.fetchfoldervideos, { folderId: folderId });
  if (videos === undefined) {
    return (
      <div>
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  return (
    <div className="p-2">
      {videos.length === 0 ? (
        <div>
          <p>No videos found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video) => (
            <Videocard
              key={video._id}
              videoId={video._id}
              onClick={() => {
                router.push(`/folders/${folderId}/videos/${video._id}`);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoList;
