'use client'

import { MasteryProgress } from "@/components/dashboard/masteryprogress";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel"
import { useQuery } from "convex/react";
import { Calendar, CheckCircle2, Clock, CreditCard, FileText, Sparkles, Upload, RotateCcw, Brain, TrendingUp, Zap, SlashIcon, Folder } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SidebarTrigger } from "@/components/ui/sidebar";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import Link from "next/link";
interface Props {
    folderId: Id<'folders'>;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-96 mt-2" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-96" />
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    </div>
  );
}



const Dashboard = ({ folderId}: Props) => {
  const stats = useQuery(api.flashcards.fetchStudyStats,{folderId:folderId});
  const notes = useQuery(api.notes.fetchNotesInFolder,{folderId:folderId})
  const files = useQuery(api.files.fetchfiles,{folderId:folderId})
  const folder = useQuery(api.folders.getFolderById,{folderId:folderId})
  const flashcards = useQuery(api.flashcards.fetchFlashcards,{folderId:folderId})

  // if(folder.parentId){
  //   const parentfolder = useQuery(api.folders.getFolderById,{folderId:folder.parentId})
  // }

  if(!folder || !stats || !notes || !files){
    return <DashboardSkeleton/>
  }
  const masteryPercentage = (stats.masteredCards / stats.totalCards) * 100 || 0;

  

  return (
    <div className="space-y-6 p-6 overflow-y-auto scrollbar-hidden">
      {/* Header with Reset Button */}
      <div className="flex items-center justify-start">
        <SidebarTrigger size='lg' />
         {/* <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem  >
          <BreadcrumbLink asChild >
            <Link href={`/folders/${folder._id}`} className="flex items-center gap-2" >
            <Folder className="h-4 w-4" />
           <span>  {folder.name} </span> </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <SlashIcon />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage>{folder.name}</BreadcrumbPage>
        </BreadcrumbItem>
        </BreadcrumbList>
        </Breadcrumb> */}
        <div className="flex flex-col" >
          <h1 className="text-3xl font-bold">{folder.name}</h1>
          {folder.description && (
            <p className="text-muted-foreground mt-1">{folder.description}</p>
          )}
        </div>
       
      </div>

      {/* to do a  Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{notes.length}</div>
                <p className="text-xs text-muted-foreground">documents</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Flashcards
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{flashcards?.length}</div>
                <p className="text-xs text-muted-foreground">cards</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Files</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{files.length}</div>
                <p className="text-xs text-muted-foreground">uploaded</p>
              </CardContent>
            </Card>
          </div>

       {/* Main Stats Grid */}
       {flashcards && flashcards.length > 0 && (
         <div className="space-y-2" >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Due Today */}
        <Card className={stats.dueToday > 0 ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20' : ''}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Due Today</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.dueToday}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.dueToday === 0 ? 'All caught up!' : 'Ready to review'}
            </p>
          </CardContent>
        </Card>

        {/* Due This Week */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.duethisweek}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Cards to review
            </p>
          </CardContent>
        </Card>

        {/* Mastered Cards */}
        <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Mastered</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.masteredCards}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {masteryPercentage}% of total
            </p>
          </CardContent>
        </Card>

        {/* New Cards */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">New Cards</CardTitle>
              <Zap className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{stats.newcards}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Never reviewed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress & Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mastery Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Mastery Progress
            </CardTitle>
            <CardDescription>
              {stats.masteredCards} of {stats.totalCards} cards mastered
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progress</span>
                <span className="font-medium">{masteryPercentage}%</span>
              </div>
              <Progress value={masteryPercentage} className="h-2" />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-muted rounded">
                <div className="text-lg font-bold">{stats.masteredCards}</div>
                <div className="text-xs text-muted-foreground">Mastered</div>
              </div>
              <div className="p-2 bg-muted rounded">
                <div className="text-lg font-bold">
                  {stats.totalCards - stats.masteredCards - stats.newcards}
                </div>
                <div className="text-xs text-muted-foreground">Learning</div>
              </div>
              <div className="p-2 bg-muted rounded">
                <div className="text-lg font-bold">{stats.newcards}</div>
                <div className="text-xs text-muted-foreground">New</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance
            </CardTitle>
            <CardDescription>
              Your study statistics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Success Rate</span>
                <span className="text-2xl font-bold text-green-600">
                  {Math.round(stats.successRate)}%
                </span>
              </div>
              <Progress value={stats.successRate} className="h-2" />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <div className="text-sm text-muted-foreground">Total Reviews</div>
                <div className="text-2xl font-bold">{stats.totalReviews}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Avg Ease</div>
                <div className="text-2xl font-bold">{stats.averageEase.toFixed(1)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Study Recommendation */}
      {stats.dueToday > 0 && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Ready to Study?</h3>
                <p className="text-sm text-muted-foreground">
                  You have {stats.dueToday} card{stats.dueToday > 1 ? 's' : ''} waiting for review. 
                  Keep up the momentum!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Caught Up Message */}
      {stats.dueToday === 0 && stats.totalCards > 0 && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-700 dark:text-green-400">
                  All Caught Up! 
                </h3>
                <p className="text-sm text-green-600 dark:text-green-500">
                  Great work! No cards due for review right now. 
                  Next review: {stats.duethisweek - stats.dueToday} card{stats.duethisweek - stats.dueToday !== 1 ? 's' : ''} this week.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}


          </div>

       )}
     
      
    </div>
  );
}

export default Dashboard;