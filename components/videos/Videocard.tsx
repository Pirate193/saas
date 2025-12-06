"use client";
import { Id } from "@/convex/_generated/dataModel";
import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "../ui/skeleton";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Play } from "lucide-react";

interface VideocardProps {
  videoId: Id<"videos">;
  onClick: () => void;
}

const Videocard = ({ videoId, onClick }: VideocardProps) => {
  const video = useQuery(api.videos.getvideobyId, { videoId: videoId });
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  if (!video) {
    return (
      <div className="bg-card text-card-foreground rounded-lg shadow-sm">
        <div className="p-4">
          <div>not found</div>
        </div>
      </div>
    );
  }

  // Loading State
  if (video === undefined || video?.status === "generating") {
    return (
      <div className="bg-card text-card-foreground rounded-lg shadow-sm h-full">
        <div className="space-y-3">
          <Skeleton className="w-full aspect-video rounded-t-lg" />
          <div className="space-y-2 px-4 pb-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      </div>
    );
  }

  // Format the creation time
  const formattedDate = new Date(video._creationTime).toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  );

  return (
    <div
      onClick={onClick}
      className="bg-card text-card-foreground rounded-xl shadow-sm cursor-pointer group h-full transition-all hover:shadow-lg"
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted ">
        {/* Show Skeleton until image is actually loaded */}
        {!isImageLoaded && (
          <Skeleton className="absolute inset-0 w-full h-full" />
        )}

        {video.thumbnail ? (
          <Image
            src={video.thumbnail}
            alt={video.title || "Video thumbnail"}
            fill
            className={cn(
              "object-cover transition-transform duration-300 group-hover:scale-105",
              !isImageLoaded && "opacity-0"
            )}
            onLoad={() => setIsImageLoaded(true)}
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-muted">
            <span className="text-xs text-muted-foreground">No Thumbnail</span>
          </div>
        )}

        {/* Play Button Overlay - Shows on Hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="bg-white/95 rounded-full p-4 transform scale-90 group-hover:scale-100 transition-transform duration-300 shadow-lg">
            <Play className="w-6 h-6 text-black fill-black" />
          </div>
        </div>
      </div>

      {/* Text Content */}
      <div className="p-4 space-y-1.5">
        <h3 className="font-semibold tracking-tight leading-tight line-clamp-2 text-card-foreground">
          {video.title || "Untitled Video"}
        </h3>
        <p className="text-sm text-muted-foreground">{formattedDate}</p>
      </div>
    </div>
  );
};

export default Videocard;
