"use client";
import { Skeleton } from "@/components/ui/skeleton";
import { VideoPlayer } from "@/components/videos/VideoPlayer";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useParams } from "next/navigation";
import React from "react";

const video = () => {
  const params = useParams();
  const videoId = params.videoId;
  const video = useQuery(api.videos.getvideobyId, {
    videoId: videoId as Id<"videos">,
  });
  if (!video) {
    return (
      <div>
        <Skeleton className="w-full h-[500px]" />
      </div>
    );
  }
  if (video.url === undefined) {
    return (
      <div>
        <Skeleton className="w-full h-[500px]" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-center">
        <VideoPlayer
          src={video.url}
          poster={video.thumbnail}
          title={video.title}
          className=""
        />
      </div>
    </div>
  );
};

export default video;
