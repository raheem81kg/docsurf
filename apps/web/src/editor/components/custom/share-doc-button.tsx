import { Button } from "@docsurf/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@docsurf/ui/components/dialog";
import { Input } from "@docsurf/ui/components/input";
import { Label } from "@docsurf/ui/components/label";
import { api } from "@docsurf/backend/convex/_generated/api";
import type { Id } from "@docsurf/backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { Check, Copy, SendIcon, ExternalLink } from "lucide-react";
import React from "react";
import { copyToClipboard } from "@/components/sandbox/right-inner/chat/lib/utils";
import { ActionButton } from "../minimal-tiptap/extensions/image/components/image-actions";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { useCurrentDocument } from "@/components/sandbox/left/_tree_components/SortableTree";
import { useSession } from "@/hooks/auth-hooks";
import { Analytics } from "@/components/providers/posthog";

interface ShareDocButtonProps {
   open?: boolean;
   onOpenChange?: (open: boolean) => void;
   trigger?: React.ReactNode;
}

export function ShareDocButton({ open, onOpenChange, trigger }: ShareDocButtonProps) {
   const [internalOpen, setInternalOpen] = React.useState(false);
   const [isSharing, setIsSharing] = React.useState(false);
   const [copied, setCopied] = React.useState(false);
   const [isUnsharing, setIsUnsharing] = React.useState(false);

   // Use external control if provided, otherwise use internal state
   const isOpen = open !== undefined ? open : internalOpen;
   const setIsOpen = onOpenChange || setInternalOpen;

   const toggleDocumentPublic = useMutation(api.documents.toggleDocumentPublic);
   const { data: session, isPending: sessionLoading } = useSession();
   const { data: user } = useQuery({
      ...convexQuery(api.auth.getCurrentUser, {}),
      enabled: !!session?.user,
   });
   const workspaceId = user?.workspaces?.[0]?.workspace?._id;

   const currentDocument = useCurrentDocument(user);
   const isPublic = !!currentDocument?.doc?.isPublic;
   const shareUrl = isPublic && currentDocument?.doc?._id ? `${window.location.origin}/p/${currentDocument?.doc?._id}` : null;

   const handleShare = async () => {
      if (isPublic) return; // Already shared

      setIsSharing(true);
      try {
         if (!currentDocument?.doc?._id || !workspaceId) return;
         const result = await toggleDocumentPublic({
            id: currentDocument?.doc?._id as Id<"documents">,
            workspaceId: workspaceId,
         });

         if ("error" in result) {
            console.error("Failed to share thread:", result.error);
            return;
         }
         if (!import.meta.env.DEV) {
            Analytics.track("document_shared", {
               documentId: currentDocument?.doc?._id,
               userEmail: session?.user?.email,
            });
         }
      } catch (error) {
         console.error("Error sharing thread:", error);
      } finally {
         setIsSharing(false);
      }
   };

   const handleCopy = async () => {
      if (!shareUrl) return;

      await copyToClipboard(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
   };

   const handleUnPublish = async () => {
      setIsUnsharing(true);
      try {
         if (!currentDocument?.doc?._id || !workspaceId) return;
         const result = await toggleDocumentPublic({
            id: currentDocument?.doc?._id as Id<"documents">,
            workspaceId: workspaceId,
         });
         if ("error" in result) {
            console.error("Failed to unshare thread:", result.error);
            return;
         }
      } catch (error) {
         console.error("Error unsharing thread:", error);
      } finally {
         setIsUnsharing(false);
      }
   };

   const handleOpenChange = (open: boolean) => {
      setIsOpen(open);
      if (!open) {
         // Reset state when dialog closes
         setTimeout(() => {
            setCopied(false);
         }, 300);
      }
   };

   return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
         {!onOpenChange && (
            <DialogTrigger asChild>
               {trigger || <ActionButton icon={<SendIcon className="h-4 w-4" />} tooltip="Publish Document" />}
            </DialogTrigger>
         )}
         <DialogContent className="sm:max-w-md p-6 bg-background rounded-xl shadow-xl border border-border">
            <DialogHeader>
               <DialogTitle className="font-semibold text-foreground">Publish Document</DialogTitle>
               <DialogDescription className="text-muted-foreground mb-4">
                  Create a shareable link to this document. Others can view and fork it.{" "}
                  <span className="font-bold">Updates in real-time to saves.</span>
               </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
               {!isPublic ? (
                  <Button onClick={handleShare} disabled={isSharing} className="w-full">
                     {isSharing ? "Creating link..." : "Create shareable link"}
                  </Button>
               ) : (
                  <div className="space-y-3">
                     <Label htmlFor="share-url" className="text-sm font-medium text-foreground">
                        Shareable link
                     </Label>
                     <div className="flex items-center space-x-2">
                        <Input
                           id={`share-url-${currentDocument?.doc?._id}`}
                           value={shareUrl ?? ""}
                           readOnly
                           className="flex-1 bg-muted text-foreground border border-border rounded-md px-3 py-2 text-base font-mono"
                        />
                        <Button
                           variant="outline"
                           size="icon"
                           onClick={handleCopy}
                           className="border border-border bg-background hover:bg-muted"
                        >
                           {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4 text-foreground" />}
                        </Button>
                        <a href={shareUrl ?? "#"} target="_blank" rel="noopener noreferrer" tabIndex={-1}>
                           <Button
                              variant="outline"
                              size="icon"
                              className="border border-border bg-background hover:bg-muted ml-1"
                              aria-label="Visit published document"
                              type="button"
                           >
                              <ExternalLink className="h-4 w-4 text-foreground" />
                           </Button>
                        </a>
                     </div>
                     <p className="text-muted-foreground text-sm">Anyone with this link can view and fork this document.</p>
                     <Button
                        variant="destructive"
                        onClick={handleUnPublish}
                        disabled={isUnsharing}
                        className="w-full mt-2 text-base font-medium"
                     >
                        {isUnsharing ? "Unpublishing..." : "Unpublish"}
                     </Button>
                  </div>
               )}
            </div>
         </DialogContent>
      </Dialog>
   );
}
