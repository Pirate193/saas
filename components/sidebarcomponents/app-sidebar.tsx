'use client'
import { Home, Inbox, Search, Sparkles } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "../ui/sidebar";
import { NavMain } from "./Nav-main";
import { NavUser } from "./nav-user";
import Navfolders from "./nav-folders";


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
        <Sidebar {...props} >
            <SidebarHeader>

            </SidebarHeader>
            <SidebarContent>
              <NavMain items={data.navMain} />
              <Navfolders />
            </SidebarContent>
            <SidebarFooter>
             <NavUser user={data.user} />
            </SidebarFooter>
        </Sidebar>
    )
}