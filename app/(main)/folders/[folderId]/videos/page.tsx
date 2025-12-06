import VideoList from "@/components/videos/VideoList";
import { Id } from "@/convex/_generated/dataModel";

const videoPage = async ({
  params,
}: {
  params: Promise<{ folderId: string }>;
}) => {
  const { folderId } = await params;
  return <VideoList folderId={folderId as Id<"folders">} />;
};

export default videoPage;
