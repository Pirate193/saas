"use client";

import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { SidebarTrigger } from "../ui/sidebar";
import { Input } from "../ui/input";
import { useState } from "react";
import { ExploreCard, ExploreCardSkeleton } from "./ExploreCard";
import { Search } from "lucide-react";

export const Explore = () => {
  const publicfolders = useQuery(api.public.getPublicFolders);
  const [searchQuery, setSearchQuery] = useState("");
  const searchFolders = useQuery(api.public.searchPublicFolders, {
    query: searchQuery,
  });

  const folders = searchQuery ? searchFolders : publicfolders;
  const isLoading = folders === undefined;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold tracking-tight">Explore</h1>
          <p className="text-muted-foreground">
            Discover public study materials from the community
          </p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search public folders..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <ExploreCardSkeleton key={i} />
          ))}
        </div>
      ) : folders?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-muted/50 p-4 rounded-full mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No folders found</h3>
          <p className="text-muted-foreground max-w-sm mt-2">
            {searchQuery
              ? `No results found for "${searchQuery}". Try a different search term.`
              : "There are no public folders yet. Be the first to share one!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {folders?.map((folder) => (
            <ExploreCard key={folder._id} folder={folder} />
          ))}
        </div>
      )}
    </div>
  );
};
