import { MCPIcon } from "@/components/brand-icons"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { MCPServerConfig } from "@/convex/schema/settings"
import { cn } from "@/lib/utils"
import type { Infer } from "convex/values"
import { Check, Plus, SquarePen, Trash2, X } from "lucide-react"
import { memo, useState } from "react"

type MCPServerCardProps = {
    server: Infer<typeof MCPServerConfig>
    serverIndex: number
    onSave: (serverIndex: number, server: Infer<typeof MCPServerConfig>) => Promise<void>
    onDelete: (serverIndex: number) => Promise<void>
    loading: boolean
}

export const MCPServerCard = memo(
    ({ server, serverIndex, onSave, onDelete, loading }: MCPServerCardProps) => {
        const [isEditing, setIsEditing] = useState(false)
        const [formData, setFormData] = useState<Infer<typeof MCPServerConfig>>(server)
        const [showAddHeader, setShowAddHeader] = useState(false)
        const [newHeader, setNewHeader] = useState({ key: "", value: "" })

        const isEnabled = server.enabled ?? true // Default to true if not specified

        const handleSave = async () => {
            try {
                await onSave(serverIndex, formData)
                setIsEditing(false)
                setShowAddHeader(false)
            } catch (error) {
                // Error handling is done in the parent component
            }
        }

        const handleCancel = () => {
            setIsEditing(false)
            setFormData(server)
            setShowAddHeader(false)
            setNewHeader({ key: "", value: "" })
        }

        const handleAddHeader = () => {
            if (newHeader.key && newHeader.value) {
                setFormData({
                    ...formData,
                    headers: [...(formData.headers || []), { ...newHeader }]
                })
                setNewHeader({ key: "", value: "" })
            }
        }

        const handleRemoveHeader = (index: number) => {
            setFormData({
                ...formData,
                headers: (formData.headers || []).filter((_, i) => i !== index)
            })
        }

        return (
            <Card className={cn("p-4 shadow-xs", !isEnabled && "bg-muted/20 opacity-50")}>
                <div className="flex items-start gap-2 space-y-4">
                    <div className="flex size-8 items-center justify-center rounded-lg">
                        <div className="flex size-5 items-center justify-center">
                            <MCPIcon />
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="mb-4 flex items-start justify-between">
                            <div>
                                <h4 className="font-semibold text-sm">{server.name}</h4>
                                <p className="mt-0.5 text-muted-foreground text-xs">
                                    {server.type.toUpperCase()}: {server.url}
                                </p>
                                {server.headers && server.headers.length > 0 && (
                                    <p className="mt-0.5 text-muted-foreground text-xs">
                                        {server.headers.length} custom header
                                        {server.headers.length > 1 ? "s" : ""} configured
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <div
                                    className={cn(
                                        "h-2 w-2 rounded-full",
                                        isEnabled ? "bg-green-500" : "bg-gray-400"
                                    )}
                                />
                                <span className="text-muted-foreground text-xs">
                                    {isEnabled ? "Active" : "Disabled"}
                                </span>
                            </div>
                        </div>

                        {isEditing ? (
                            <div className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id={`mcp-enabled-${serverIndex}`}
                                        checked={formData.enabled ?? true}
                                        onCheckedChange={(checked) =>
                                            setFormData({
                                                ...formData,
                                                enabled: checked
                                            })
                                        }
                                    />
                                    <Label htmlFor={`mcp-enabled-${serverIndex}`}>
                                        Enable {server.name}
                                    </Label>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <Label
                                            htmlFor={`mcp-name-${serverIndex}`}
                                            className="text-xs"
                                        >
                                            Server Name
                                        </Label>
                                        <Input
                                            id={`mcp-name-${serverIndex}`}
                                            value={formData.name}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    name: e.target.value
                                                })
                                            }
                                            placeholder="my-server"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label
                                            htmlFor={`mcp-url-${serverIndex}`}
                                            className="text-xs"
                                        >
                                            Server URL
                                        </Label>
                                        <Input
                                            id={`mcp-url-${serverIndex}`}
                                            value={formData.url}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    url: e.target.value
                                                })
                                            }
                                            placeholder="http://localhost:3000/mcp"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label
                                            htmlFor={`mcp-type-${serverIndex}`}
                                            className="text-xs"
                                        >
                                            Transport Type
                                        </Label>
                                        <div className="mt-1 flex gap-2">
                                            <Button
                                                variant={
                                                    formData.type === "http" ? "default" : "outline"
                                                }
                                                size="sm"
                                                onClick={() =>
                                                    setFormData({ ...formData, type: "http" })
                                                }
                                            >
                                                HTTP
                                            </Button>
                                            <Button
                                                variant={
                                                    formData.type === "sse" ? "default" : "outline"
                                                }
                                                size="sm"
                                                onClick={() =>
                                                    setFormData({ ...formData, type: "sse" })
                                                }
                                            >
                                                SSE
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Headers section */}
                                    {(formData.headers?.length || 0) > 0 && (
                                        <div className="space-y-2">
                                            <Label className="text-xs">Headers</Label>
                                            {formData.headers?.map((header, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center gap-2 text-xs"
                                                >
                                                    <code className="flex-1 rounded bg-muted px-2 py-1">
                                                        {header.key}: {header.value}
                                                    </code>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleRemoveHeader(index)}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {showAddHeader ? (
                                        <div className="space-y-2">
                                            <Label className="text-xs">Add Header</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    value={newHeader.key}
                                                    onChange={(e) =>
                                                        setNewHeader({
                                                            ...newHeader,
                                                            key: e.target.value
                                                        })
                                                    }
                                                    placeholder="Header key"
                                                    className="flex-1"
                                                />
                                                <Input
                                                    value={newHeader.value}
                                                    onChange={(e) =>
                                                        setNewHeader({
                                                            ...newHeader,
                                                            value: e.target.value
                                                        })
                                                    }
                                                    placeholder="Header value"
                                                    className="flex-1"
                                                />
                                                <Button
                                                    size="sm"
                                                    onClick={handleAddHeader}
                                                    disabled={!newHeader.key || !newHeader.value}
                                                >
                                                    Add
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setShowAddHeader(false)
                                                        setNewHeader({ key: "", value: "" })
                                                    }}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowAddHeader(true)}
                                        >
                                            <Plus className="h-4 w-4" />
                                            Add Header
                                        </Button>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleSave}
                                        disabled={loading || !formData.name || !formData.url}
                                        size="sm"
                                    >
                                        <Check className="h-4 w-4" />
                                        {loading ? "Saving..." : "Save"}
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={handleCancel}>
                                        <X className="h-4 w-4" />
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsEditing(true)}
                                >
                                    <SquarePen className="size-4" />
                                    Edit
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete MCP Server</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to delete "{server.name}"?
                                                This action cannot be undone and will remove access
                                                to all tools from this server.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => onDelete(serverIndex)}
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            >
                                                Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        )
    }
)
