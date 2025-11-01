import { BreadcrumbComponent } from "@/components/Breadcrumbs";
import { AppSidebar } from "@/components/sidebarcomponents/app-sidebar";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SignedIn } from "@clerk/nextjs";
import { Toaster } from "sonner";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
     <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
         <main>
          {children}
          </main>
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  );
}
