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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { getProjectColorClasses } from "@/lib/project-constants"
import { cn } from "@/lib/utils"
import { useNavigate, useParams } from "@tanstack/react-router"
import { useMutation } from "convex/react"
import { FolderOpen, Loader2 } from "lucide-react"
import { memo, useEffect, useState } from "react"
import { toast } from "sonner"
import type { Thread } from "./types"

interface Project {
    _id: Id<"projects">
    name: string
    color?: string
    icon?: string
}

interface ThreadItemDialogsProps {
    // Dialog state
    showDeleteDialog: boolean
    showRenameDialog: boolean
    showMoveDialog: boolean

    // Dialog control
    onCloseDeleteDialog: () => void
    onCloseRenameDialog: () => void
    onCloseMoveDialog: () => void

    // Current thread
    currentThread: Thread | null

    // Projects for move dialog
    projects: Project[]
}

export const ThreadItemDialogs = memo(
    ({
        showDeleteDialog,
        showRenameDialog,
        showMoveDialog,
        onCloseDeleteDialog,
        onCloseRenameDialog,
        onCloseMoveDialog,
        currentThread,
        projects
    }: ThreadItemDialogsProps) => {
        const [renameValue, setRenameValue] = useState("")
        const [isRenaming, setIsRenaming] = useState(false)
        const [isMoving, setIsMoving] = useState(false)
        const [selectedProjectId, setSelectedProjectId] = useState<string>("no-folder")

        const deleteThreadMutation = useMutation(api.threads.deleteThread)
        const renameThreadMutation = useMutation(api.threads.renameThread)
        const moveThreadMutation = useMutation(api.folders.moveThreadToProject)

        const params = useParams({ strict: false }) as { threadId?: string }
        const navigate = useNavigate()

        // Reset states when dialogs close or thread changes
        useEffect(() => {
            if (!showRenameDialog) {
                setRenameValue("")
                setIsRenaming(false)
            }
        }, [showRenameDialog])

        useEffect(() => {
            if (!showMoveDialog) {
                setIsMoving(false)
            }
        }, [showMoveDialog])

        // Initialize rename value when dialog opens
        useEffect(() => {
            if (showRenameDialog && currentThread) {
                setRenameValue(currentThread.title)
            }
        }, [showRenameDialog, currentThread])

        // Initialize selected project when dialog opens
        useEffect(() => {
            if (showMoveDialog && currentThread) {
                setSelectedProjectId(currentThread.projectId || "no-folder")
            }
        }, [showMoveDialog, currentThread])

        const handleDelete = async () => {
            if (!currentThread) return

            try {
                const isActive = params.threadId === currentThread._id
                if (isActive) {
                    navigate({ to: "/", replace: true })
                }
                await deleteThreadMutation({ threadId: currentThread._id })
                onCloseDeleteDialog()
                toast.success("Thread deleted successfully")
            } catch (error) {
                console.error("Failed to delete thread:", error)
                toast.error("Failed to delete thread")
            }
        }

        const handleRename = async () => {
            if (!currentThread) return

            const trimmedValue = renameValue.trim()
            if (!trimmedValue) {
                toast.error("Thread name cannot be empty")
                return
            }

            if (trimmedValue === currentThread.title) {
                onCloseRenameDialog()
                return
            }

            setIsRenaming(true)
            try {
                const result = await renameThreadMutation({
                    threadId: currentThread._id,
                    title: trimmedValue
                })

                if (result && "error" in result) {
                    toast.error(
                        typeof result.error === "string" ? result.error : "Failed to rename thread"
                    )
                } else {
                    toast.success("Thread renamed successfully")
                    onCloseRenameDialog()
                }
            } catch (error) {
                console.error("Failed to rename thread:", error)
                toast.error("Failed to rename thread")
            } finally {
                setIsRenaming(false)
            }
        }

        const handleMove = async () => {
            if (!currentThread) return

            const newProjectId =
                selectedProjectId === "no-folder"
                    ? undefined
                    : (selectedProjectId as Id<"projects">)

            // Don't move if it's already in the same location
            if ((currentThread.projectId || "no-folder") === selectedProjectId) {
                onCloseMoveDialog()
                return
            }

            setIsMoving(true)
            try {
                const result = await moveThreadMutation({
                    threadId: currentThread._id,
                    projectId: newProjectId
                })

                if (result && "error" in result) {
                    toast.error(
                        typeof result.error === "string" ? result.error : "Failed to move thread"
                    )
                } else {
                    const targetName = newProjectId
                        ? projects.find((p) => p._id === newProjectId)?.name || "folder"
                        : "General"
                    toast.success(`Thread moved to ${targetName}`)
                    onCloseMoveDialog()
                }
            } catch (error) {
                console.error("Failed to move thread:", error)
                toast.error("Failed to move thread")
            } finally {
                setIsMoving(false)
            }
        }

        return (
            <>
                {/* Rename Dialog */}
                <Dialog
                    open={showRenameDialog}
                    onOpenChange={(open) => {
                        if (!isRenaming && !open) {
                            onCloseRenameDialog()
                        }
                    }}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Rename Thread</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <Input
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                placeholder="Enter thread name"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !isRenaming) {
                                        handleRename()
                                    } else if (e.key === "Escape" && !isRenaming) {
                                        onCloseRenameDialog()
                                    }
                                }}
                                disabled={isRenaming}
                            />
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={onCloseRenameDialog}
                                disabled={isRenaming}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleRename}
                                disabled={isRenaming || !renameValue.trim()}
                            >
                                {isRenaming ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Renaming...
                                    </>
                                ) : (
                                    "Rename"
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Move to Folder Dialog */}
                <Dialog
                    open={showMoveDialog}
                    onOpenChange={(open) => {
                        if (!isMoving && !open) {
                            onCloseMoveDialog()
                        }
                    }}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Move to Folder</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <RadioGroup
                                value={selectedProjectId}
                                onValueChange={setSelectedProjectId}
                                disabled={isMoving}
                            >
                                {/* No folder option */}
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="no-folder" id="no-folder" />
                                    <Label
                                        htmlFor="no-folder"
                                        className="flex cursor-pointer items-center gap-2"
                                    >
                                        <span>No Folder</span>
                                    </Label>
                                </div>

                                {/* Folder options */}
                                {projects.map((project) => {
                                    const colorClasses = getProjectColorClasses(
                                        project.color as any
                                    )
                                    return (
                                        <div
                                            key={project._id}
                                            className="flex items-center space-x-2"
                                        >
                                            <RadioGroupItem value={project._id} id={project._id} />
                                            <Label
                                                htmlFor={project._id}
                                                className="flex cursor-pointer items-center gap-1"
                                            >
                                                <div
                                                    className={cn(
                                                        "mt-1 flex size-5 self-baseline",
                                                        colorClasses,
                                                        "bg-transparent dark:bg-transparent"
                                                    )}
                                                >
                                                    <FolderOpen
                                                        className="size-4"
                                                        fill="currentColor"
                                                        strokeWidth={1}
                                                        stroke="var(--foreground)"
                                                    />
                                                </div>
                                                <span>{project.name}</span>
                                            </Label>
                                        </div>
                                    )
                                })}
                            </RadioGroup>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={onCloseMoveDialog}
                                disabled={isMoving}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleMove}
                                disabled={
                                    isMoving ||
                                    selectedProjectId === (currentThread?.projectId || "no-folder")
                                }
                            >
                                {isMoving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Moving...
                                    </>
                                ) : (
                                    "Move"
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Dialog */}
                <AlertDialog
                    open={showDeleteDialog}
                    onOpenChange={(open) => {
                        if (!open) onCloseDeleteDialog()
                    }}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Thread</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete{" "}
                                <span className="font-bold">{currentThread?.title?.trim()}</span>?{" "}
                                <br /> This action cannot be undone.
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
            </>
        )
    }
)

ThreadItemDialogs.displayName = "ThreadItemDialogs"
