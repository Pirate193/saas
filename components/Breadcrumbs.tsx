"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SlashIcon, Folder, FileText, CreditCard, File as FileIcon } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Define proper types
interface FolderType {
  _id: Id<"folders">;
  _creationTime: number;
  name: string;
  parentId?: string | Id<"folders">;
  userId: string;
  description?: string;
}

interface NoteType {
  _id: Id<"notes">;
  _creationTime: number;
  userId: string;
  folderId?: Id<"folders">;
  title: string;
  content: string;
  updatedAt: number;
}

interface BreadcrumbItemType {
  label: string;
  href: string;
  icon?: React.ReactNode;
  isLast?: boolean;
}

export function BreadcrumbComponent() {
  const pathname = usePathname();
  const folders = useQuery(api.folders.fetchFolders);
  const notes = useQuery(api.notes.fetchNotes);

  // Parse the pathname to extract route segments
  const segments = pathname.split("/").filter(Boolean);

  // Build parent folder chain recursively
  const buildParentChain = (folder: FolderType, allFolders: FolderType[]): FolderType[] => {
    const chain: FolderType[] = [];
    let current = folder;

    while (current.parentId) {
      const parent = allFolders.find((f) => f._id === current.parentId);
      if (parent) {
        chain.unshift(parent);
        current = parent;
      } else {
        break;
      }
    }

    return chain;
  };

  // Format segment name (capitalize, remove hyphens)
  const formatSegment = (segment: string): string => {
    return segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Build breadcrumb trail
  const buildBreadcrumbs = (): BreadcrumbItemType[] => {
    const crumbs: BreadcrumbItemType[] = [];

    // Don't show breadcrumbs on home page
    if (pathname === "/" || pathname === "/home") {
      return crumbs;
    }

    // Handle folder routes
    if (segments[0] === "folders" && segments[1]) {
      const folderId = segments[1] as Id<"folders">;

      // Get folder and build hierarchy
      if (folders) {
        const folder = folders.find((f) => f._id === folderId);

        if (folder) {
          // Build parent chain
          const parentChain = buildParentChain(folder, folders);

          // Add parent folders to breadcrumbs
          parentChain.forEach((parentFolder) => {
            crumbs.push({
              label: parentFolder.name,
              href: `/folders/${parentFolder._id}`,
              icon: <Folder className="h-4 w-4" />,
            });
          });

          // Add current folder
          crumbs.push({
            label: folder.name,
            href: `/folders/${folder._id}`,
            icon: <Folder className="h-4 w-4" />,
            isLast: segments.length === 2,
          });

          // Handle sub-routes (notes, flashcards, files)
          if (segments[2]) {
            const subRoute = segments[2];
            const subRouteConfig: Record<string, { label: string; icon: React.ReactNode }> = {
              notes: { label: "Notes", icon: <FileText className="h-4 w-4" /> },
              flashcards: { label: "Flashcards", icon: <CreditCard className="h-4 w-4" /> },
              files: { label: "Files", icon: <FileIcon className="h-4 w-4" /> },
            };

            // If viewing a specific item (e.g., /folders/xyz/notes/note-id)
            if (segments[3]) {
              const itemId = segments[3] as Id<"notes">; // or other ID types

              // For notes - fetch and display note title
              if (subRoute === "notes" && notes) {
                const note = notes.find((n) => n._id === itemId);
                crumbs.push({
                  label: note?.title || "Untitled Note",
                  href: `/folders/${folderId}/notes/${itemId}`,
                  icon: <FileText className="h-4 w-4" />,
                  isLast: true,
                });
              }
              // For flashcards (TODO: implement when flashcard schema exists)
              else if (subRoute === "flashcards") {
                crumbs.push({
                  label: "Flashcard Set",
                  href: `/folders/${folderId}/flashcards/${itemId}`,
                  icon: <CreditCard className="h-4 w-4" />,
                  isLast: true,
                });
              }
              // For files (TODO: implement when file schema exists)
              else if (subRoute === "files") {
                crumbs.push({
                  label: "File",
                  href: `/folders/${folderId}/files/${itemId}`,
                  icon: <FileIcon className="h-4 w-4" />,
                  isLast: true,
                });
              }
            }
            // If viewing list view (e.g., /folders/xyz/notes)
            else if (subRouteConfig[subRoute]) {
              crumbs.push({
                label: subRouteConfig[subRoute].label,
                href: `/folders/${folderId}/${subRoute}`,
                icon: subRouteConfig[subRoute].icon,
                isLast: true,
              });
            }
          }
        }
      }
    } else if (segments[0] === "notes" && segments[1]) {
      // Individual note view (standalone, not in a folder)
      crumbs.push({
        label: "Notes",
        href: "/notes",
        icon: <FileText className="h-4 w-4" />,
      });

      // Fetch specific note if notes are loaded
      if (notes) {
        const noteId = segments[1] as Id<"notes">;
        const note = notes.find((n) => n._id === noteId);
        crumbs.push({
          label: note?.title || "Note Details",
          href: `/notes/${segments[1]}`,
          icon: <FileText className="h-4 w-4" />,
          isLast: true,
        });
      }
    } else if (segments[0] === "flashcards") {
      crumbs.push({
        label: "Flashcards",
        href: "/flashcards",
        icon: <CreditCard className="h-4 w-4" />,
        isLast: segments.length === 1,
      });
    } else if (segments[0] === "tasks") {
      crumbs.push({
        label: "Tasks",
        href: "/tasks",
        isLast: true,
      });
    } else {
      // Fallback for other routes - start from first segment
      segments.forEach((segment, index) => {
        const isLast = index === segments.length - 1;
        crumbs.push({
          label: formatSegment(segment),
          href: `/${segments.slice(0, index + 1).join("/")}`,
          isLast,
        });
      });
    }

    return crumbs;
  };

  const breadcrumbs = buildBreadcrumbs();

  // Don't render anything if no breadcrumbs
  if (breadcrumbs.length === 0) {
    return null;
  }

  // Show loading state if folders are being fetched
  if (!folders && pathname.includes("/folders/")) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <div className="text-sm text-muted-foreground">Loading...</div>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => (
          <div key={`${crumb.href}-${index}`} className="flex items-center">
            <BreadcrumbItem>
              {crumb.isLast ? (
                <BreadcrumbPage className="flex items-center gap-2">
                  {crumb.icon}
                  <span>{crumb.label}</span>
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={crumb.href} className="flex items-center gap-2">
                    {crumb.icon}
                    <span>{crumb.label}</span>
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < breadcrumbs.length - 1 && (
              <BreadcrumbSeparator>
                <SlashIcon />
              </BreadcrumbSeparator>
            )}
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}