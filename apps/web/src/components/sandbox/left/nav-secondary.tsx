import * as React from "react";
import { type LucideIcon } from "lucide-react";
import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@docsurf/ui/components/sidebar";
import UserGuide from "./nav-user/user-guide";

interface NavItem {
   title: string;
   url?: string;
   icon: LucideIcon;
   onClick?: () => void;
   id?: string;
}

export function NavSecondary({
   items,
   ...props
}: {
   items: NavItem[];
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
   return (
      <SidebarGroup {...props} className="p-0">
         <SidebarGroupContent>
            <SidebarMenu>
               {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                     <SidebarMenuButton
                        size="sm"
                        className="cursor-pointer hover:bg-bg-subtle/90 dark:hover:bg-bg-subtle/70"
                        onClick={item.onClick}
                     >
                        <item.icon />
                        <span>{item.title}</span>
                     </SidebarMenuButton>
                  </SidebarMenuItem>
               ))}
               <SidebarMenuItem>
                  <UserGuide />
               </SidebarMenuItem>
            </SidebarMenu>
         </SidebarGroupContent>
      </SidebarGroup>
   );
}
