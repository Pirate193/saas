import { createReactBlockSpec } from "@blocknote/react";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  Trash2,
  Eye,
  RotateCcw,
  CheckSquare,
  CircleDot,
  BrainCircuit,
} from "lucide-react";
import { generateQuizzesAction } from "@/actions/generatequiz";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

// --- Main Quiz Block Wrapper (Same structure as before) ---
export const QuizBlock = createReactBlockSpec(
  {
    type: "quiz",
    propSchema: {
      topic: { default: "" },
      quizzesData: { default: "[]" },
      isGeneratingInitial: { default: true },
    },
    content: "none",
  },
  {
    render: (props) => {
      const [topicInput, setTopicInput] = useState(
        props.block.props.topic || ""
      );
      const [numQuestions, setNumQuestions] = useState("5");
      const [isLoading, setIsLoading] = useState(false);
      const [currentIndex, setCurrentIndex] = useState(0);
      const [isOpen, setIsOpen] = useState(false);
      const quizzesData = JSON.parse(props.block.props.quizzesData || "[]");
      const isGeneratingInitial = props.block.props.isGeneratingInitial;
      const currentQuiz = quizzesData[currentIndex];

      useEffect(() => {
        if (props.block.props.isGeneratingInitial) {
          const timer = setTimeout(() => {
            setIsOpen(true);
          }, 0); // 0ms is enough to push it to the next tick
          return () => clearTimeout(timer);
        }
      }, []);

      const handleGenerate = async () => {
        if (!topicInput) return;
        setIsLoading(true);
        try {
          const count = parseInt(numQuestions);
          const data = await generateQuizzesAction(topicInput, count);
          props.editor.updateBlock(props.block, {
            props: {
              topic: topicInput,
              quizzesData: JSON.stringify(data),
              isGeneratingInitial: false,
            },
          });
          setIsOpen(false);
        } catch (e) {
          console.error("Failed to generate quizzes:", e);
        } finally {
          setIsLoading(false);
        }
      };

      const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open && isGeneratingInitial && !isLoading) {
          // Small delay to prevent flicker if we are just switching focus
          setTimeout(() => {
            props.editor.removeBlocks([props.block]);
          }, 100);
        }
      };
      // ... (Navigation handlers same as previous code) ...
      const handleDelete = () => props.editor.removeBlocks([props.block]);
      const handleNext = () => {
        if (currentIndex < quizzesData.length - 1)
          setCurrentIndex((prev) => prev + 1);
      };
      const handlePrev = () => {
        if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
      };

      // UI Part 1 & 2 (Input and Loading) are identical to previous version...
      if (isGeneratingInitial) {
        return (
          <Popover open={isOpen} onOpenChange={handleOpenChange}>
            {/* The Anchor: Invisible, but takes up space in the editor */}
            <PopoverTrigger asChild>
              <div className="h-12 w-full select-none" />
            </PopoverTrigger>

            {/* The Floating Bar */}
            <PopoverContent
              // 1. Changed w-full to w-[600px] to make it "longer" like Opennote
              // 2. Added max-w-[90vw] so it doesn't break mobile
              className="p-0 w-[600px] max-w-[90vw] border-none bg-transparent shadow-none"
              align="start"
              side="top"
              sideOffset={-44} // Pulls it up perfectly over the anchor
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <div className="flex items-center p-1 rounded-xl border bg-background shadow-lg ring-1 ring-foreground/5">
                {/* Removed the BrainCircuit Icon */}

                <Input
                  placeholder="What should this quiz be about?"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                  // Removed hardcoded background/borders, uses default theme
                  className="flex-grow border-none shadow-none bg-transparent focus-visible:ring-0 text-base h-10 px-4"
                  autoFocus
                />

                <div className="flex items-center gap-2 border-l pl-2 ml-1">
                  <Select value={numQuestions} onValueChange={setNumQuestions}>
                    <SelectTrigger className="w-[65px] h-9 border-none bg-transparent focus:ring-0 text-xs font-medium px-1">
                      <SelectValue />
                      <span className="text-muted-foreground ml-1">Qs</span>
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 3, 5, 10].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    size="icon" // Makes it a perfect square/circle based on theme
                    onClick={handleGenerate}
                    disabled={!topicInput || isLoading}
                    // Removed hardcoded colors (bg-green-600).
                    // Uses 'default' variant which maps to your Global CSS 'primary' color.
                    className="h-9 w-9 rounded-lg transition-all"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowUp className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        );
      }

      if (isLoading) {
        return (
          <Card className="w-full my-4 p-8 flex flex-col items-center justify-center bg-muted/20 border-dashed">
            <Loader2 className="h-8 w-8 animate-spin text-green-600 mb-2" />
            <p className="text-sm text-muted-foreground">
              Generating practice problems...
            </p>
          </Card>
        );
      }

      if (!currentQuiz) return null;

      return (
        <div className="w-full my-4">
          <QuizCard
            key={`${props.block.id}-${currentIndex}`}
            quizData={currentQuiz}
            index={currentIndex}
            total={quizzesData.length}
          />
          {/* Navigation Footer (Same as before) */}
          <div className="mt-4 flex items-center justify-center gap-4 bg-secondary/30 p-2 rounded-lg mx-auto max-w-sm">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-muted-foreground">
              {currentIndex + 1} of {quizzesData.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              disabled={currentIndex === quizzesData.length - 1}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="h-4 w-px bg-border mx-1" />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      );
    },
  }
);

// --- LOGIC HEAVY COMPONENT: QuizCard ---
const QuizCard = ({
  quizData,
  index,
  total,
}: {
  quizData: any;
  index: number;
  total: number;
}) => {
  // We store selections as an array to handle both Single and Multi select
  const [userSelections, setUserSelections] = useState<string[]>([]);
  const [status, setStatus] = useState<
    "idle" | "correct" | "incorrect" | "revealed"
  >("idle");

  const isMultiSelect = quizData.type === "multiple";
  const correctAnswers = quizData.correctAnswers; // This is now an Array of strings

  const handleSelect = (option: string) => {
    if (status !== "idle") return; // Lock if submitted

    if (isMultiSelect) {
      // Toggle selection for multi-select
      setUserSelections((prev) =>
        prev.includes(option)
          ? prev.filter((item) => item !== option)
          : [...prev, option]
      );
    } else {
      // Replace selection for single-select
      setUserSelections([option]);
    }
  };

  const checkAnswer = () => {
    // Logic: Are user selections identical to correct answers?
    // We sort both arrays to ensure order doesn't matter
    const sortedUser = [...userSelections].sort();
    const sortedCorrect = [...correctAnswers].sort();

    const isMatch =
      JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect);
    setStatus(isMatch ? "correct" : "incorrect");
  };

  const showAnswer = () => {
    setStatus("revealed");
  };

  const reset = () => {
    setUserSelections([]);
    setStatus("idle");
  };

  return (
    <Card className="w-full shadow-sm border bg-card text-card-foreground">
      <CardContent className="pt-6 px-6">
        {/* Header Badges */}
        <div className="flex gap-2 mb-4">
          <Badge
            variant="secondary"
            className={
              quizData.difficulty === "Easy"
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            }
          >
            {quizData.difficulty}
          </Badge>
          <Badge
            variant="outline"
            className="uppercase text-xs font-semibold tracking-wide text-muted-foreground flex items-center gap-1"
          >
            {isMultiSelect ? (
              <CheckSquare className="w-3 h-3" />
            ) : (
              <CircleDot className="w-3 h-3" />
            )}
            {isMultiSelect ? "Multi-Select" : "Single Choice"}
          </Badge>
        </div>

        {/* Question */}
        <h3 className="text-xl font-medium mb-6 leading-relaxed">
          {quizData.question}
        </h3>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {quizData.options.map((option: string, i: number) => {
            const isSelected = userSelections.includes(option);
            const isAnswer = correctAnswers.includes(option);

            // Determine styling based on state
            let borderColor =
              "border-transparent bg-secondary/50 hover:bg-secondary/80";
            let textColor = "text-foreground";

            if (status === "idle") {
              if (isSelected) borderColor = "ring-2 ring-primary bg-secondary";
            } else {
              // Revealing logic
              if (isAnswer) {
                borderColor =
                  "bg-green-100 border-green-500 dark:bg-green-900/20";
                textColor = "text-green-700 dark:text-green-300";
              } else if (isSelected && !isAnswer) {
                borderColor = "bg-red-100 border-red-500 dark:bg-red-900/20";
                textColor = "text-red-700 dark:text-red-300";
              }
            }

            return (
              <div
                key={i}
                onClick={() => handleSelect(option)}
                className={`flex items-center space-x-3 p-3 rounded-md border transition-all cursor-pointer ${borderColor} ${textColor}`}
              >
                <div
                  className={`
                                    flex items-center justify-center w-5 h-5 rounded border 
                                    ${isMultiSelect ? "rounded-sm" : "rounded-full"}
                                    ${isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground"}
                                `}
                >
                  {isSelected && (
                    <div className="w-2.5 h-2.5 bg-current rounded-[1px]" />
                  )}
                </div>
                <Label className="flex-grow cursor-pointer text-base font-normal py-1 pointer-events-none">
                  {option}
                </Label>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {status === "idle" && (
            <>
              <Button
                onClick={checkAnswer}
                disabled={userSelections.length === 0}
                className="flex-1 font-medium text-md py-6 rounded-xl"
              >
                Check Answer
              </Button>
              <Button
                variant="outline"
                onClick={showAnswer}
                className="flex-none py-6 rounded-xl px-4"
                title="Show Answer"
              >
                <Eye className="w-5 h-5 text-muted-foreground" />
              </Button>
            </>
          )}
        </div>

        {/* Explanation Reveal */}
        {status !== "idle" && (
          <div className="animate-in fade-in slide-in-from-top-2 mt-4">
            <div
              className={`p-4 rounded-lg border 
                            ${
                              status === "correct"
                                ? "bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-900"
                                : status === "incorrect"
                                  ? "bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-900"
                                  : "bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-900" // 'revealed' state
                            }`}
            >
              <div className="flex items-center gap-2 font-semibold mb-2">
                {status === "correct" && (
                  <>
                    <CheckCircle2 className="text-green-600" />{" "}
                    <span>Correct!</span>
                  </>
                )}
                {status === "incorrect" && (
                  <>
                    <XCircle className="text-red-600" /> <span>Incorrect</span>
                  </>
                )}
                {status === "revealed" && (
                  <>
                    <Eye className="text-blue-600" />{" "}
                    <span>Answer Revealed</span>
                  </>
                )}
              </div>

              {/* Render the detailed explanation string */}
              <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {quizData.explanation}
              </div>
            </div>
            <Button variant="ghost" onClick={reset} className="mt-4 w-full">
              <RotateCcw className="w-4 h-4 mr-2" /> Clear Answer
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
