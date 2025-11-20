import PublicHeader from "@/components/public/public-header";
import Publicnav from "@/components/public/publicnav";

import { Id } from "@/convex/_generated/dataModel";

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  return (
    <div className="min-h-screen flex flex-col">
      {/* 1. THE BANNER (Top, Full Width) */}
      <header className="w-full  z-10  top-0">
        <PublicHeader folderId={publicId as Id<"folders">} />
      </header>

      {/* 2. THE MAIN WORKSPACE (Centered content area) */}
      <div className="flex flex-1  ">
        {/* A. LEFT/MIDDLE: The Main Content (Note, File, etc.) */}
        <main className="flex-1 min-w-0 px-2 sm:px-4 py-2 md:pr-6">
          <div className="w-full">{children}</div>
        </main>

        {/* B. RIGHT: The Navigation Sidebar */}
        <aside className="w-72  hidden lg:block ">
          {/* Sticky sidebar content accounting for the header height */}
          <div className="sticky top-16  h-[calc(100vh-64px)]  p-6">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 pl-2">
              Contents
            </h3>
            <Publicnav rootFolderId={publicId as Id<"folders">} />
          </div>
        </aside>
      </div>
    </div>
  );
}
