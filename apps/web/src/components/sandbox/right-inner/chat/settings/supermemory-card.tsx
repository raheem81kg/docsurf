import { SupermemoryIcon } from "@/components/brand-icons"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { UserSettings } from "@/convex/schema/settings"
import type { Infer } from "convex/values"
import { AlertCircle, Check, Key, RotateCcw, SquarePen, X } from "lucide-react"
import { memo, useState } from "react"

type SupermemoryCardProps = {
    userSettings: Infer<typeof UserSettings>
    onSave: (enabled: boolean, newKey?: string) => Promise<void>
    loading: boolean
}

export const SupermemoryCard = memo(({ userSettings, onSave, loading }: SupermemoryCardProps) => {
    const [isEditing, setIsEditing] = useState(false)
    const [enabled, setEnabled] = useState(
        userSettings.generalProviders?.supermemory?.enabled || false
    )
    const [newKey, setNewKey] = useState("")
    const [rotatingKey, setRotatingKey] = useState(false)

    const hasExistingKey = Boolean(userSettings.generalProviders?.supermemory?.encryptedKey)
    const isEnabled = userSettings.generalProviders?.supermemory?.enabled || false

    const handleSave = async () => {
        const canSave = !enabled || newKey.trim() || hasExistingKey
        if (!canSave) return

        try {
            await onSave(enabled, newKey.trim() || undefined)
            setIsEditing(false)
            setNewKey("")
            setRotatingKey(false)
        } catch (error) {
            // Error handling is done in the parent component
        }
    }

    const handleCancel = () => {
        setIsEditing(false)
        setEnabled(userSettings.generalProviders?.supermemory?.enabled || false)
        setNewKey("")
        setRotatingKey(false)
    }

    const canSave = !enabled || newKey.trim() || hasExistingKey

    return (
        <Card className="p-4 shadow-xs">
            <div className="flex items-start gap-2 space-y-4">
                <div className="flex size-8 items-center justify-center rounded-lg">
                    <div className="flex size-5 items-center justify-center">
                        <SupermemoryIcon />
                    </div>
                </div>
                <div className="flex-1">
                    <div className="mb-4 flex items-start justify-between">
                        <div className="flex items-start gap-2">
                            <div>
                                <h4 className="font-semibold text-sm">Supermemory</h4>
                                <p className="mt-0.5 text-muted-foreground text-xs">
                                    Store and retrieve memories for AI context across conversations
                                </p>
                            </div>
                        </div>

                        {isEnabled && (
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                <span className="text-muted-foreground text-xs">Active</span>
                            </div>
                        )}
                    </div>

                    {isEditing && (
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="supermemory-enabled"
                                    checked={enabled}
                                    onCheckedChange={setEnabled}
                                />
                                <Label htmlFor="supermemory-enabled">Enable Supermemory</Label>
                            </div>

                            {enabled && (
                                <div className="space-y-3">
                                    {hasExistingKey && (
                                        <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                                            <div className="flex items-center gap-2">
                                                <Key className="h-4 w-4 text-green-600" />
                                                <span className="text-sm">API key configured</span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setRotatingKey(!rotatingKey)}
                                            >
                                                <RotateCcw className="h-4 w-4" />
                                                {rotatingKey ? "Keep existing" : "Rotate key"}
                                            </Button>
                                        </div>
                                    )}

                                    {(!hasExistingKey || rotatingKey) && (
                                        <div className="space-y-2">
                                            <Label htmlFor="supermemory-key">
                                                {rotatingKey ? "New API Key" : "API Key"}
                                            </Label>
                                            <Input
                                                id="supermemory-key"
                                                type="password"
                                                value={newKey}
                                                onChange={(e) => setNewKey(e.target.value)}
                                                placeholder="sm-..."
                                                className="font-mono"
                                            />
                                            {rotatingKey && (
                                                <p className="text-muted-foreground text-xs">
                                                    Leave empty to keep existing key
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {enabled && !hasExistingKey && !newKey.trim() && (
                                        <div className="flex items-center gap-2 text-amber-600">
                                            <AlertCircle className="h-4 w-4" />
                                            <span className="text-sm">
                                                API key required to enable Supermemory
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button
                                    onClick={handleSave}
                                    disabled={loading || !canSave}
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
                    )}

                    {!isEditing && (
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                                <SquarePen className="size-4" />
                                {isEnabled ? "Edit" : "Setup"}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    )
})
