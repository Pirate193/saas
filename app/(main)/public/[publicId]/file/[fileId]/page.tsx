import { Id } from "@/convex/_generated/dataModel";

import { PublicFileViewer } from "@/components/public/public-file-viewer";

export default async function PublicFilePage({
  params,
}: {
  params: { publicId: string; fileId: string };
}) {
  const { publicId, fileId } = await params;

  return (
    <div className="container mx-auto p-4 lg:p-6 h-[calc(100vh-4rem)] flex flex-col space-y-4">
      <div className="flex-1 min-h-0 border rounded-lg bg-muted/10 overflow-hidden">
        <PublicFileViewer fileId={fileId as Id<"files">} />
      </div>
    </div>
  );
}
