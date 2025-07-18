"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@docsurf/ui/components/avatar";
import { Button } from "@docsurf/ui/components/button";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@docsurf/ui/components/dropdown-menu";
import { useSession } from "@/hooks/auth-hooks";
import { GitHubIcon, XIcon } from "@daveyplate/better-auth-ui";
import { useRouter } from "@tanstack/react-router";
import { BookText, Loader2, LogOutIcon, SettingsIcon, UserIcon, UserLock, Users } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export function UserButton() {
   const { data: session, isPending } = useSession();
   const router = useRouter();

   if (isPending) {
      return (
         <div className="flex h-8 w-8 items-center justify-center rounded-md">
            <Loader2 className="h-4 w-4 animate-spin" />
         </div>
      );
   }

   if (!session?.user) {
      return (
         <Button variant="outline" onClick={() => router.navigate({ to: "/auth" })}>
            Sign In
         </Button>
      );
   }

   const handleSignOut = async () => {
      await authClient.signOut();
      // await queryClient.resetQueries({ queryKey: ["session"] })
      // await queryClient.resetQueries({ queryKey: ["token"] })
      router.navigate({ to: "/" });
      const keys = Object.keys(localStorage);
      for (const key of keys) {
         if (key.includes("_CACHE")) {
            localStorage.removeItem(key);
         }
      }
   };

   const getInitials = (name: string) => {
      return name
         .split(" ")
         .map((n) => n[0])
         .join("")
         .toUpperCase()
         .slice(0, 2);
   };

   return (
      <DropdownMenu>
         <DropdownMenuTrigger asChild>
            <button type="button" className="relative h-8 w-8 rounded-md">
               <Avatar className="h-8 w-8 rounded-md">
                  <AvatarImage src={session.user.image || undefined} alt={session.user.name || "User"} />
                  <AvatarFallback>
                     {session.user.name ? getInitials(session.user.name) : <UserIcon className="h-4 w-4 rounded-md" />}
                  </AvatarFallback>
               </Avatar>
            </button>
         </DropdownMenuTrigger>
         <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
               <div className="flex flex-col space-y-1">
                  <p className="font-medium text-sm leading-none">{session.user.name || "User"}</p>
                  <p className="text-muted-foreground text-xs leading-none">{session.user.email}</p>
               </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.navigate({ to: "/settings" })}>
               <SettingsIcon className="h-4 w-4" />
               <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.navigate({ to: "/about" })}>
               <Users className="h-4 w-4" />
               <span>About Us</span>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
               <a href="https://github.com/intern3-chat/intern3-chat" target="_blank" rel="noopener noreferrer">
                  <GitHubIcon className="h-4 w-4" />
                  <span>GitHub</span>
               </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
               <a href="https://x.com/intern3chat" target="_blank" rel="noopener noreferrer">
                  <XIcon className="h-4 w-4" />
                  <span>Twitter</span>
               </a>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.navigate({ to: "/policy" })}>
               <UserLock className="h-4 w-4" />
               <span>Privacy Policy</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleSignOut}>
               <LogOutIcon className="h-4 w-4" />
               <span>Sign Out</span>
            </DropdownMenuItem>
         </DropdownMenuContent>
      </DropdownMenu>
   );
}
