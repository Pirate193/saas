'use client'
import { Home, Inbox, Search, Sparkles } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "../ui/sidebar";
import { NavMain } from "./Nav-main";
import { NavUser } from "./nav-user";
import Navfolders from "./nav-folders";
import Navheader from "./nav-header";


const data = {
     user:{
        name:'pato',
        email:'pato@gmail.com',
        avatar:'https://github.com/shadcn.png',
    },
    navMain:[
     {
      title: "Search",
      url: "#",
      icon: Search,
    },
    {
      title: "Ask AI",
      url: "#",
      icon: Sparkles,
    },
    {
      title: "Home",
      url: "/home",
      icon: Home,
    
    },
    {
      title: "Inbox",
      url: "#",
      icon: Inbox,
    },
    ]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar {...props} className="bg-mysidebar" >
            <SidebarHeader>
               <Navheader />
               <NavMain items={data.navMain} />
            </SidebarHeader>
            <SidebarContent className="[scrollbar-width:none] [&::-webkit-scrollbar]:hidden" >
              <Navfolders />
            </SidebarContent>
            <SidebarFooter>
             <NavUser user={data.user} />
            </SidebarFooter>
        </Sidebar>
    )
}