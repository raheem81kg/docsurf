import { MCPIcon } from "@/components/brand-icons"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { MCPServerConfig, UserSettings } from "@/convex/schema/settings"
import type { Infer } from "convex/values"
import { Check, Plus, X } from "lucide-react"
import { memo, useState } from "react"
import { MCPServerCard } from "./mcp-server-card"

type MCPServersCardProps = {
    userSettings: Infer<typeof UserSettings>
    onSave: (servers: Infer<typeof MCPServerConfig>[]) => Promise<void>
    loading: boolean
}

export const MCPServersCard = memo(({ userSettings, onSave, loading }: MCPServersCardProps) => {
    const [addingNewServer, setAddingNewServer] = useState(false)
    const [newServer, setNewServer] = useState<Infer<typeof MCPServerConfig>>({
        name: "",
        url: "",
        type: "http",
        enabled: true,
        headers: []
    })
    const [showAddHeader, setShowAddHeader] = useState(false)
    const [newHeader, setNewHeader] = useState({ key: "", value: "" })

    const servers = userSettings.mcpServers || []

    const handleSaveServer = async (
        serverIndex: number,
        updatedServer: Infer<typeof MCPServerConfig>
    ) => {
        const newServers = [...servers]
        newServers[serverIndex] = updatedServer
        await onSave(newServers)
    }

    const handleDeleteServer = async (serverIndex: number) => {
        const newServers = servers.filter((_, i) => i !== serverIndex)
        await onSave(newServers)
    }

    const handleAddNewServer = async () => {
        if (newServer.name && newServer.url) {
            const newServers = [...servers, { ...newServer }]
            await onSave(newServers)
            setAddingNewServer(false)
            setNewServer({
                name: "",
                url: "",
                type: "http",
                enabled: true,
                headers: []
            })
            setShowAddHeader(false)
            setNewHeader({ key: "", value: "" })
        }
    }

    const handleCancelNewServer = () => {
        setAddingNewServer(false)
        setNewServer({
            name: "",
            url: "",
            type: "http",
            enabled: true,
            headers: []
        })
        setShowAddHeader(false)
        setNewHeader({ key: "", value: "" })
    }

    const handleAddHeader = () => {
        if (newHeader.key && newHeader.value) {
            setNewServer({
                ...newServer,
                headers: [...(newServer.headers || []), { ...newHeader }]
            })
            setNewHeader({ key: "", value: "" })
        }
    }

    const handleRemoveHeader = (index: number) => {
        setNewServer({
            ...newServer,
            headers: (newServer.headers || []).filter((_, i) => i !== index)
        })
    }

    return (
        <div className="space-y-4">
            <div>
                <h3 className="font-semibold text-foreground">MCP Servers</h3>
                <p className="mt-1 text-muted-foreground text-sm">
                    Connect to Model Context Protocol servers for additional AI capabilities
                </p>
            </div>

            {/* Existing servers */}
            {servers.map((server, index) => (
                <MCPServerCard
                    key={index}
                    server={server}
                    serverIndex={index}
                    onSave={handleSaveServer}
                    onDelete={handleDeleteServer}
                    loading={loading}
                />
            ))}

            {/* Add new server */}
            {addingNewServer ? (
                <Card className="p-4 shadow-xs">
                    <div className="space-y-4">
                        <h4 className="font-semibold text-sm">Add New MCP Server</h4>
                        <div className="space-y-3">
                            <div>
                                <Label htmlFor="mcp-name" className="text-xs">
                                    Server Name
                                </Label>
                                <Input
                                    id="mcp-name"
                                    value={newServer.name}
                                    onChange={(e) =>
                                        setNewServer({
                                            ...newServer,
                                            name: e.target.value
                                        })
                                    }
                                    placeholder="my-server"
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="mcp-url" className="text-xs">
                                    Server URL
                                </Label>
                                <Input
                                    id="mcp-url"
                                    value={newServer.url}
                                    onChange={(e) =>
                                        setNewServer({
                                            ...newServer,
                                            url: e.target.value
                                        })
                                    }
                                    placeholder="http://localhost:3000/mcp"
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="mcp-type" className="text-xs">
                                    Transport Type
                                </Label>
                                <div className="mt-1 flex gap-2">
                                    <Button
                                        variant={newServer.type === "http" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setNewServer({ ...newServer, type: "http" })}
                                    >
                                        HTTP
                                    </Button>
                                    <Button
                                        variant={newServer.type === "sse" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setNewServer({ ...newServer, type: "sse" })}
                                    >
                                        SSE
                                    </Button>
                                </div>
                            </div>

                            {/* Headers section */}
                            {(newServer.headers?.length || 0) > 0 && (
                                <div className="space-y-2">
                                    <Label className="text-xs">Headers</Label>
                                    {newServer.headers?.map((header, index) => (
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

                            <div className="flex gap-2">
                                <Button
                                    onClick={handleAddNewServer}
                                    disabled={loading || !newServer.name || !newServer.url}
                                    size="sm"
                                >
                                    <Check className="h-4 w-4" />
                                    {loading ? "Adding..." : "Add Server"}
                                </Button>
                                <Button variant="ghost" size="sm" onClick={handleCancelNewServer}>
                                    <X className="h-4 w-4" />
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>
            ) : (
                <Card className="border-dashed p-4 shadow-xs">
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                        <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-muted">
                            <div className="flex size-5 items-center justify-center">
                                <MCPIcon />
                            </div>
                        </div>
                        <h4 className="mb-1 font-semibold text-sm">Add MCP Server</h4>
                        <p className="mb-3 text-muted-foreground text-xs">
                            Connect to Model Context Protocol servers for additional AI tools
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAddingNewServer(true)}
                        >
                            <Plus className="h-4 w-4" />
                            Add Server
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    )
})
