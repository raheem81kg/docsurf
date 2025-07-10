import { SettingsLayout } from "@/components/sandbox/right-inner/chat/settings/settings-layout";
import { Alert, AlertDescription } from "@docsurf/ui/components/alert";
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
import { Badge } from "@docsurf/ui/components/badge";
import { Button } from "@docsurf/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@docsurf/ui/components/card";
import { Skeleton } from "@docsurf/ui/components/skeleton";
import { api } from "@docsurf/backend/convex/_generated/api";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { Archive, Download, File, FileText, Image, Music, Trash2, Video } from "lucide-react";
import { memo, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { env } from "@/env";
import { useSession } from "@/hooks/auth-hooks";

export const Route = createFileRoute("/settings/attachments")({
   ssr: false,
   component: AttachmentsPage,
});

interface FileMetadata {
   key: string;
   contentType?: string;
   authorId?: string;
   size?: number;
   lastModified: string;
   url: string;
}

const formatFileSize = (bytes: number | undefined): string => {
   if (!bytes) return "Unknown size";
   const sizes = ["B", "KB", "MB", "GB"];
   const i = Math.floor(Math.log(bytes) / Math.log(1024));
   return `${(bytes / 1024 ** i).toFixed(1)} ${sizes[i]}`;
};

const getFileIcon = (type: string | undefined) => {
   if (!type) return File;

   if (type.startsWith("image/")) return Image;
   if (type.startsWith("video/")) return Video;
   if (type.startsWith("audio/")) return Music;
   if (type.includes("text") || type.includes("document")) return FileText;
   if (type.includes("zip") || type.includes("archive")) return Archive;

   return File;
};

const getFileTypeBadgeColor = (type: string | undefined) => {
   if (!type) return "default";

   if (type.startsWith("image/")) return "default";
   if (type.startsWith("video/")) return "destructive";
   if (type.startsWith("audio/")) return "secondary";
   if (type.includes("text") || type.includes("document")) return "outline";

   return "default";
};

const FileCard = memo(({ file, onDelete }: { file: FileMetadata; onDelete: (key: string) => void }) => {
   const Icon = getFileIcon(file.contentType);

   const fileName = useMemo(() => {
      // Extract filename from key (format: attachments/userId/timestamp-uuid-filename)
      const parts = file.key.split("/");
      if (parts[0] === "generations") {
         return "Generated image";
      }
      if (parts.length >= 3) {
         const filenamePart = parts[parts.length - 1];
         // Remove timestamp and UUID prefix
         const match = filenamePart.match(/^\d+-[a-f0-9-]+-(.+)$/);
         return match ? match[1] : filenamePart;
      }
      return "Unknown file";
   }, [file.key]);

   const fileUrl = useMemo(() => {
      return `${env.VITE_CONVEX_SITE_URL}/r2?key=${encodeURIComponent(file.key)}`;
   }, [file.key]);

   const handleDownload = useCallback(() => {
      window.open(fileUrl, "_blank");
   }, [fileUrl]);

   const handleDelete = useCallback(() => {
      onDelete(file.key);
   }, [file.key, onDelete]);

   return (
      <Card className="group gap-3 p-4 transition-all hover:shadow-md">
         <CardContent className="p-0">
            <div className="flex items-start justify-between gap-3">
               <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div className="flex-shrink-0 rounded-lg bg-muted p-2">
                     <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                     <h3 className="truncate font-medium text-sm" title={fileName}>
                        {fileName}
                     </h3>
                     <div className="mt-1 flex items-center gap-2">
                        <Badge variant={getFileTypeBadgeColor(file.contentType)} className="text-xs">
                           {file.contentType || "Unknown"}
                        </Badge>
                        <span className="text-muted-foreground text-xs">{formatFileSize(file.size)}</span>
                     </div>
                     {file.lastModified && (
                        <p className="mt-1 text-muted-foreground text-xs">{new Date(file.lastModified).toLocaleDateString()}</p>
                     )}
                  </div>
               </div>
               <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button variant="ghost" size="sm" onClick={handleDownload} className="h-8 w-8 p-0">
                     <Download className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                     <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                           <Trash2 className="h-4 w-4" />
                        </Button>
                     </AlertDialogTrigger>
                     <AlertDialogContent>
                        <AlertDialogHeader>
                           <AlertDialogTitle>Delete File</AlertDialogTitle>
                           <AlertDialogDescription>
                              Are you sure you want to delete "{fileName}"? This action cannot be undone.
                           </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                           <AlertDialogCancel>Cancel</AlertDialogCancel>
                           <AlertDialogAction
                              onClick={handleDelete}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                           >
                              Delete
                           </AlertDialogAction>
                        </AlertDialogFooter>
                     </AlertDialogContent>
                  </AlertDialog>
               </div>
            </div>
         </CardContent>
      </Card>
   );
});

FileCard.displayName = "FileCard";

function AttachmentsPage() {
   const { data: session, isPending: isSessionPending } = useSession();
   const filesResult = useQuery(api.attachments.listFiles, session?.user?.id ? {} : "skip");
   const deleteFile = useMutation(api.attachments.deleteFile);

   const handleDelete = useCallback(
      async (key: string) => {
         try {
            const result = await deleteFile({ key });
            if (result.success) {
               toast.success("File deleted successfully");
            } else {
               toast.error(`Failed to delete file: ${result.error}`);
            }
         } catch (error) {
            toast.error("Failed to delete file");
            console.error("Delete error:", error);
         }
      },
      [deleteFile]
   );

   // Handle the file list data structure - it might be an array or a paginated result
   const files = useMemo(() => {
      if (!filesResult) return null;

      // If it's an array, return it directly
      if (Array.isArray(filesResult)) {
         return filesResult;
      }

      // If it has a page property with an array, extract that
      if (filesResult && typeof filesResult === "object" && "page" in filesResult && Array.isArray(filesResult.page)) {
         return filesResult.page;
      }

      // Otherwise return empty array
      return [];
   }, [filesResult]);

   const { totalSize, fileStats } = useMemo(() => {
      if (!files || files.length === 0) {
         return { totalSize: 0, fileStats: { images: 0, videos: 0, documents: 0, other: 0 } };
      }

      const total = files.reduce((sum, file) => sum + (file.size || 0), 0);
      const stats = files.reduce(
         (acc, file) => {
            const type = file.contentType || "";
            if (type.startsWith("image/")) acc.images++;
            else if (type.startsWith("video/")) acc.videos++;
            else if (type.includes("text") || type.includes("document")) acc.documents++;
            else acc.other++;
            return acc;
         },
         { images: 0, videos: 0, documents: 0, other: 0 }
      );

      return { totalSize: total, fileStats: stats };
   }, [files]);

   if (isSessionPending) {
      return (
         <SettingsLayout title="Attachments" description="Manage your uploaded files and attachments.">
            <div className="space-y-4">
               {/* Skeleton for Files List */}
               <Card className="gap-3 p-4">
                  <CardHeader className="gap-0 px-0">
                     <CardTitle>Your Files</CardTitle>
                     <CardDescription>All your uploaded attachments and files</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 pt-0">
                     <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                           <div key={i} className="flex items-center gap-3 rounded-lg border p-4">
                              <Skeleton className="h-10 w-10 rounded-lg" />
                              <div className="flex-1 space-y-2">
                                 <Skeleton className="h-4 w-32" />
                                 <Skeleton className="h-3 w-24" />
                              </div>
                              <div className="flex gap-1">
                                 <Skeleton className="h-8 w-8" />
                                 <Skeleton className="h-8 w-8" />
                              </div>
                           </div>
                        ))}
                     </div>
                  </CardContent>
               </Card>

               {/* Skeleton for Storage Info */}
               <Card className="gap-3 p-4">
                  <CardHeader className="gap-2 px-0">
                     <CardTitle>Storage Information</CardTitle>
                     <CardDescription>Information about your file storage usage</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 pt-0">
                     <div className="space-y-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                           <div key={i} className="flex items-center justify-between text-sm">
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-4 w-16" />
                           </div>
                        ))}
                     </div>
                  </CardContent>
               </Card>
            </div>
         </SettingsLayout>
      );
   }

   if (!session?.user?.id) {
      return (
         <SettingsLayout title="Attachments" description="Manage your uploaded files and attachments.">
            <Alert>
               <AlertDescription>Sign in to view and manage your attachments.</AlertDescription>
            </Alert>
         </SettingsLayout>
      );
   }

   return (
      <SettingsLayout title="Attachments" description="Manage your uploaded files and attachments.">
         <div className="space-y-4">
            {/* Files List */}
            <Card className="gap-3 p-4">
               <CardHeader className="gap-0 px-0">
                  <CardTitle>Your Files</CardTitle>
                  <CardDescription>All your uploaded attachments and files</CardDescription>
               </CardHeader>
               <CardContent className="p-0 pt-0">
                  {!files ? (
                     <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                           <div
                              // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                              key={i}
                              className="flex items-center gap-3 rounded-lg border p-4"
                           >
                              <Skeleton className="h-10 w-10 rounded-lg" />
                              <div className="flex-1 space-y-2">
                                 <Skeleton className="h-4 w-32" />
                                 <Skeleton className="h-3 w-24" />
                              </div>
                              <div className="flex gap-1">
                                 <Skeleton className="h-8 w-8" />
                                 <Skeleton className="h-8 w-8" />
                              </div>
                           </div>
                        ))}
                     </div>
                  ) : files.length === 0 ? (
                     <div className="py-12 text-center">
                        <File className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                        <h3 className="mb-2 font-medium text-lg">No files yet</h3>
                        <p className="mx-auto max-w-sm text-muted-foreground text-sm">
                           Upload files through the chat interface to see them here.
                        </p>
                     </div>
                  ) : (
                     <div className="space-y-2">
                        {files.map((file) => (
                           <FileCard key={file.key} file={file} onDelete={handleDelete} />
                        ))}
                     </div>
                  )}
               </CardContent>
            </Card>

            {/* Storage Info */}
            <Card className="gap-3 p-4">
               <CardHeader className="gap-2 px-0">
                  <CardTitle>Storage Information</CardTitle>
                  <CardDescription>Information about your file storage usage</CardDescription>
               </CardHeader>
               <CardContent className="p-0 pt-0">
                  <div className="space-y-2">
                     <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">File size limit</span>
                        <span className="font-medium">5 MB per file</span>
                     </div>
                     <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Current usage</span>
                        <span className="font-medium">{formatFileSize(totalSize)}</span>
                     </div>
                     <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total files</span>
                        <span className="font-medium">{files?.length || 0}</span>
                     </div>
                     <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Images</span>
                        <span className="font-medium">{fileStats.images}</span>
                     </div>
                     <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Documents</span>
                        <span className="font-medium">{fileStats.documents}</span>
                     </div>
                  </div>
               </CardContent>
            </Card>
         </div>
      </SettingsLayout>
   );
}
