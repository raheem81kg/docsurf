/** biome-ignore-all lint/nursery/useUniqueElementIds: <explanation> */
import { Button } from "@docsurf/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@docsurf/ui/components/dialog";
import { Input } from "@docsurf/ui/components/input";
import { Label } from "@docsurf/ui/components/label";
import { api } from "@docsurf/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { DEFAULT_TEXT_TITLE, DEFAULT_FOLDER_TITLE } from "@/utils/constants";
import type { Id } from "@docsurf/backend/convex/_generated/dataModel";
import { RadioGroup, RadioGroupItem } from "@docsurf/ui/components/radio-group";
import { useSession } from "@/hooks/auth-hooks";
import { Analytics } from "@/components/providers/posthog";

export function NewDocumentButton({ onClick }: { onClick?: () => void }) {
   const [showDialog, setShowDialog] = useState(false);
   const [docName, setDocName] = useState("");
   const [docType, setDocType] = useState<"text/plain" | "folder">("text/plain");
   const [isCreating, startTransition] = useTransition();
   const createDocument = useMutation(api.documents.createDocument);
   const { data: session } = useSession();
   const user = useQuery(api.auth.getCurrentUser, session?.user?.id ? {} : "skip");
   const workspaceId = user?.workspaces?.[0]?.workspace?._id as Id<"workspaces"> | undefined;
   const navigate = useNavigate();
   const topLevelDocs = useQuery(api.documents.fetchDocumentTree, workspaceId && session?.user ? { workspaceId } : "skip");

   const handleCreate = () => {
      const trimmedName = docName.trim();
      let finalName = trimmedName;
      if (!trimmedName) {
         finalName = docType === "text/plain" ? DEFAULT_TEXT_TITLE : DEFAULT_FOLDER_TITLE;
      }
      if (!workspaceId) {
         toast.error("No workspace found");
         return;
      }
      // Find min orderPosition among top-level docs
      let minOrder = 0;
      if (topLevelDocs && Array.isArray(topLevelDocs.data) && topLevelDocs.data.length > 0) {
         minOrder = Math.min(...topLevelDocs.data.map((d) => (typeof d.orderPosition === "number" ? d.orderPosition : 0)));
         minOrder = minOrder - 1;
      }
      startTransition(async () => {
         try {
            const doc = await createDocument({
               workspaceId,
               title: finalName,
               documentType: docType,
               parentId: undefined, // Top-level
               orderPosition: minOrder,
            });
            if (docType === "text/plain") {
               navigate({ to: "/doc/$documentId", params: { documentId: doc.id } });
               // Close sidebar when navigating to the new document
               onClick?.();
            }
            Analytics.track("create_document", { documentType: docType, userEmail: session?.user?.email });
            toast.success(`${docType === "text/plain" ? "Document" : "Folder"} created successfully`);
            setDocName("");
            setDocType("text/plain");
            setShowDialog(false);
         } catch (err) {
            toast.error(`Couldn't create ${docType === "text/plain" ? "document" : "folder"}. Please try again.`);
         }
      });
   };

   return (
      <>
         <Button
            size="sm"
            variant={"ghost"}
            onClick={() => {
               setShowDialog(true);
            }}
            className="size-6 text-muted-foreground"
         >
            <Plus className="size-4" />
            <span className="sr-only">New document or folder</span>
         </Button>

         <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogContent className="max-w-md">
               <DialogHeader>
                  <DialogTitle>Create New {docType === "text/plain" ? "Document" : "Folder"}</DialogTitle>
                  <DialogDescription>
                     {docType === "text/plain" ? "Create a new text document." : "Create a new folder to organize your documents."}
                  </DialogDescription>
               </DialogHeader>
               <div className="space-y-6">
                  <div className="space-y-2">
                     <Label htmlFor="doc-name">Name</Label>
                     <Input
                        id="doc-name"
                        value={docName}
                        onChange={(e) => setDocName(e.target.value)}
                        placeholder={`Enter ${docType === "text/plain" ? "document" : "folder"} name`}
                        onKeyDown={(e) => {
                           if (e.key === "Enter" && !isCreating) {
                              handleCreate();
                           }
                        }}
                        disabled={isCreating}
                        autoFocus
                     />
                  </div>
                  <div className="space-y-2">
                     <Label>Type</Label>
                     <RadioGroup
                        value={docType}
                        onValueChange={(value) => setDocType(value as "text/plain" | "folder")}
                        className="flex gap-4"
                        name="doc-type"
                        disabled={isCreating}
                     >
                        <div className="flex items-center gap-2">
                           <RadioGroupItem value="text/plain" id="doc-type-text" disabled={isCreating} />
                           <Label htmlFor="doc-type-text" className="cursor-pointer">
                              Text Document
                           </Label>
                        </div>
                        <div className="flex items-center gap-2">
                           <RadioGroupItem value="folder" id="doc-type-folder" disabled={isCreating} />
                           <Label htmlFor="doc-type-folder" className="cursor-pointer">
                              Folder
                           </Label>
                        </div>
                     </RadioGroup>
                  </div>
               </div>
               <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDialog(false)} disabled={isCreating}>
                     Cancel
                  </Button>
                  <Button onClick={handleCreate} disabled={isCreating}>
                     {isCreating ? "Creating..." : "Create"}
                  </Button>
               </DialogFooter>
            </DialogContent>
         </Dialog>
      </>
   );
}
