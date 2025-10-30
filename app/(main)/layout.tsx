import { BreadcrumbComponent} from "@/components/Breadcrumbs"
import { AppSidebar } from "@/components/sidebarcomponents/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { SignedIn } from "@clerk/nextjs"

export default function MainLayout({
children,
}: Readonly<{
  children: React.ReactNode
}>){
       return (
         <SidebarProvider>
           <AppSidebar />
           <main className="flex-1 flex flex-col w-full">
        {/* Header with Sidebar Trigger and Breadcrumbs */}
        <div className=" sticky top-0 bg-background z-10">
          <div className="flex items-center gap-2 px-4 ">
            <SidebarTrigger />
            <SignedIn>
              <BreadcrumbComponent/>
            </SignedIn>
          </div>
        </div>
        
        {/* Main Content */}
        <SignedIn>
          <div className="flex-1">
            {children}
          </div>
        </SignedIn>
      </main>
        </SidebarProvider>
       )
}