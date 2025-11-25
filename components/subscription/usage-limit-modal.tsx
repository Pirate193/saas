"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";

interface UsageLimitModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  limitType: "tokens" | "files" | "flashcards" | "chat_pdf";
  tokensUsed?: number;
  tokensLimit?: number;
}

export function UsageLimitModal({
  isOpen,
  onOpenChange,
  limitType,
  tokensUsed,
  tokensLimit,
}: UsageLimitModalProps) {
  const generateCheckoutLink = useAction(api.polar.generateCheckoutLink);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      const checkoutUrl = await generateCheckoutLink({
        productIds: ["b87a4c7c-d869-4992-9dee-f30847c6f8ac"],
      });
      if (checkoutUrl) {
        window.open(checkoutUrl, "_blank");
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Failed to generate checkout link:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getContent = () => {
    switch (limitType) {
      case "tokens":
        return {
          title: "Daily AI Chat Limit Reached",
          description: `You've used ${tokensUsed?.toLocaleString()} out of ${tokensLimit?.toLocaleString()} tokens today. Your limit will reset tomorrow.`,
          suggestion:
            "Upgrade to Pro for unlimited AI chat access and continue your conversations without interruption.",
        };
      case "files":
        return {
          title: "File Upload Limit Reached",
          description:
            "You've reached the maximum of 5 PDF uploads on the free plan.",
          suggestion:
            "Upgrade to Pro for unlimited file uploads and advanced features.",
        };
      case "flashcards":
        return {
          title: "Daily Flashcard Limit Reached",
          description: "You've generated your maximum AI flashcards for today.",
          suggestion: "Upgrade to Pro for unlimited AI-generated flashcards.",
        };
      case "chat_pdf":
        return {
          title: "Pro Feature",
          description: "Chat with PDF is a Pro-only feature.",
          suggestion:
            "Upgrade to Pro to unlock intelligent conversations with your PDF documents using RAG search.",
        };
      default:
        return {
          title: "Limit Reached",
          description: "You've reached a limit on the free plan.",
          suggestion: "Upgrade to Pro for unlimited access.",
        };
    }
  };

  const content = getContent();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{content.title}</DialogTitle>
          <DialogDescription className="space-y-4 pt-4">
            <p>{content.description}</p>
            <p className="text-foreground font-medium">{content.suggestion}</p>
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg bg-primary/10 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-semibold">Pro Plan - $10/month</span>
          </div>
          <ul className="text-sm space-y-1 ml-7 text-muted-foreground">
            <li>• Unlimited AI chat tokens</li>
            <li>• Unlimited file uploads</li>
            <li>• Unlimited AI flashcards</li>
            <li>• Chat with PDF (RAG search)</li>
          </ul>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Maybe Later
          </Button>
          <Button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Upgrade to Pro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
