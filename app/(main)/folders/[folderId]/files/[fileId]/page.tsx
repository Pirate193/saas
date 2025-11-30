"use client";
import PDFViewer from "@/components/filescomponents/pdf-viewer";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { fetchQuery } from "convex/nextjs";
import {
  ArrowLeft,
  ExternalLink,
  Folder,
  Sidebar,
  SidebarClose,
  SlashIcon,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { SidebarTrigger } from "@/components/ui/sidebar";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useState } from "react";
import Chatwithpdf from "@/components/filescomponents/chatwithpdf";
import extractTextFromPDF from "@/lib/pdfparse";
import { UsageLimitModal } from "@/components/subscription/usage-limit-modal";
import CanvasModal from "@/components/ai/canvasmodal";
const FilePage = () => {
  const params = useParams();
  const fileId = params.fileId;
  const file = useQuery(api.files.getFile, { fileId: fileId as Id<"files"> });
  const folder = useQuery(api.folders.getFolderById, {
    folderId: file?.file.folderId as Id<"folders">,
  });
  const canchat = useQuery(api.subscriptions.canUseChatWithPDF);
  const [islimitmodalopen, setIsLimitModalOpen] = useState(false);
  const [openchat, setopenchat] = useState(false);
  if (!file) {
    return (
      <div className="flex items-center justify-center h-[600px] w-full">
        <div className="flex items-center justify-center ">
          <p> File not Found</p>
          <Link href={`/folders}`}>
            <Button>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const renderFileView = () => {
    switch (file.file.fileType) {
      case "application/pdf":
        return (
          <PDFViewer
            fileName={file.file.fileName}
            fileUrl={file.fileurl as string}
          />
        );
      case "image/*":
        return (
          <Image
            src={file.fileurl as string}
            alt={file.file.fileName || "image"}
            className="max-w-full h-[100vh] object-contain"
          />
        );
      default:
        return (
          <div className="text-center py-12">
            <p className=" mb-4">
              Preview not available yet for this file type
            </p>
            <Button asChild>
              <a
                href={file.fileurl as string}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open File in new tab
              </a>
            </Button>
          </div>
        );
    }
  };
  const handleopenchatwithpdf = () => {
    const access = canchat?.allowed;
    if (!access) {
      setIsLimitModalOpen(true);
    } else {
      setopenchat(!openchat);
    }
  };
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="h-14 w-full border-b flex items-center justify-between px-4 shrink-0">
        <div className="flex flex-row gap-2 items-center">
          <SidebarTrigger />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link
                    href={`/folders/${folder?._id}`}
                    className="flex items-center gap-2"
                  >
                    <Folder className="h-4 w-4" />
                    <span> {folder?.name} </span>{" "}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <SlashIcon />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage>{file.file.fileName}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="text-sm text-muted-foreground">
          <Button onClick={() => handleopenchatwithpdf()}>
            <Sparkles />
          </Button>
        </div>
      </div>

      {/* 2. Resizable Content Area */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Left Panel: PDF Viewer */}
          <ResizablePanel defaultSize={60} minSize={30}>
            {/* This div ensures the PDF viewer scales correctly within the panel */}
            <div className="h-full w-full">{renderFileView()}</div>
          </ResizablePanel>
          {openchat && (
            <>
              <ResizableHandle
                withHandle={false}
                className="bg-transparent w-2"
              />

              {/* Right Panel: AI Chat  */}
              <ResizablePanel
                defaultSize={40}
                minSize={30}
                className="hidden lg:block"
              >
                <div className="h-full p-3 pl-0">
                  <div className="h-full w-full bg-background rounded-3xl border shadow-sm overflow-hidden flex flex-col">
                    <Chatwithpdf fileId={file.file._id} />
                  </div>
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
      <UsageLimitModal
        isOpen={islimitmodalopen}
        onOpenChange={setIsLimitModalOpen}
        limitType="chat_pdf"
      />
      <CanvasModal />
    </div>
  );
};

export default FilePage;
