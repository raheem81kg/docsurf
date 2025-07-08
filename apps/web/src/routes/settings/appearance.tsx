import { ImportThemeDialog } from "@/components/themes/import-theme-dialog";
import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
   AlertDialogTrigger,
} from "@docsurf/ui/components/alert-dialog";
import { Button } from "@docsurf/ui/components/button";
import { Card } from "@docsurf/ui/components/card";
import { Input } from "@docsurf/ui/components/input";
import { Label } from "@docsurf/ui/components/label";
import { useThemeManagement } from "@/components/sandbox/right-inner/chat/hooks/use-theme-management";
import { useChatWidthStore } from "@/components/sandbox/right-inner/chat/lib/chat-width-store";
import { type FetchedTheme, extractThemeColors } from "@/components/sandbox/right-inner/chat/lib/theme-utils";
import { cn } from "@docsurf/ui/lib/utils";
import { createFileRoute } from "@tanstack/react-router";
import {
   CheckCircle,
   ExternalLinkIcon,
   Eye,
   MoonIcon,
   PlusIcon,
   RectangleHorizontal,
   Search,
   ShuffleIcon,
   Square,
   SunIcon,
   Trash2,
} from "lucide-react";
import { memo, useState } from "react";
import { SettingsLayout } from "@/components/sandbox/right-inner/chat/settings/settings-layout";
import { Skeleton } from "@docsurf/ui/components/skeleton";

type ThemeCardProps = {
   theme: FetchedTheme;
   isSelected: boolean;
   onSelect: (theme: FetchedTheme) => void;
   onDelete?: (url: string) => void;
   currentMode: "light" | "dark";
};

export const Route = createFileRoute("/settings/appearance")({
   ssr: false,
   component: AppearanceSettings,
});

const ThemeCard = memo(({ theme, isSelected, onSelect, onDelete, currentMode }: ThemeCardProps) => {
   const colors = "error" in theme && theme.error ? [] : "preset" in theme ? extractThemeColors(theme.preset, currentMode) : [];

   const isCustomTheme = theme.type === "custom";

   return (
      <Card
         className={cn(
            "group relative overflow-hidden p-0",
            isSelected ? "bg-primary/5 ring-1 ring-primary/20" : "hover:ring-1 hover:ring-border",
            "error" in theme && theme.error && "cursor-not-allowed opacity-50"
         )}
      >
         <button
            type="button"
            className="flex w-full items-center justify-between p-4 pb-0 text-left"
            onClick={() => !("error" in theme && theme.error) && onSelect(theme)}
            disabled={"error" in theme && !!theme.error}
         >
            <div className="min-w-0 flex-1">
               <div className="mb-3 flex items-center gap-2">
                  <h4 className="truncate font-medium text-foreground text-sm">{theme.name}</h4>
                  {isSelected && <CheckCircle className="size-4 flex-shrink-0 text-primary" />}
               </div>

               {colors.length > 0 && (
                  <div className="-mx-4 flex h-3 overflow-hidden rounded-sm bg-background/50">
                     {colors.map((color, index) => (
                        <div
                           // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                           key={index}
                           className="flex-1"
                           style={{
                              backgroundColor: color,
                           }}
                        />
                     ))}
                  </div>
               )}

               {"error" in theme && theme.error && (
                  <div className="mt-2 font-medium text-destructive text-xs">Error: {theme.error}</div>
               )}
            </div>

            {isCustomTheme && onDelete && (
               <AlertDialog>
                  <AlertDialogTrigger asChild>
                     <Button
                        variant="link"
                        size="sm"
                        className="absolute top-2 right-2 h-6 w-6 rounded-md p-0 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive hover:text-destructive-foreground group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                     >
                        <Trash2 className="h-3 w-3" />
                     </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                     <AlertDialogHeader>
                        <AlertDialogTitle>Delete Custom Theme</AlertDialogTitle>
                        <AlertDialogDescription>
                           Are you sure you want to delete "{theme.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                     </AlertDialogHeader>
                     <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                           onClick={() => onDelete(theme.url)}
                           className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                           Delete
                        </AlertDialogAction>
                     </AlertDialogFooter>
                  </AlertDialogContent>
               </AlertDialog>
            )}
         </button>
      </Card>
   );
});

function AppearanceSettings() {
   const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
   const { chatWidthState, setChatWidth } = useChatWidthStore();

   const {
      session,
      themeState,
      searchQuery,
      setSearchQuery,
      selectedThemeUrl,
      isLoadingThemes,
      filteredThemes,
      customThemes,
      builtInThemes,
      handleThemeImported,
      handleThemeSelect,
      handleThemeDelete,
      toggleMode,
      randomizeTheme,
   } = useThemeManagement();
   const isPending = session?.isPending;

   if (isPending) {
      return (
         <SettingsLayout title="Appearance" description="Customize the look and feel of your interface.">
            <div className="flex items-center justify-center py-12">
               <Skeleton className="h-10 w-1/2" />
            </div>
         </SettingsLayout>
      );
   }

   if (!session?.user?.id) {
      return (
         <SettingsLayout title="Appearance" description="Customize the look and feel of your interface.">
            <div className="flex items-center justify-center py-12">
               <p className="text-muted-foreground">Sign in to manage your appearance settings.</p>
            </div>
         </SettingsLayout>
      );
   }

   return (
      <SettingsLayout title="Appearance" description="Customize the look and feel of your interface.">
         <ImportThemeDialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen} onThemeImported={handleThemeImported} />

         <div className="space-y-8">
            {/* Display Mode Section */}
            <div className="space-y-4">
               <div>
                  <h3 className="font-semibold text-foreground">Display Mode</h3>
                  <p className="mt-1 text-muted-foreground text-sm">Choose between light and dark mode</p>
               </div>

               <div className="grid max-w-xl grid-cols-2 gap-3">
                  <Card
                     className={cn(
                        "cursor-pointer border-0 bg-muted/20 p-4 transition-all duration-200 hover:bg-muted/40",
                        themeState.currentMode === "light" ? "bg-primary/5 ring-1 ring-primary/20" : "hover:ring-1 hover:ring-border"
                     )}
                     onClick={() => themeState.currentMode === "dark" && toggleMode()}
                  >
                     <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-full bg-background">
                           <SunIcon className="h-4 w-4 text-foreground" />
                        </div>
                        <div className="flex-1">
                           <div className="flex items-center gap-2">
                              <Label className="cursor-pointer font-medium text-foreground">Light</Label>
                              {themeState.currentMode === "light" && <CheckCircle className="ml-auto size-4 text-primary" />}
                           </div>
                        </div>
                     </div>
                  </Card>

                  <Card
                     className={cn(
                        "cursor-pointer border-0 bg-muted/20 p-4 transition-all duration-200 hover:bg-muted/40",
                        themeState.currentMode === "dark" ? "bg-primary/5 ring-1 ring-primary/20" : "hover:ring-1 hover:ring-border"
                     )}
                     onClick={() => themeState.currentMode === "light" && toggleMode()}
                  >
                     <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-full bg-background">
                           <MoonIcon className="h-4 w-4 text-foreground" />
                        </div>
                        <div className="flex-1">
                           <div className="flex items-center gap-2">
                              <Label className="cursor-pointer font-medium text-foreground">Dark</Label>
                              {themeState.currentMode === "dark" && <CheckCircle className="ml-auto size-4 text-primary" />}
                           </div>
                        </div>
                     </div>
                  </Card>
               </div>
            </div>

            {/* Chat Width Section */}
            <div className="space-y-4">
               <div>
                  <h3 className="font-semibold text-foreground">Chat Width</h3>
                  <p className="mt-1 text-muted-foreground text-sm">Choose the width of your chat messages</p>
               </div>

               <div className="grid max-w-xl grid-cols-2 gap-3">
                  <Card
                     className={cn(
                        "cursor-pointer border-0 bg-muted/20 p-4 transition-all duration-200 hover:bg-muted/40",
                        chatWidthState.chatWidth === "normal"
                           ? "bg-primary/5 ring-1 ring-primary/20"
                           : "hover:ring-1 hover:ring-border"
                     )}
                     onClick={() => setChatWidth("normal")}
                  >
                     <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-full bg-background">
                           <Square className="h-4 w-4 text-foreground" />
                        </div>
                        <div className="flex-1">
                           <div className="flex items-center gap-2">
                              <Label className="cursor-pointer font-medium text-foreground">Normal</Label>
                              {chatWidthState.chatWidth === "normal" && <CheckCircle className="ml-auto size-4 text-primary" />}
                           </div>
                           <div className="mt-2 flex flex-col gap-1">
                              <div className="h-2 w-full rounded-sm bg-muted" />
                              <div className="h-2 w-4/5 rounded-sm bg-muted" />
                              <div className="h-2 w-full rounded-sm bg-muted/60" />
                           </div>
                        </div>
                     </div>
                  </Card>

                  <Card
                     className={cn(
                        "cursor-pointer border-0 bg-muted/20 p-4 transition-all duration-200 hover:bg-muted/40",
                        chatWidthState.chatWidth === "wider" ? "bg-primary/5 ring-1 ring-primary/20" : "hover:ring-1 hover:ring-border"
                     )}
                     onClick={() => setChatWidth("wider")}
                  >
                     <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-full bg-background">
                           <RectangleHorizontal className="h-4 w-4 text-foreground" />
                        </div>
                        <div className="flex-1">
                           <div className="flex items-center gap-2">
                              <Label className="cursor-pointer font-medium text-foreground">Wider</Label>
                              {chatWidthState.chatWidth === "wider" && <CheckCircle className="ml-auto size-4 text-primary" />}
                           </div>
                           <div className="mt-2 flex flex-col gap-1">
                              <div className="h-2 w-full rounded-sm bg-muted" />
                              <div className="h-2 w-full rounded-sm bg-muted" />
                              <div className="h-2 w-5/6 rounded-sm bg-muted/60" />
                           </div>
                        </div>
                     </div>
                  </Card>
               </div>
            </div>

            {/* Themes Section */}
            <div className="space-y-4">
               <div>
                  <h3 className="font-semibold text-foreground">Themes</h3>
                  <p className="mt-1 text-muted-foreground text-sm">Select and manage your color themes</p>
               </div>

               {/* Theme Controls */}
               <div className="mb-8 flex items-center gap-3">
                  <div className="flex-1">
                     <div className="relative">
                        <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                        <Input
                           placeholder="Search themes..."
                           className="bg-muted/20 pl-10 focus:bg-background"
                           value={searchQuery}
                           onChange={(e) => setSearchQuery(e.target.value)}
                        />
                     </div>
                  </div>
                  <Button
                     variant="outline"
                     size="icon"
                     onClick={randomizeTheme}
                     disabled={isLoadingThemes || filteredThemes.length === 0}
                     title="Random theme"
                  >
                     <ShuffleIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
                     <PlusIcon className="h-4 w-4" />
                     Import Theme
                  </Button>
               </div>

               {/* Theme Content */}
               {isLoadingThemes ? (
                  <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                     <div className="size-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                     Loading themes...
                  </div>
               ) : (
                  <div className="space-y-8">
                     {customThemes.length > 0 && (
                        <div className="space-y-3">
                           <h4 className="font-medium text-muted-foreground text-sm">My Themes ({customThemes.length})</h4>
                           <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              {customThemes.map((theme) => (
                                 <ThemeCard
                                    key={theme.url}
                                    theme={theme}
                                    isSelected={selectedThemeUrl === theme.url}
                                    onSelect={handleThemeSelect}
                                    onDelete={handleThemeDelete}
                                    currentMode={themeState.currentMode}
                                 />
                              ))}
                           </div>
                        </div>
                     )}

                     <div className="space-y-3">
                        <h4 className="font-medium text-muted-foreground text-sm">Built-in Themes ({builtInThemes.length})</h4>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                           {builtInThemes.map((theme) => (
                              <ThemeCard
                                 key={theme.url}
                                 theme={theme}
                                 isSelected={selectedThemeUrl === theme.url}
                                 onSelect={handleThemeSelect}
                                 currentMode={themeState.currentMode}
                              />
                           ))}
                        </div>
                     </div>

                     {filteredThemes.length === 0 && searchQuery && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                           <Eye className="mb-3 h-8 w-8 text-muted-foreground" />
                           <h4 className="font-medium text-foreground">No themes found</h4>
                           <p className="mt-1 text-muted-foreground text-sm">Try adjusting your search query</p>
                        </div>
                     )}
                  </div>
               )}

               {/* Footer */}
               <div className="flex items-center justify-center gap-1 border-border/50 border-t pt-6 text-muted-foreground text-sm">
                  Get more themes at
                  <a
                     href="https://tweakcn.com"
                     target="_blank"
                     rel="noopener"
                     className="ml-1 inline-flex items-center font-medium text-primary hover:underline"
                  >
                     tweakcn.com
                     <ExternalLinkIcon className="ml-1 size-3" />
                  </a>
               </div>
            </div>
         </div>
      </SettingsLayout>
   );
}
