import { ModeToggle } from "@/components/themetoggle";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { api } from "@/convex/_generated/api";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Folderlist } from "@/components/folderscomponents/folderlist";

export default function HomePage() {
  return (
    <div className="p-8 overflow-y-auto scrollbar-hidden ">
      <div className="flex flex-row gap-2  items-center">
        <div>
          <SidebarTrigger size="icon-lg" />
        </div>
        <h1 className="text-3xl font-bold">Home</h1>
      </div>
      <Tabs defaultValue="All"   >
        <TabsList className=" dark:bg-[#262626] "  >
          <TabsTrigger value="All" className="data-[state=active]:bg-myprimary   data-[state=active]:text-white dark:data-[state=active]:bg-myprimary dark:data-[state=active]:text-white dark:text-white " >All</TabsTrigger>
          <TabsTrigger value="Shared With you " className="data-[state=active]:bg-myprimary data-[state=active]:text-white dark:data-[state=active]:bg-myprimary dark:data-[state=active]:text-white  dark:text-white " >Shared With you</TabsTrigger>
          <TabsTrigger value="Owned By You " className="data-[state=active]:bg-myprimary data-[state=active]:text-white dark:data-[state=active]:bg-myprimary dark:data-[state=active]:text-white dark:text-white ">Owned By you</TabsTrigger>
        </TabsList>
        <TabsContent value="All">
          <Folderlist />
        </TabsContent> 
        <TabsContent value="Shared With you">shared with you </TabsContent>
        <TabsContent value="Owned By You"> owned by you</TabsContent>
      </Tabs>
    </div>
  );
}
