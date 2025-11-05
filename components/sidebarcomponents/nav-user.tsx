"use client";

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
} from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
// 1. REMOVE Dialog imports
import { Skeleton } from "@/components/ui/skeleton";
import { ModeToggle } from "../themetoggle";

// 2. IMPORT your new AccountModal
import { AccountModal } from "./account-modal";

export function NavUser() {
  const { isMobile } = useSidebar();
  const { user, isLoaded } = useUser();
  // 3. REMOVE openUserProfile from useClerk()
  const { signOut } = useClerk();
  const router = useRouter();
  
  // 4. ADD state to control your modal
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  // Loading state
  if (!isLoaded) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex items-center gap-2 px-2 py-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (!user) return null;

  // Get user initials for avatar fallback
  const getInitials = () => {
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U";
  };

  // Get full name
  const fullName = user.fullName || user.emailAddresses[0]?.emailAddress || "User";
  const email = user.emailAddresses[0]?.emailAddress || "";

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  // 5. This function now just toggles your modal state
  const handleAccountSettings = () => {
    setIsAccountModalOpen(true);
  };

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.imageUrl} alt={fullName} />
                  <AvatarFallback className="rounded-lg">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{fullName}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {email}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user.imageUrl} alt={fullName} />
                    <AvatarFallback className="rounded-lg">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{fullName}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {email}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                 <DropdownMenuItem onSelect={(e) => e.preventDefault()} >
                  <ModeToggle />
                 </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              {/* Upgrade to Pro */}
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => console.log('open upgrade modal')}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Upgrade to Pro
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              {/* Settings Options */}
              <DropdownMenuGroup>
                {/* 6. This now calls your local function */}
                <DropdownMenuItem onClick={handleAccountSettings}>
                  <BadgeCheck className="mr-2 h-4 w-4" />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => console.log('open billing modal')}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => console.log('open notifications modal')}>
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              {/* Sign Out */}
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* 7. Render your modal component here */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onOpenChange={setIsAccountModalOpen}
      />
    </>
  );
}