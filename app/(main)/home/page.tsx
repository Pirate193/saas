import { ModeToggle } from "@/components/themetoggle";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { api } from "@/convex/_generated/api";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Folderlist } from "@/components/folderscomponents/folderlist";
import { AiTriggerButton } from "@/components/ai/aiModaltrigger";
import { SavedList } from "@/components/saved/SavedList";

export default function HomePage() {
  return (
    <div className="p-8 overflow-y-auto scrollbar-hidden ">
      <div className="flex flex-row gap-2  items-center">
        <div>
          <SidebarTrigger size="icon-lg" />
        </div>
        <h1 className="text-3xl font-bold">Home</h1>
      </div>
      <Tabs defaultValue="All">
        <TabsList className=" dark:bg-[#262626] ">
          <TabsTrigger
            value="All"
            className="data-[state=active]:bg-myprimary   data-[state=active]:text-white dark:data-[state=active]:bg-myprimary dark:data-[state=active]:text-white dark:text-white "
          >
            All
          </TabsTrigger>
          <TabsTrigger
            value="Saved"
            className="data-[state=active]:bg-myprimary data-[state=active]:text-white dark:data-[state=active]:bg-myprimary dark:data-[state=active]:text-white  dark:text-white "
          >
            Saved
          </TabsTrigger>
        </TabsList>
        <TabsContent value="All">
          <Folderlist />
        </TabsContent>
        <TabsContent value="Saved">
          <SavedList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
