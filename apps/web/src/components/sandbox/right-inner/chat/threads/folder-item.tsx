import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"
import { api } from "@/convex/_generated/api"
import {
    DEFAULT_PROJECT_ICON,
    PROJECT_COLORS,
    type ProjectColorId,
    getProjectColorClasses
} from "@/lib/project-constants"
import { cn } from "@/lib/utils"
import { Link } from "@tanstack/react-router"
import { useNavigate, useParams } from "@tanstack/react-router"
import { useMutation } from "convex/react"
import { Check, Edit3, Loader2, MoreHorizontal, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import type { Project } from "./types"

export function FolderItem({
    project,
    numThreads
}: {
    project: Project
    numThreads: number
}) {
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [editName, setEditName] = useState("")
    const [editDescription, setEditDescription] = useState("")
    const [editColor, setEditColor] = useState<string>("blue")
    const [isEditing, setIsEditing] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const colorClasses = getProjectColorClasses(project.color as ProjectColorId)
    const updateProjectMutation = useMutation(api.folders.updateProject)
    const deleteProjectMutation = useMutation(api.folders.deleteProject)
    const navigate = useNavigate()
    const params = useParams({ strict: false }) as { folderId?: string }
    const isCurrentFolder = params.folderId === project._id

    const handleEdit = async () => {
        const trimmedName = editName.trim()
        if (!trimmedName) {
            toast.error("Folder name cannot be empty")
            return
        }

        setIsEditing(true)
        try {
            const result = await updateProjectMutation({
                projectId: project._id,
                name: trimmedName,
                description: editDescription.trim() || undefined,
                color: editColor,
                icon: project.icon || DEFAULT_PROJECT_ICON
            })

            if (result && "error" in result) {
                toast.error(
                    typeof result.error === "string" ? result.error : "Failed to update folder"
                )
            } else {
                toast.success("Folder updated successfully")
                setShowEditDialog(false)
            }
        } catch (error) {
            console.error("Failed to update folder:", error)
            toast.error("Failed to update folder")
        } finally {
            setIsEditing(false)
        }
    }

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            // Navigate away if currently viewing this folder
            if (isCurrentFolder) {
                navigate({ to: "/", replace: true })
            }

            const result = await deleteProjectMutation({ projectId: project._id })

            if (result && "error" in result) {
                toast.error(
                    typeof result.error === "string" ? result.error : "Failed to delete folder"
                )
            } else if (result && "archived" in result && result.archived) {
                toast.success("Folder archived (contains threads)")
            } else {
                toast.success("Folder deleted successfully")
            }
            setShowDeleteDialog(false)
        } catch (error) {
            console.error("Failed to delete folder:", error)
            toast.error("Failed to delete folder")
        } finally {
            setIsDeleting(false)
        }
    }

    const openEditDialog = () => {
        setEditName(project.name)
        setEditDescription(project.description || "")
        setEditColor(project.color || "blue")
        setShowEditDialog(true)
    }
    const { setOpenMobile } = useSidebar()

    return (
        <>
            <SidebarMenuItem>
                <div
                    className={cn(
                        "group/item flex w-full items-center rounded-sm hover:bg-accent/50",
                        isMenuOpen && "bg-accent/50",
                        isCurrentFolder && "bg-accent/60"
                    )}
                >
                    <SidebarMenuButton
                        asChild
                        className={cn(
                            "flex-1 hover:bg-transparent",
                            isCurrentFolder && "text-foreground"
                        )}
                    >
                        <Link
                            onClick={() => {
                                setOpenMobile(false)
                            }}
                            to="/folder/$folderId"
                            params={{ folderId: project._id }}
                            className="flex items-center gap-2"
                        >
                            <div
                                className={cn(
                                    "flex size-3 flex-shrink-0 items-center justify-center rounded-full text-xs",
                                    colorClasses.split(" ").slice(1).join(" ")
                                )}
                            />
                            <span className="truncate font-medium">{project.name}</span>
                        </Link>
                    </SidebarMenuButton>

                    <DropdownMenu onOpenChange={setIsMenuOpen}>
                        <DropdownMenuTrigger asChild>
                            <button type="button" className={"relative rounded p-1"}>
                                <span
                                    className={cn(
                                        "-translate-y-1/2 absolute top-[50%] right-2 ml-auto flex-shrink-0 rounded bg-input px-0.5 py-0.25 text-muted-foreground text-xs leading-none transition-opacity",
                                        isMenuOpen
                                            ? "opacity-0"
                                            : "opacity-100 group-hover/item:opacity-0"
                                    )}
                                >
                                    {numThreads}
                                </span>
                                <MoreHorizontal
                                    className={cn(
                                        "mr-1 h-4 w-4 transition-opacity",
                                        isMenuOpen || "opacity-0 group-hover/item:opacity-100"
                                    )}
                                />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={openEditDialog}>
                                <Edit3 className="h-4 w-4" />
                                Edit folder
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setShowDeleteDialog(true)}
                                variant="destructive"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete folder
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </SidebarMenuItem>

            {/* Edit Dialog */}
            <Dialog
                open={showEditDialog}
                onOpenChange={(open) => {
                    if (!isEditing) {
                        setShowEditDialog(open)
                    }
                }}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Folder</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="edit-folder-name">Name</Label>
                            <Input
                                id="edit-folder-name"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="max-w-[50%]"
                                placeholder="Enter folder name"
                                disabled={isEditing}
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-folder-description">Description (optional)</Label>
                            <Input
                                id="edit-folder-description"
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                placeholder="Enter folder description"
                                disabled={isEditing}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Color</Label>
                            <div className="flex gap-2">
                                {PROJECT_COLORS.map((color) => (
                                    <button
                                        key={color.id}
                                        type="button"
                                        onClick={() => setEditColor(color.id)}
                                        disabled={isEditing}
                                        className={cn(
                                            "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all",
                                            color.class.split(" ").slice(1).join(" "),
                                            editColor === color.id
                                                ? "scale-110 border-foreground"
                                                : "border-transparent hover:scale-105"
                                        )}
                                    >
                                        {editColor === color.id && (
                                            <Check className="h-4 w-4 text-white drop-shadow-sm" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowEditDialog(false)}
                            disabled={isEditing}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleEdit} disabled={isEditing || !editName.trim()}>
                            {isEditing ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Folder</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete{" "}
                            <span className="font-bold">{project.name}</span>?
                            {numThreads > 0 && (
                                <>
                                    <br />
                                    <br />
                                    This folder contains {numThreads} thread
                                    {numThreads !== 1 ? "s" : ""}. The folder will be archived
                                    instead of deleted.
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {numThreads > 0 ? "Archiving..." : "Deleting..."}
                                </>
                            ) : numThreads > 0 ? (
                                "Archive"
                            ) : (
                                "Delete"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
