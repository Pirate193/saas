import React, { useState } from "react";
import { createReactBlockSpec } from "@blocknote/react";
import { defaultProps } from "@blocknote/core";

/**
 * Helper function to parse a YouTube URL and extract the video ID.
 * This supports standard watch links, share links, and embed links.
 */
function getYoutubeVideoId(url: string): string | null {
  if (!url) {
    return null;
  }
  
  // This regex matches:
  // - youtube.com/watch?v=...
  // - youtu.be/...
  // - youtube.com/embed/...
  const regex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/;
  const match = url.match(regex);
  
  return match ? match[1] : null;
}

// 1. Define the "blueprint" for our YouTube block
export const createYoutubeVideo = createReactBlockSpec(
  {
    type: "youtubeVideo",
    propSchema: {
      ...defaultProps,
      // We'll store the video URL (as an embed-ready URL)
      videoUrl: {
        default: "",
      },
    },
    content: "none", // This is a "leaf" block, like an image or embed
  },
  {
    // 2. This is the React component that will be rendered
    render: (props) => <YoutubeVideoBlock {...props} />,
  }
);

// 3. This is our custom React component
function YoutubeVideoBlock({ block, editor }: any) {
  // Stores the value of the <input> field
  const [urlInput, setUrlInput] = useState("");

  // This function runs when the "Save" button is clicked
  const handleSubmit = () => {
    // 1. Get the video ID from the input
    const videoId = getYoutubeVideoId(urlInput);

    if (!videoId) {
      alert("Invalid YouTube URL. Please check the link and try again.");
      return;
    }

    // 2. Create the standard embed URL
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;

    // 3. Update the block's props with the new URL
    // This will cause the component to re-render, hiding
    // the input form and showing the video player.
    editor.updateBlock(block.id, {
      props: {
        videoUrl: embedUrl,
      },
    });
  };

  // State 1: Show the video player
  // If a videoUrl is already saved, we show the iframe
  if (block.props.videoUrl) {
    return (
      <div
        className="rounded-lg overflow-hidden"
        style={{
          width: "100%",
          aspectRatio: "16 / 9", // Modern CSS for 16:9 responsive embed
          border: "2px solid var(--border, #e5e7eb)",
        }}
      >
        <iframe
          style={{ width: "100%", height: "100%" }}
          src={block.props.videoUrl}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    );
  }

  // State 2: Show the input form
  // If no videoUrl is set, we show the input prompt
  return (
    <div className="bg-muted/30 border rounded-lg p-4 flex flex-col sm:flex-row items-center gap-2">
      <label htmlFor={`yt-url-${block.id}`} className="text-sm font-medium text-muted-foreground">
        YouTube URL:
      </label>
      <input
        id={`yt-url-${block.id}`}
        type="text"
        value={urlInput}
        onChange={(e) => setUrlInput(e.target.value)}
        placeholder="https-://www.youtube.com/watch?v=..."
        className="flex-grow w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
      <button
        onClick={handleSubmit}
        className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium w-full sm:w-auto"
      >
        Save
      </button>
    </div>
  );
}