"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { cn } from "@/lib/utils";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import { getIntervalPreview } from "@/lib/flashcardalgorithm";
import { useChat } from "@ai-sdk/react";
import { useAuth } from "@clerk/nextjs";
import { DefaultChatTransport } from "ai";
import { Response } from "../ai-elements/response"; // --- FIX: Import Response component

interface Props {
  flashcardId: Id<"flashcards">;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

const FlashcardViewer = ({
  flashcardId,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
}: Props) => {
  const reviewCard = useMutation(api.flashcards.reviewFlashcard);
  const flashcard = useQuery(api.flashcards.getFlashcard, { flashcardId });

  const [userAnswer, setUserAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showQualityRating, setShowQualityRating] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [AiReview, setAiReview] = useState(false); // This will control the AI feedback visibility

  // --- FIX: Destructure setMessages from useChat to clear the history ---
  const { messages, sendMessage, status, setMessages, error } = useChat();

  const folder = useQuery(
    api.folders.getFolderById,
    flashcard ? { folderId: flashcard.folderId as Id<"folders"> } : "skip" // --- FIX: Only query if flashcard is loaded
  );

  const { getToken } = useAuth();
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    startTimeRef.current = Date.now();
    // --- FIX: Clear chat history when flashcardId changes ---
    setMessages([]);
    setAiReview(false);
  }, [flashcardId, setMessages]);

  if (flashcard === undefined) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <Skeleton className="h-8 w-32" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  const handleCheckAnswer = async () => {
    const token = await getToken({ template: "convex" });
    
    // --- FIX: Set AiReview to true here ---
    setAiReview(true); 
    setShowResult(true);
    setShowQualityRating(true);

    let answerText = userAnswer;
    let isAnswerCorrect = false;

    if (flashcard?.isMultipleChoice) {
      if (selectedOption === null) return;
      answerText = flashcard.answers[selectedOption].text;
      isAnswerCorrect = flashcard.answers[selectedOption].isCorrect;
      setIsCorrect(isAnswerCorrect);
    } else {
      const correct = flashcard?.answers.some(
        (answer) =>
          answer.isCorrect &&
          answer.text.toLowerCase().trim() === userAnswer.toLowerCase().trim()
      );
      isAnswerCorrect = correct!;
      setIsCorrect(isAnswerCorrect);
    }

    // --- FIX: Improved prompt for AI feedback ---
    const prompt = `
      You are an AI Tutor. A student is reviewing a flashcard.
      Their answer was ${isAnswerCorrect ? "CORRECT" : "INCORRECT"}.
      
      Flashcard Question: "${flashcard.question}"
      
      Correct Answer(s):
      ${flashcard.answers.filter(a => a.isCorrect).map(a => `- ${a.text}`).join('\n')}
      
      Student's Answer: "${answerText}"
      
      Please provide a brief, helpful review of their answer (max 2-3 sentences).
      - If they were correct, congratulate them and provide a brief, interesting tidbit related to the answer.
      - If they were incorrect, gently explain *why* their answer was wrong and how it relates to the correct answer.
    `;

    sendMessage(
      { text: prompt },
      {
        body: {
          webSearch: false,
          contextFolder: folder,
          convexToken: token,
        },
      }
    );
  };

  const handleQualityRating = async (quality: number) => {
    // ... (Your existing handleQualityRating logic is correct)
    setIsReviewing(true);

    try {
      const endTime = Date.now();
      const timeTaken = Math.floor((endTime - startTimeRef.current) / 1000);
      const result = await reviewCard({
        flashcardId,
        quality,
        timeSpendSeconds: timeTaken,
      });
      const nextReviewDate = new Date(result.nextReviewDate);
      const daysUntil = Math.ceil(
        (nextReviewDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      let reviewText = "";
      if (daysUntil <= 0) { // --- FIX: Handle same-day reviews
        reviewText = "Today";
      } else if (daysUntil === 1) {
        reviewText = "1 day";
      } else if (daysUntil < 30) {
        reviewText = `${daysUntil} days`;
      } else {
        const months = Math.round(daysUntil / 30);
        reviewText = `${months} month${months > 1 ? "s" : ""}`;
      }

      toast.success(`Review saved! Next review: ${reviewText}`);

      setTimeout(() => {
        handleNext();
      }, 1000);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save review. Please try again.");
      setIsReviewing(false);
    }
  };

  const handleNext = () => {
    setUserAnswer("");
    setSelectedOption(null);
    setShowResult(false);
    setIsCorrect(false);
    setShowQualityRating(false);
    setIsReviewing(false);
    setAiReview(false); // --- FIX: Reset AI review visibility
    setMessages([]); // --- FIX: Clear chat history
    startTimeRef.current = Date.now();
    onNext?.();
  };

  const handlePrevious = () => {
    setUserAnswer("");
    setSelectedOption(null);
    setShowResult(false);
    setIsCorrect(false);
    setShowQualityRating(false);
    setIsReviewing(false);
    setAiReview(false); // --- FIX: Reset AI review visibility
    setMessages([]); // --- FIX: Clear chat history
    startTimeRef.current = Date.now();
    onPrevious?.();
  };

  const canCheck = flashcard?.isMultipleChoice
    ? selectedOption !== null
    : userAnswer.trim() !== "";

   
   const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

  // 2. ONLY get the text if the last message is from the ASSISTANT
  const aifeedback =
    lastMessage && lastMessage.role === "assistant"
      ? lastMessage.parts
          .filter((p) => p.type === "text")
          .map((p) => p.text)
          .join("")
      : null; // This will be null if the last message is the user's prompt

  return (
    <Card className="w-full max-w-2xl mx-auto ">
      <CardHeader>
        {/* ... (Your CardHeader logic is correct) ... */}
        <CardTitle className="text-xl flex items-center justify-between">
          <span>Question</span>
          {flashcard && flashcard.totalReviews > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              Success:{" "}
              {Math.round(
                (flashcard.correctReviews / flashcard.totalReviews) * 100
              )}
              %
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Question */}
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-lg font-medium">{flashcard.question}</p>
        </div>

        {/* Answer Input */}
        {!showResult && (
          // ... (Your Answer Input logic is correct) ...
          <div className="space-y-4">
            {flashcard.isMultipleChoice ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground mb-3">
                  Select your answer:
                </p>
                {flashcard.answers.map((answer, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedOption(index)}
                    className={cn(
                      "w-full p-4 text-left border-2 rounded-lg transition-all hover:border-primary",
                      selectedOption === index
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex items-center justify-center w-8 h-8 rounded-full border-2 font-medium",
                          selectedOption === index
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/30"
                        )}
                      >
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className="flex-1">{answer.text}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Type your answer:
                </Label>
                <Input
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Enter your answer..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && canCheck) {
                      handleCheckAnswer();
                    }
                  }}
                  className="text-lg"
                  autoFocus
                />
              </div>
            )}
          </div>
        )}

        {/* Result Display */}
        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={cn(
                "p-6 rounded-lg border-2 space-y-4", // --- FIX: Added space-y-4
                isCorrect
                  ? "bg-green-50 border-green-500 dark:bg-green-950/20"
                  : "bg-red-50 border-red-500 dark:bg-red-950/20"
              )}
            >
              {/* Correct/Incorrect Feedback */}
              <div className="flex items-center gap-3">
                {isCorrect ? (
                  <>
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500">
                      <Check className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-green-700 dark:text-green-400">
                        Correct!
                      </h3>
                      <p className="text-sm text-green-600 dark:text-green-500">
                        Great job! You got it right.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500">
                      <X className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">
                        Incorrect
                      </h3>
                      <p className="text-sm text-red-600 dark:text-red-500">
                        Dont worry, keep practicing!
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Show correct answer if wrong */}
              {!isCorrect && (
                <div className="mt-4 p-4 bg-white dark:bg-gray-900 rounded-lg border">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Correct answer
                    {flashcard.answers.filter((a) => a.isCorrect).length > 1
                      ? "s"
                      : ""}
                    :
                  </p>
                  <div className="space-y-1">
                    {flashcard.answers
                      .filter((answer) => answer.isCorrect)
                      .map((answer, index) => (
                        <div key={index} className="flex items-center gap-2">
                          {flashcard.isMultipleChoice && (
                            <span className="font-medium text-green-600">
                              {String.fromCharCode(
                                65 + flashcard.answers.indexOf(answer)
                              )}
                              .
                            </span>
                          )}
                          <span className="font-medium">{answer.text}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* --- FIX: AI Feedback Section --- */}
              {AiReview && (
                <div className="rounded-lg border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-500">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-400">
                      AI Tutor Feedback
                    </h3>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {/* Render the content of the LAST assistant message */}
                    {aifeedback ? (
                      <Response>{aifeedback}</Response>
                    ) : status === "submitted" ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Thinking...
                      </div>
                    ) : null}
                    
                    {error && (
                       <p className="text-red-500">Error: {error.message}</p>
                    )}
                  </div>
                </div>
              )}
              {/* --- END FIX --- */}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quality Rating Buttons */}
        <AnimatePresence>
          {showQualityRating &&
            !isReviewing && (
              // ... (Your Quality Rating logic is correct) ...
               <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <p className="text-sm font-medium text-center">
                  How well did you know this?
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleQualityRating(isCorrect ? 2 : 0)}
                    className="flex flex-col h-auto py-3 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <span className="font-semibold">Again</span>
                    <span className="text-xs text-muted-foreground">
                      {getIntervalPreview(
                        isCorrect ? 2 : 0,
                        flashcard.easeFactor,
                        flashcard.intervalDays,
                        flashcard.repetitions
                      )}
                    </span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleQualityRating(isCorrect ? 3 : 1)}
                    className="flex flex-col h-auto py-3 hover:bg-yellow-50 dark:hover:bg-yellow-950/20"
                  >
                    <span className="font-semibold">
                      {isCorrect ? "Good" : "Hard"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {getIntervalPreview(
                        isCorrect ? 3 : 1,
                        flashcard.easeFactor,
                        flashcard.intervalDays,
                        flashcard.repetitions
                      )}
                    </span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleQualityRating(isCorrect ? 5 : 2)}
                    className="flex flex-col h-auto py-3 hover:bg-green-50 dark:hover:bg-green-950/20"
                    disabled={!isCorrect}
                  >
                    <span className="font-semibold">Easy</span>
                    <span className="text-xs text-muted-foreground">
                      {getIntervalPreview(
                        isCorrect ? 5 : 2,
                        flashcard.easeFactor,
                        flashcard.intervalDays,
                        flashcard.repetitions
                      )}
                    </span>
                  </Button>
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  Choose how difficult this card was for you
                </p>
              </motion.div>
            )}
        </AnimatePresence>

        {/* Loading indicator while reviewing */}
        {isReviewing && (
          // ... (Your isReviewing logic is correct) ...
           <div className="flex flex-col items-center justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground mt-2">
              Saving review...
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        {/* ... (Your CardFooter logic is correct) ... */}
         <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={!hasPrevious || isReviewing}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        {!showResult ? (
          <Button onClick={handleCheckAnswer} disabled={!canCheck}>
            Check Answer
          </Button>
        ) : !showQualityRating ? (
          <Button onClick={handleNext} disabled={!hasNext}>
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <div className="text-sm text-muted-foreground">
            Rate your knowledge →
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default FlashcardViewer;