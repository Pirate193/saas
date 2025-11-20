"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface PublicFlashcardListProps {
  folderId: Id<"folders">;
}

export const PublicFlashcardList = ({ folderId }: PublicFlashcardListProps) => {
  const flashcards = useQuery(api.public.getPublicFolderFlashcards, {
    folderId,
  });

  if (flashcards === undefined) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        No flashcards in this folder.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {flashcards.map((card) => (
        <Card key={card._id} className="flex flex-col">
          <CardHeader>
            <div className="flex justify-between items-start gap-2">
              <CardTitle className="text-base font-medium leading-snug">
                {card.question}
              </CardTitle>
              {card.isMultipleChoice && (
                <Badge variant="secondary" className="shrink-0">
                  MCQ
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-2">
              {card.answers.map((answer, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-md text-sm border ${
                    answer.isCorrect
                      ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900"
                      : "bg-muted/50 border-transparent"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                        answer.isCorrect
                          ? "bg-green-500"
                          : "bg-muted-foreground"
                      }`}
                    />
                    <span
                      className={
                        answer.isCorrect
                          ? "font-medium text-green-700 dark:text-green-300"
                          : ""
                      }
                    >
                      {answer.text}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
