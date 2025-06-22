/** biome-ignore-all lint/nursery/useUniqueElementIds: <explanation> */
import { SettingsLayout } from "@/components/sandbox/right-inner/chat/settings/settings-layout";
import { Avatar, AvatarFallback, AvatarImage } from "@docsurf/ui/components/avatar";
import { Badge } from "@docsurf/ui/components/badge";
import { Button } from "@docsurf/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@docsurf/ui/components/card";
import { Input } from "@docsurf/ui/components/input";
import { Label } from "@docsurf/ui/components/label";
import { Separator } from "@docsurf/ui/components/separator";
// import { useListSessions, useRevokeOtherSessions, useRevokeSession, useSession, useUpdateUser } from "@/hooks/auth-hooks";
import { authClient } from "@/lib/auth-client";
import { cn } from "@docsurf/ui/lib/utils";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Edit, Globe, Laptop, LogOut, Monitor, Save, Smartphone, Tablet, UserX, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { UAParser } from "ua-parser-js";

export const Route = createFileRoute("/settings/profile")({
   component: UserAccountSettings,
});

function UserAccountSettings() {
   //    const { data: session, isLoading: sessionLoading } = useSession();
   const { data: session, isPending: sessionLoading } = authClient.useSession();
   //    const { data: sessions = [], isLoading: sessionsLoading } = useListSessions();
   const { data: sessions = [], isPending: sessionsLoading } = authClient.listSessions();
   // const updateUser = useUpdateUser();
   // const revokeSession = useRevokeSession();
   // const revokeOtherSessions = useRevokeOtherSessions();
   const router = useRouter();
   const [isEditingName, setIsEditingName] = useState(false);
   const [nameValue, setNameValue] = useState("");

   // Initialize name value when session data loads
   const displayName = useMemo(() => {
      if (session?.user?.name?.trim()) {
         return session.user.name;
      }
      return session?.user?.email?.split("@")[0] || null;
   }, [session?.user?.name, session?.user?.email]);

   const handleEditName = useCallback(() => {
      setNameValue(displayName || "");
      setIsEditingName(true);
   }, [displayName]);

   const handleSaveName = useCallback(async () => {
      if (!nameValue.trim()) {
         toast.error("Name cannot be empty");
         return;
      }

      try {
         await updateUser.mutateAsync({ name: nameValue.trim() });
         setIsEditingName(false);
         toast.success("Name updated successfully");
      } catch (error) {
         toast.error("Failed to update name");
         console.error("Error updating name:", error);
      }
   }, [nameValue, updateUser]);

   const handleCancelEdit = useCallback(() => {
      setIsEditingName(false);
      setNameValue("");
   }, []);

   const handleRevokeSession = useCallback(
      async (sessionId: string) => {
         try {
            await revokeSession.mutateAsync({ sessionId });
            toast.success("Session revoked successfully");
         } catch (error) {
            toast.error("Failed to revoke session");
            console.error("Error revoking session:", error);
         }
      },
      [revokeSession]
   );

   const handleSignOut = useCallback(async () => {
      try {
         await authClient.signOut();
         // await queryClient.resetQueries({ queryKey: ["session"] })
         // await queryClient.resetQueries({ queryKey: ["token"] })
         const keys = Object.keys(localStorage);
         for (const key of keys) {
            if (key.includes("_CACHE")) {
               localStorage.removeItem(key);
            }
         }
         toast.success("Signed out successfully");
         router.navigate({ to: "/" });
      } catch (error) {
         toast.error("Failed to sign out");
         console.error("Error signing out:", error);
      }
   }, []);

   const handleRevokeOtherSessions = useCallback(async () => {
      try {
         await revokeOtherSessions.mutateAsync({});
         toast.success("All other sessions revoked successfully");
      } catch (error) {
         toast.error("Failed to revoke other sessions");
         console.error("Error revoking other sessions:", error);
      }
   }, [revokeOtherSessions]);

   const getDeviceInfo = useCallback((userAgent: string | null | undefined) => {
      if (!userAgent) {
         return { name: "Unknown Device", icon: Globe };
      }

      const parser = new UAParser(userAgent);
      const device = parser.getDevice();
      const browser = parser.getBrowser();
      const os = parser.getOS();

      let icon = Globe;
      let deviceType = "Unknown";

      if (device.type === "mobile") {
         icon = Smartphone;
         deviceType = "Mobile";
      } else if (device.type === "tablet") {
         icon = Tablet;
         deviceType = "Tablet";
      } else if (
         os.name?.toLowerCase().includes("mac") ||
         os.name?.toLowerCase().includes("windows") ||
         os.name?.toLowerCase().includes("linux")
      ) {
         icon = device.type === "console" ? Monitor : Laptop;
         deviceType = "Desktop";
      }

      const name = `${deviceType} • ${browser.name || "Unknown Browser"}`;

      return { name, icon, os: os.name, browser: browser.name };
   }, []);

   const formatLastSeen = useCallback((lastSeen: string | Date) => {
      const date = new Date(lastSeen);
      return new Intl.DateTimeFormat("en-US", {
         dateStyle: "short",
         timeStyle: "short",
      }).format(date);
   }, []);

   if (sessionLoading) {
      return (
         <SettingsLayout title="User Account" description="Manage your account settings and active sessions.">
            <div className="flex items-center justify-center p-8">
               <div className="h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
            </div>
         </SettingsLayout>
      );
   }

   return (
      <SettingsLayout title="User Account" description="Manage your account settings and active sessions.">
         <div className="space-y-6">
            {/* Profile Information */}
            <Card>
               <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Your personal account information</CardDescription>
               </CardHeader>
               <CardContent className="space-y-6">
                  <div className="flex items-center space-x-4">
                     <Avatar className="h-20 w-20">
                        <AvatarImage src={session?.user?.image || ""} />
                        <AvatarFallback className="text-lg">{displayName ? displayName.charAt(0).toUpperCase() : "?"}</AvatarFallback>
                     </Avatar>
                  </div>

                  <div className="grid gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="name" className="font-medium text-muted-foreground text-sm">
                           Name
                        </Label>
                        {isEditingName ? (
                           <div className="flex flex-col gap-2 sm:flex-row">
                              <Input
                                 id="name"
                                 value={nameValue}
                                 onChange={(e) => setNameValue(e.target.value)}
                                 placeholder="Enter your name"
                                 className="flex-1"
                              />
                              <div className="flex gap-2">
                                 <Button
                                    onClick={handleSaveName}
                                    disabled={updateUser.isPending}
                                    size="sm"
                                    className="flex-1 sm:flex-none"
                                 >
                                    <Save className="h-4 w-4" />
                                    {updateUser.isPending ? "Saving..." : "Save"}
                                 </Button>
                                 <Button onClick={handleCancelEdit} variant="outline" size="sm" className="flex-1 sm:flex-none">
                                    <X className="h-4 w-4" />
                                    Cancel
                                 </Button>
                              </div>
                           </div>
                        ) : (
                           <div className="flex items-center justify-between">
                              <div className={cn("text-sm", !displayName && "text-muted-foreground italic")}>
                                 {displayName || "No name"}
                              </div>
                              <Button onClick={handleEditName} variant="ghost" size="sm">
                                 <Edit className="h-4 w-4" />
                                 Edit
                              </Button>
                           </div>
                        )}
                     </div>

                     <div className="space-y-2">
                        <Label className="font-medium text-muted-foreground text-sm">Email</Label>
                        <div className="text-sm">{session?.user?.email}</div>
                     </div>

                     <div className="space-y-2">
                        <Label className="font-medium text-muted-foreground text-sm">User ID</Label>
                        <div className="font-mono text-muted-foreground text-xs">{session?.user?.id}</div>
                     </div>
                  </div>
               </CardContent>
            </Card>

            {/* Session Management */}
            <Card>
               <CardHeader>
                  <CardTitle>Active Sessions</CardTitle>
                  <CardDescription>Manage your active login sessions across devices</CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                  {sessionsLoading ? (
                     <div className="flex items-center justify-center p-4">
                        <div className="h-6 w-6 animate-spin rounded-full border-primary border-b-2" />
                     </div>
                  ) : (
                     <>
                        <div className="space-y-3">
                           {sessions?.map((sessionItem) => {
                              const deviceInfo = getDeviceInfo(sessionItem.userAgent);
                              const DeviceIcon = deviceInfo.icon;
                              const isCurrentSession = sessionItem.id === session?.session?.id;

                              return (
                                 <div
                                    key={sessionItem.id}
                                    className={cn(
                                       "flex flex-col justify-between gap-3 rounded-lg border p-3 sm:flex-row sm:items-center",
                                       isCurrentSession ? "border-primary bg-primary/5" : "border-border"
                                    )}
                                 >
                                    <div className="flex flex-1 items-start gap-3">
                                       <div className="mt-0.5">
                                          <DeviceIcon className="h-5 w-5 text-muted-foreground" />
                                       </div>
                                       <div className="flex-1 space-y-1">
                                          <div className="flex flex-wrap items-center gap-2">
                                             <span className="font-medium text-sm">{deviceInfo.name}</span>
                                             {isCurrentSession && (
                                                <Badge variant="secondary" className="text-xs">
                                                   Current
                                                </Badge>
                                             )}
                                          </div>
                                          <div className="text-muted-foreground text-xs">
                                             Last seen: {formatLastSeen(sessionItem.createdAt)}
                                          </div>
                                          {sessionItem.ipAddress && (
                                             <div className="text-muted-foreground text-xs">IP: {sessionItem.ipAddress}</div>
                                          )}
                                       </div>
                                    </div>
                                    <div className="flex-shrink-0">
                                       {isCurrentSession ? (
                                          <Button onClick={handleSignOut} variant="destructive" size="sm" className="w-full sm:w-auto">
                                             <LogOut className="h-4 w-4" />
                                             Sign Out
                                          </Button>
                                       ) : (
                                          <Button
                                             onClick={() => handleRevokeSession(sessionItem.id)}
                                             variant="destructive"
                                             size="sm"
                                             disabled={revokeSession.isPending}
                                             className="w-full sm:w-auto"
                                          >
                                             <UserX className="h-4 w-4" />
                                             Revoke
                                          </Button>
                                       )}
                                    </div>
                                 </div>
                              );
                           })}
                        </div>

                        {sessions && sessions.length > 1 && (
                           <>
                              <Separator />
                              <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                                 <div>
                                    <div className="font-medium text-sm">Security Action</div>
                                    <div className="text-muted-foreground text-xs">Sign out of all other devices</div>
                                 </div>
                                 <Button
                                    onClick={handleRevokeOtherSessions}
                                    variant="destructive"
                                    size="sm"
                                    disabled={revokeOtherSessions.isPending}
                                    className="w-full sm:w-auto"
                                 >
                                    <UserX className="h-4 w-4" />
                                    {revokeOtherSessions.isPending ? "Revoking..." : "Revoke All Other Sessions"}
                                 </Button>
                              </div>
                           </>
                        )}
                     </>
                  )}
               </CardContent>
            </Card>
         </div>
      </SettingsLayout>
   );
}
