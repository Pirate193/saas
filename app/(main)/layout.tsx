import AiModal from "@/components/ai/aimodal";
import CanvasModal from "@/components/ai/canvasmodal";
import { AppSidebar } from "@/components/sidebarcomponents/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "sonner";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Add h-svh (screen viewport height) and overflow-hidden
    <SidebarProvider className="h-svh overflow-hidden">
      <AppSidebar variant="inset" />

      <SidebarInset>
        {children}
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  );
}
