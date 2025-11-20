"use client";

import { Id } from "@/convex/_generated/dataModel";
import { useParams } from "next/navigation";
import { PublicFlashcardList } from "@/components/public/public-flashcard-list";
import { CreditCard } from "lucide-react";

export default function PublicFlashcardsPage() {
  const params = useParams();
  const publicId = params.publicId as Id<"folders">;

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-8">
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
          <CreditCard className="h-6 w-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Flashcards</h1>
          <p className="text-muted-foreground">
            View flashcards in this folder
          </p>
        </div>
      </div>

      <PublicFlashcardList folderId={publicId} />
    </div>
  );
}
