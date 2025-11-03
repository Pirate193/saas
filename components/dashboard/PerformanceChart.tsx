import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface PerformanceChartProps {
  stats: {
    successRate: number;
    totalReviews: number;
    averageEase: number;
  };
}

export function PerformanceChart({ stats }: PerformanceChartProps) {
  const avgEasePercentage = ((stats.averageEase - 1.3) / (2.5 - 1.3)) * 100;

  return (
    <Card className="drag-handle cursor-move h-full">
      <CardHeader className="flex-shrink-0 pb-3" >
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Performance
        </CardTitle>
        <p className="text-sm text-muted-foreground">Your study statistics</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Success Rate */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Success Rate</span>
            <span className="font-semibold text-green-600">
              {Math.round(stats.successRate)}%
            </span>
          </div>
          <Progress value={stats.successRate} className="h-3" />
        </div>

        {/* Average Ease */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Avg Ease</span>
            <span className="font-semibold">
              {stats.averageEase.toFixed(2)}
            </span>
          </div>
          <Progress value={avgEasePercentage} className="h-3" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <div className="text-sm text-muted-foreground">Total Reviews</div>
            <div className="text-2xl font-bold">{stats.totalReviews}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Avg Ease</div>
            <div className="text-2xl font-bold">
              {stats.averageEase.toFixed(1)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}