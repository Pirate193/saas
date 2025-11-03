import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target } from "lucide-react";

interface MasteryProgressProps {
  stats: {
    totalCards: number;
    masteredCards: number;
    newcards: number;
  };
}

export function MasteryProgress({ stats }: MasteryProgressProps) {
  const learningCards = stats.totalCards - stats.masteredCards - stats.newcards;
  const masteryPercentage = (stats.masteredCards / stats.totalCards) * 100 || 0;

  return (
    <Card className="drag-handle cursor-move h-full flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="flex-shrink-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="h-5 w-5 flex-shrink-0" />
          <span>Mastery Progress</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {stats.masteredCards} of {stats.totalCards} cards mastered
        </p>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-center space-y-6 min-h-0">
        {/* Main Progress Bar */}
        <div className="space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-2xl font-bold text-primary">
              {Math.round(masteryPercentage)}%
            </span>
          </div>
          <Progress value={masteryPercentage} className="h-4" />
        </div>

        {/* Stats Grid - Large Numbers */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t">
          <div className="text-center space-y-1">
            <div className="text-3xl sm:text-4xl font-bold text-green-600">
              {stats.masteredCards}
            </div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Mastered
            </div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-3xl sm:text-4xl font-bold text-blue-600">
              {learningCards}
            </div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Learning
            </div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-3xl sm:text-4xl font-bold text-purple-600">
              {stats.newcards}
            </div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              New
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}