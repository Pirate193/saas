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
  Target,
  AlertTriangle,
} from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import { getIntervalPreview } from "@/lib/flashcardalgorithm";
import { gradeFlashcardAnswer } from "@/actions/grade";

interface Props {
  flashcardId: Id<"flashcards">;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

// Define the shape of our AI feedback
interface GradingResult {
  isCorrect: boolean;
  score: number;
  feedback: string;
  missedConcepts?: string[];
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
  const progress = useQuery(api.flashcards.fetchFlashcardProgress, {
    flashcardId,
  });

  const [userAnswer, setUserAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showQualityRating, setShowQualityRating] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);

  // New State for AI Grading
  const [isGrading, setIsGrading] = useState(false);
  const [gradingResult, setGradingResult] = useState<GradingResult | null>(
    null
  );

  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    startTimeRef.current = Date.now();
    setShowResult(false);
    setIsCorrect(false);
    setShowQualityRating(false);
    setIsGrading(false);
    setGradingResult(null);
    setUserAnswer("");
    setSelectedOption(null);
    setIsReviewing(false);
  }, [flashcardId]);

  if (flashcard === undefined || progress === undefined) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <Skeleton className="h-8 w-32" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  const handleCheckAnswer = async () => {
    setShowResult(true);

    // 1. Handle Multiple Choice (Deterministic - No AI needed)
    if (flashcard.isMultipleChoice) {
      if (selectedOption === null) return;
      const option = flashcard.answers[selectedOption];
      setIsCorrect(option.isCorrect);
      setShowQualityRating(true);
      return;
    }

    // 2. Handle Open-Ended (Use AI Grading)
    setIsGrading(true);
    const correctAnswerText =
      flashcard.answers.find((a) => a.isCorrect)?.text || "";

    try {
      // Call Server Action
      const result = await gradeFlashcardAnswer(
        userAnswer,
        correctAnswerText,
        flashcard.question
      );

      setGradingResult(result);
      setIsCorrect(result.isCorrect);
      setIsGrading(false);
      setShowQualityRating(true);
    } catch (error) {
      console.error("Grading failed", error);
      toast.error("AI Grading failed. Falling back to basic check.");

      // Fallback: Basic string match if AI fails
      const basicCheck =
        userAnswer.toLowerCase().trim() ===
        correctAnswerText.toLowerCase().trim();
      setIsCorrect(basicCheck);
      setIsGrading(false);
      setShowQualityRating(true);
    }
  };

  const handleQualityRating = async (quality: number) => {
    setIsReviewing(true);
    try {
      const endTime = Date.now();
      const timeTaken = Math.floor((endTime - startTimeRef.current) / 1000);

      const result = await reviewCard({
        flashcardId,
        quality,
        timeSpendSeconds: timeTaken,
      });

      toast.success("Progress saved!");
      setTimeout(() => {
        handleNext();
      }, 500);
    } catch (error) {
      toast.error("Failed to save review.");
      setIsReviewing(false);
    }
  };

  const handleNext = () => {
    onNext?.();
  };

  const handlePrevious = () => {
    onPrevious?.();
  };

  const canCheck = flashcard?.isMultipleChoice
    ? selectedOption !== null
    : userAnswer.trim() !== "";

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <span>Study Mode</span>
          </div>
          {progress && progress.totalReviews > 0 && (
            <span className="text-xs px-2 py-1 bg-muted rounded-full font-normal">
              Mastery:{" "}
              {Math.round(
                (progress.correctReviews / progress.totalReviews) * 100
              )}
              %
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Question Area */}
        <div className="p-6 bg-primary/10 rounded-xl flex items-center justify-center text-center">
          <p className="text-xl font-medium leading-relaxed">
            {flashcard.question}
          </p>
        </div>

        <div className="space-y-4">
          {flashcard.isMultipleChoice && (
            <div className="grid grid-cols-1 gap-3">
              {flashcard.answers.map((answer, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedOption(index)}
                  className={cn(
                    "flex items-center gap-4 p-4 text-left border-2 rounded-xl transition-all hover:shadow-md",
                    selectedOption === index
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-transparent  hover:bg-primary/20 dark:hover:bg-primary/20",
                    showResult &&
                      (answer.isCorrect
                        ? "border-green-500 "
                        : "border-red-500 ")
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-bold transition-colors",
                      selectedOption === index
                        ? "border-primary bg-primary text-white"
                        : "border-primary/20 text-primary/20"
                    )}
                  >
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="font-medium">{answer.text}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {!showResult && !flashcard.isMultipleChoice && (
          <div className="space-y-2">
            <Label>Your Answer</Label>
            <Input
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Type your explanation here..."
              onKeyDown={(e) =>
                e.key === "Enter" && canCheck && handleCheckAnswer()
              }
              className="text-lg p-6 h-auto"
              autoFocus
            />
            <p className="text-xs text-muted-foreground text-right">
              Press Enter to check
            </p>
          </div>
        )}
        {/* Results Area */}
        <AnimatePresence mode="wait">
          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Grading Loading State */}
              {isGrading ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4 text-purple-600">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="font-medium animate-pulse">
                    Analyzing your answer...
                  </p>
                </div>
              ) : (
                <>
                  {/* Verdict Banner */}
                  <div
                    className={cn(
                      "p-4 rounded-xl flex items-start gap-4 border-l-4",
                      isCorrect
                        ? "bg-green-50 dark:bg-green-950/20 border-l-green-500"
                        : "bg-red-50 dark:bg-red-950/20 border-l-red-500"
                    )}
                  >
                    <div
                      className={cn(
                        "p-2 rounded-full shrink-0",
                        isCorrect
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      )}
                    >
                      {isCorrect ? (
                        <Check className="h-6 w-6" />
                      ) : (
                        <X className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <h3
                        className={cn(
                          "text-lg font-bold",
                          isCorrect
                            ? "text-green-700 dark:text-green-400"
                            : "text-red-700 dark:text-red-400"
                        )}
                      >
                        {isCorrect ? "Correct!" : "Needs Improvement"}
                        {gradingResult && (
                          <span className="ml-2 text-sm opacity-80">
                            ({gradingResult.score}%)
                          </span>
                        )}
                      </h3>

                      {/* AI Feedback Text */}
                      <p className="mt-1 text-slate-600 dark:text-slate-300 leading-relaxed">
                        {flashcard.isMultipleChoice
                          ? isCorrect
                            ? "Spot on!"
                            : "Incorrect choice."
                          : gradingResult?.feedback}
                      </p>

                      {/* Missed Concepts (Only for Open Ended) */}
                      {gradingResult?.missedConcepts &&
                        gradingResult.missedConcepts.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {gradingResult.missedConcepts.map((concept, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                              >
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Missed: {concept}
                              </span>
                            ))}
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Correct Answer Display (If wrong) */}
                  {!isCorrect && (
                    <div className="p-4 bg-primary/50 rounded-lg">
                      <p className="text-xs font-semibold uppercase text-slate-500 mb-2 flex items-center gap-1">
                        <Target className="h-3 w-3" /> Official Answer
                      </p>
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {flashcard.answers.find((a) => a.isCorrect)?.text}
                      </p>
                    </div>
                  )}

                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="text-xs font-semibold uppercase mb-2 flex items-center gap-1">
                      Explanation:
                    </p>
                    <p className="font-medium ">{flashcard.explanation}</p>
                  </div>
                  {/* Spaced Repetition Buttons */}
                  {showQualityRating && !isReviewing && (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-center text-muted-foreground mb-4">
                        Rate difficulty to schedule next review
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        <RatingButton
                          label="Again"
                          color="bg-red-100 text-red-700 hover:bg-red-200"
                          onClick={() => handleQualityRating(0)}
                        />
                        <RatingButton
                          label="Hard"
                          color="bg-orange-100 text-orange-700 hover:bg-orange-200"
                          onClick={() => handleQualityRating(1)}
                        />
                        <RatingButton
                          label="Good"
                          color="bg-blue-100 text-blue-700 hover:bg-blue-200"
                          onClick={() => handleQualityRating(3)}
                        />
                        <RatingButton
                          label="Easy"
                          color="bg-green-100 text-green-700 hover:bg-green-200"
                          onClick={() => handleQualityRating(5)}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>

      <CardFooter className="flex justify-between p-4 ">
        <Button
          variant="ghost"
          onClick={handlePrevious}
          disabled={!hasPrevious || isGrading}
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Prev
        </Button>

        {!showResult && (
          <Button
            onClick={handleCheckAnswer}
            disabled={!canCheck}
            className="min-w-[120px]"
          >
            Check Answer
          </Button>
        )}

        {/* Next button only shows if we are stuck or done reviewing */}
        {showResult && showQualityRating && (
          <Button onClick={handleNext} disabled={!hasNext}>
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

// Helper for the buttons to keep main code clean
function RatingButton({
  label,
  color,
  onClick,
}: {
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "py-3 rounded-lg font-bold text-sm transition-transform active:scale-95",
        color
      )}
    >
      {label}
    </button>
  );
}

export default FlashcardViewer;
