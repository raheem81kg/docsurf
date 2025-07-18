// import { ShareButton } from "./share-button";
// import { SidebarTrigger } from "@docsurf/ui/components/sidebar";
// import { UserButton } from "./user-button";
// import { ThemeSwitcher } from "@/components/themes/theme-switcher";

// export function Header({ threadId }: { threadId?: string }) {
//    return (
//       <header className="pointer-events-none absolute top-0 z-50 w-full">
//          <div className="flex w-full items-center justify-between">
//             <div className="pointer-events-auto">
//                <div className="flex items-center gap-2 rounded-xl bg-background/10 p-2 backdrop-blur-sm">
//                   <SidebarTrigger />
//                   <div className="h-4 w-px bg-border" />
//                </div>
//             </div>
//             <div className="pointer-events-auto flex items-center space-x-2 rounded-xl bg-background/10 p-2 backdrop-blur-sm">
//                {threadId && <ShareButton threadId={threadId} />}
//                <ThemeSwitcher />
//                <div className="h-4 w-px bg-border" />
//                <UserButton />
//             </div>
//          </div>
//       </header>
//    );
// }
