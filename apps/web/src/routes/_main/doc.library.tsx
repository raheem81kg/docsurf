import { Alert, AlertDescription } from "@docsurf/ui/components/alert";
import { Button } from "@docsurf/ui/components/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@docsurf/ui/components/select";
import { Skeleton } from "@docsurf/ui/components/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@docsurf/ui/components/dialog";
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
import { api } from "@docsurf/backend/convex/_generated/api";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { Download, Image as ImageIcon, ImageOff, FileText, Eye, Trash2 } from "lucide-react";
import { memo, useCallback, useMemo, useState } from "react";
import { showToast } from "@docsurf/ui/components/_c/toast/showToast";
import { env } from "@/env";
import { useSession } from "@/hooks/auth-hooks";
import { getFileTypeInfo } from "@docsurf/utils/constants/file_constants";

export const Route = createFileRoute("/_main/doc/library")({
   ssr: false,
   component: LibraryPage,
});

interface GeneratedAsset {
   key: string;
   contentType?: string;
   size?: number;
   lastModified: string;
   url: string;
   fileName?: string;
}

type FileType = "generated" | "attachments";

const formatFileSize = (bytes: number | undefined): string => {
   if (!bytes) return "Unknown size";
   const sizes = ["B", "KB", "MB", "GB"];
   const i = Math.floor(Math.log(bytes) / Math.log(1024));
   return `${(bytes / 1024 ** i).toFixed(1)} ${sizes[i]}`;
};

const GeneratedImage = memo(({ asset, onDelete }: { asset: GeneratedAsset; onDelete?: (key: string) => void }) => {
   const [isError, setIsError] = useState(false);
   const [isLoaded, setIsLoaded] = useState(false);

   const imageUrl = useMemo(() => {
      // This ensures that special characters in filenames (like &, %, #, spaces, etc.)
      // are properly URL encoded and won't be interpreted as URL parameter separators or
      // cause other parsing issues.
      return `${env.VITE_CONVEX_SITE_URL}/r2?key=${encodeURIComponent(asset.key)}`;
   }, [asset.key]);

   const handleDownload = useCallback(() => {
      window.open(imageUrl, "_blank");
   }, [imageUrl]);

   const handleDelete = useCallback(() => {
      if (onDelete) {
         onDelete(asset.key);
      }
   }, [asset.key, onDelete]);

   const fileName = asset.fileName || asset.key.split("/").pop() || "Generated image";

   const handleImageLoad = useCallback(() => {
      setIsLoaded(true);
   }, []);

   const handleImageError = useCallback(() => {
      setIsError(true);
      setIsLoaded(true);
   }, []);

   if (isError) {
      return (
         <div className="group relative aspect-square overflow-hidden rounded-xl border bg-muted/50">
            <div className="flex h-full items-center justify-center">
               <div className="text-center">
                  <ImageOff className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-muted-foreground text-sm">Failed to load</p>
               </div>
            </div>
            <div className="absolute inset-x-0 top-0 flex translate-y-2 justify-end gap-1 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
               <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  className="m-2 h-8 w-8 rounded-full bg-background/80 p-0 backdrop-blur-sm hover:bg-background"
               >
                  <Download className="h-4 w-4" />
               </Button>
               {onDelete && (
                  <AlertDialog>
                     <AlertDialogTrigger asChild>
                        <Button
                           variant="ghost"
                           size="sm"
                           className="m-2 h-8 w-8 rounded-full bg-background/80 p-0 backdrop-blur-sm hover:bg-background text-destructive hover:text-destructive"
                        >
                           <Trash2 className="h-4 w-4" />
                        </Button>
                     </AlertDialogTrigger>
                     <AlertDialogContent>
                        <AlertDialogHeader>
                           <AlertDialogTitle>Delete Image</AlertDialogTitle>
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
               )}
            </div>
         </div>
      );
   }

   return (
      <div className="group relative overflow-hidden rounded-xl border bg-background">
         {!isLoaded && <div className="absolute inset-0 animate-pulse bg-muted" />}
         <img
            src={imageUrl}
            alt="AI generation"
            className="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy"
         />
         <div className="absolute inset-x-0 top-0 flex translate-y-2 justify-end gap-1 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
            <Button
               variant="ghost"
               size="sm"
               onClick={handleDownload}
               className="m-2 h-8 w-8 rounded-full bg-background/80 p-0 backdrop-blur-sm hover:bg-background"
            >
               <Download className="h-4 w-4" />
            </Button>
            {onDelete && (
               <AlertDialog>
                  <AlertDialogTrigger asChild>
                     <Button
                        variant="ghost"
                        size="sm"
                        className="m-2 h-8 w-8 rounded-full bg-background/80 p-0 backdrop-blur-sm hover:bg-background text-destructive hover:text-destructive"
                     >
                        <Trash2 className="h-4 w-4" />
                     </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                     <AlertDialogHeader>
                        <AlertDialogTitle>Delete Image</AlertDialogTitle>
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
            )}
         </div>
         <div className="absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-black/50 to-transparent p-2 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
            <div className="text-white text-xs">
               <p>{formatFileSize(asset.size)}</p>
               <p>{new Date(asset.lastModified).toLocaleDateString()}</p>
            </div>
         </div>
      </div>
   );
});

GeneratedImage.displayName = "GeneratedImage";

const AttachmentAsset = memo(({ asset, onDelete }: { asset: GeneratedAsset; onDelete?: (key: string) => void }) => {
   const [previewOpen, setPreviewOpen] = useState(false);
   const [fileContent, setFileContent] = useState<string | null>(null);
   const [isLoading, setIsLoading] = useState(false);

   const fileUrl = useMemo(() => {
      return `${env.VITE_CONVEX_SITE_URL}/r2?key=${encodeURIComponent(asset.key)}`;
   }, [asset.key]);

   const fileName = asset.fileName || asset.key.split("/").pop() || "Unknown file";
   const fileTypeInfo = useMemo(() => getFileTypeInfo(fileName, asset.contentType), [fileName, asset.contentType]);

   const handleDownload = useCallback(() => {
      window.open(fileUrl, "_blank");
   }, [fileUrl]);

   const handleDelete = useCallback(() => {
      if (onDelete) {
         onDelete(asset.key);
      }
   }, [asset.key, onDelete]);

   const handlePreview = useCallback(async () => {
      setPreviewOpen(true);

      // Load text content for text files
      if (fileTypeInfo.isText && !fileTypeInfo.isImage && !fileContent) {
         setIsLoading(true);
         try {
            const response = await fetch(fileUrl);
            if (response.ok) {
               const text = await response.text();
               setFileContent(text);
            }
         } catch (error) {
            console.error("Failed to load file content:", error);
         } finally {
            setIsLoading(false);
         }
      }
   }, [fileUrl, fileTypeInfo.isText, fileTypeInfo.isImage, fileContent]);

   const getFileIcon = () => {
      if (fileTypeInfo.isImage) return <ImageIcon className="h-6 w-6 text-blue-500" />;
      if (fileTypeInfo.isCode) return <FileText className="h-6 w-6 text-green-500" />;
      if (fileTypeInfo.isPdf) return <FileText className="h-6 w-6 text-red-600 dark:text-red-400" />;
      return <FileText className="h-6 w-6 text-gray-500" />;
   };

   const getIconBgColor = () => {
      if (fileTypeInfo.isImage) return "bg-blue-100 dark:bg-blue-900/20";
      if (fileTypeInfo.isCode) return "bg-green-100 dark:bg-green-900/20";
      if (fileTypeInfo.isPdf) return "bg-red-100 dark:bg-red-900/20";
      return "bg-gray-100 dark:bg-gray-900/20";
   };

   const renderDialogContent = () => {
      if (fileTypeInfo.isImage) {
         return (
            <div className="h-full w-full flex items-center justify-center p-4 overflow-auto">
               <img
                  src={fileUrl}
                  alt={fileName}
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => {
                     const target = e.target as HTMLImageElement;
                     target.style.display = "none";
                     const errorDiv = target.nextElementSibling as HTMLElement;
                     if (errorDiv) errorDiv.style.display = "flex";
                  }}
               />
            </div>
         );
      }

      if (fileTypeInfo.isText && !fileTypeInfo.isImage) {
         if (isLoading) {
            return (
               <div className="h-full w-full flex items-center justify-center">
                  <div className="text-center">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                     <p className="text-muted-foreground">Loading...</p>
                  </div>
               </div>
            );
         }

         return (
            <div className="h-full w-full overflow-auto p-4">
               <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded bg-muted p-4 text-sm">
                  {fileContent || "Failed to load content"}
               </pre>
            </div>
         );
      }

      if (fileTypeInfo.isPdf) {
         return <iframe src={fileUrl} className="h-full w-full border-0" title={fileName} />;
      }

      return (
         <div className="h-full w-full flex items-center justify-center p-8 text-muted-foreground">
            <div className="text-center">
               <FileText className="mx-auto mb-2 size-12" />
               <p>Binary file: {fileName}</p>
               <p className="mt-1 text-xs">Preview not available</p>
            </div>
         </div>
      );
   };

   return (
      <>
         <div className="group relative overflow-hidden rounded-xl border bg-background p-4 transition-all hover:shadow-md">
            <div className="flex items-center gap-3">
               <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg ${getIconBgColor()}`}>
                  {getFileIcon()}
               </div>
               <div className="min-w-0 flex-1">
                  <h3 className="truncate font-medium text-sm" title={fileName}>
                     {fileName}
                  </h3>
                  <div className="flex items-center gap-2 text-muted-foreground text-xs">
                     <span>{formatFileSize(asset.size)}</span>
                     <span>•</span>
                     <span>{new Date(asset.lastModified).toLocaleDateString()}</span>
                  </div>
               </div>
            </div>

            <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
               <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePreview}
                  className="h-8 w-8 rounded-full bg-background/80 p-0 backdrop-blur-sm hover:bg-background"
               >
                  <Eye className="h-4 w-4" />
               </Button>
               <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  className="h-8 w-8 rounded-full bg-background/80 p-0 backdrop-blur-sm hover:bg-background"
               >
                  <Download className="h-4 w-4" />
               </Button>
               {onDelete && (
                  <AlertDialog>
                     <AlertDialogTrigger asChild>
                        <Button
                           variant="ghost"
                           size="sm"
                           className="h-8 w-8 rounded-full bg-background/80 p-0 backdrop-blur-sm hover:bg-background text-destructive hover:text-destructive"
                        >
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
               )}
            </div>
         </div>

         <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
            <DialogContent className="md:!max-w-[min(90vw,60rem)] h-[80dvh] max-h-[80dvh] flex flex-col p-0">
               <DialogHeader className="flex-shrink-0 px-6 py-4 border-b">
                  <DialogTitle className="flex items-center gap-2">
                     {getFileIcon()}
                     {fileName}
                  </DialogTitle>
               </DialogHeader>
               <div className="flex-1 overflow-hidden">{renderDialogContent()}</div>
            </DialogContent>
         </Dialog>
      </>
   );
});

AttachmentAsset.displayName = "AttachmentAsset";

const MasonryGrid = memo(
   ({ assets, fileType, onDelete }: { assets: GeneratedAsset[]; fileType: FileType; onDelete?: (key: string) => void }) => {
      if (assets.length === 0) {
         const isGenerated = fileType === "generated";
         return (
            <div className="py-24 text-center">
               {isGenerated ? (
                  <ImageIcon className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
               ) : (
                  <FileText className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
               )}
               <h3 className="mb-2 font-medium text-xl">{isGenerated ? "No generated images yet" : "No attachments yet"}</h3>
               <p className="mx-auto max-w-sm text-muted-foreground">
                  {isGenerated
                     ? "Generate images through the chat interface to see them appear here."
                     : "Upload files through the chat interface to see them appear here."}
               </p>
            </div>
         );
      }

      if (fileType === "attachments") {
         // For attachments, check if all assets are images to use masonry layout
         const allImages = assets.every((asset) => {
            const fileName = asset.fileName || asset.key.split("/").pop() || "";
            const fileInfo = getFileTypeInfo(fileName, asset.contentType);
            return fileInfo.isImage;
         });

         if (allImages) {
            return (
               <div className="columns-1 gap-4 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5">
                  {assets.map((asset) => (
                     <div key={asset.key} className="mb-4 break-inside-avoid">
                        <GeneratedImage asset={asset} onDelete={onDelete} />
                     </div>
                  ))}
               </div>
            );
         } else {
            return (
               <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {assets.map((asset) => (
                     <AttachmentAsset key={asset.key} asset={asset} onDelete={onDelete} />
                  ))}
               </div>
            );
         }
      }

      return (
         <div className="columns-1 gap-4 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5">
            {assets.map((asset) => (
               <div key={asset.key} className="mb-4 break-inside-avoid">
                  <GeneratedImage asset={asset} onDelete={onDelete} />
               </div>
            ))}
         </div>
      );
   }
);

MasonryGrid.displayName = "MasonryGrid";

function LibraryPage() {
   const navigate = useNavigate();
   const session = useSession();
   const filesResult = useQuery(api.attachments.listFiles, session.user?.id ? {} : "skip");
   const deleteFile = useMutation(api.attachments.deleteFile);
   const [sortBy, setSortBy] = useState<"newest" | "oldest" | "size">("newest");
   const [fileType, setFileType] = useState<FileType>("generated");

   const handleGetStarted = () => {
      navigate({ to: "/auth", replace: true });
   };

   const handleDelete = useCallback(
      async (key: string) => {
         try {
            const result = await deleteFile({ key });
            if (result.success) {
               showToast("File deleted successfully", "success");
            } else {
               showToast(`Failed to delete file: ${result.error}`, "error");
            }
         } catch (error) {
            showToast("Failed to delete file", "error");
            console.error("Delete error:", error);
         }
      },
      [deleteFile]
   );

   // Filter for generated images or PDFs
   const filteredAssets = useMemo(() => {
      if (!filesResult) return null;

      // Handle the file list data structure
      let files: any[] = [];
      if (Array.isArray(filesResult)) {
         files = filesResult;
      } else if (filesResult && typeof filesResult === "object" && "page" in filesResult && Array.isArray(filesResult.page)) {
         files = filesResult.page;
      }

      // Filter based on file type
      const filteredFiles = files.filter((file) => {
         if (fileType === "generated") {
            // Generated images (keys starting with "generations")
            return file.key.startsWith("generations/");
         } else {
            // All attachments (keys starting with "attachments")
            return file.key.startsWith("attachments/");
         }
      });

      // Apply sorting
      filteredFiles.sort((a, b) => {
         switch (sortBy) {
            case "newest":
               return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
            case "oldest":
               return new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime();
            case "size":
               return (b.size || 0) - (a.size || 0);
            default:
               return 0;
         }
      });

      // Add fileName for easier access
      return filteredFiles.map((file) => ({
         ...file,
         fileName: file.key.split("/").pop() || "Unknown file",
      }));
   }, [filesResult, sortBy, fileType]);

   const stats = useMemo(() => {
      if (!filteredAssets || filteredAssets.length === 0) {
         return { totalSize: 0, count: 0 };
      }

      const totalSize = filteredAssets.reduce((sum, asset) => sum + (asset.size || 0), 0);
      return { totalSize, count: filteredAssets.length };
   }, [filteredAssets]);

   if (!session.user?.id) {
      return (
         <div className="container mx-auto max-w-6xl px-4 pt-12 pb-8">
            <div className="mb-8">
               <h1 className="mb-2 font-bold text-3xl">Library</h1>
               <p className="text-muted-foreground">Your collection of AI-generated images and file attachments</p>
            </div>
            <Alert>
               <AlertDescription className="flex items-center justify-between">
                  <span>Sign in to view your library.</span>
                  <Button onClick={handleGetStarted} size="sm" className="ml-4 font-medium">
                     Get Started
                  </Button>
               </AlertDescription>
            </Alert>
         </div>
      );
   }

   return (
      <div className="max-h-dvh overflow-y-auto p-4 pt-0">
         <div className="container mx-auto max-w-6xl pt-3 pb-16">
            <div className="mb-8">
               <h1 className="mb-2 font-bold text-3xl">Library</h1>
               <p className="text-muted-foreground">Your collection of AI-generated images and file attachments</p>
               {filteredAssets && (
                  <div className="flex mt-[1px] flex-wrap gap-6 text-muted-foreground text-sm">
                     <span>
                        {stats.count} {fileType === "generated" ? "images" : "attachments"}
                     </span>
                     <span>{formatFileSize(stats.totalSize)} total</span>
                  </div>
               )}

               {/* File Type and Sort Controls */}
               {filteredAssets && filteredAssets.length > 0 && (
                  <div className="mt-6 flex gap-4 justify-start">
                     <Select value={fileType} onValueChange={(value: FileType) => setFileType(value)}>
                        <SelectTrigger className="w-48">
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="generated">Generated Images</SelectItem>
                           <SelectItem value="attachments">Attachments</SelectItem>
                        </SelectContent>
                     </Select>
                     <Select value={sortBy} onValueChange={(value: "newest" | "oldest" | "size") => setSortBy(value)}>
                        <SelectTrigger className="w-48">
                           <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="newest">Newest first</SelectItem>
                           <SelectItem value="oldest">Oldest first</SelectItem>
                           <SelectItem value="size">Largest first</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
               )}

               {/* Show controls even when no assets, for file type switching */}
               {filteredAssets && filteredAssets.length === 0 && (
                  <div className="mt-6 flex justify-start">
                     <Select value={fileType} onValueChange={(value: FileType) => setFileType(value)}>
                        <SelectTrigger className="w-48">
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="generated">Generated Images</SelectItem>
                           <SelectItem value="attachments">Attachments</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
               )}
            </div>

            {!filteredAssets ? (
               <div className="columns-1 gap-4 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5">
                  {Array.from({ length: 12 }).map((_, i) => (
                     // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                     <div key={i} className="mb-4 break-inside-avoid" style={{ height: `${Math.random() * 150 + 250}px` }}>
                        <Skeleton className="h-full w-full rounded-xl" />
                     </div>
                  ))}
               </div>
            ) : (
               <MasonryGrid assets={filteredAssets} fileType={fileType} onDelete={handleDelete} />
            )}
         </div>
      </div>
   );
}
