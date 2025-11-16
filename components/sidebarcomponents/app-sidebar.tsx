'use client'
import { Home, Inbox, Search, Sparkles } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "../ui/sidebar";
import { NavMain } from "./Nav-main";
import { NavUser } from "./nav-user";
import Navfolders from "./nav-folders";
import Navheader from "./nav-header";
import { usePathname } from 'next/navigation';


const data = {
     user:{
        name:'pato',
        email:'pato@gmail.com',
        avatar:'https://github.com/shadcn.png',
    },
    navMain:[
    {
      title: "Ask AI",
      url: "/Ai",
      icon: Sparkles,
    },
    {
      title: "Home",
      url: "/home",
      icon: Home,
    
    },
    {
      title: "Inbox",
      url: "/inbox",
      icon: Inbox,
    },
    ]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname(); // <-- 2. Get the current path

  // 3. Create a new array with `isActive` property
  const navItemsWithActive = data.navMain.map(item => {
    // Check if the item's URL is a non-hash link and if the current path starts with it.
    // This makes '/Ai' active even if the URL is '/Ai/123-chat-id'
    const isActive =
      item.url !== '#' && pathname.startsWith(item.url);

    return {
      ...item,
      isActive: isActive,
    };
  });
    return (
        <Sidebar {...props} className="bg-mysidebar" >
            <SidebarHeader>
               <Navheader />
               <NavMain items={navItemsWithActive} />
            </SidebarHeader>
            <SidebarContent className="[scrollbar-width:none] [&::-webkit-scrollbar]:hidden" >
              <Navfolders />
            </SidebarContent>
            <SidebarFooter>
             <NavUser />
            </SidebarFooter>
        </Sidebar>
    )
}