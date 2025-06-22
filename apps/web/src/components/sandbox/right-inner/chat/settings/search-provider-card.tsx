import { BraveIcon, SerperDevIcon, TavilyIcon } from "@/components/brand-icons"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { AlertCircle, Check, CheckCircle, Key, RotateCcw, SquarePen, X } from "lucide-react"
import { memo, useState } from "react"

type SearchProvider = "firecrawl" | "brave" | "tavily" | "serper"

// Brave API supported country codes
const BRAVE_COUNTRIES = [
    { code: "ALL", name: "All Regions" },
    { code: "US", name: "United States" },
    { code: "GB", name: "United Kingdom" },
    { code: "CA", name: "Canada" },
    { code: "AU", name: "Australia" },
    { code: "DE", name: "Germany" },
    { code: "FR", name: "France" },
    { code: "IT", name: "Italy" },
    { code: "ES", name: "Spain" },
    { code: "NL", name: "Netherlands" },
    { code: "BE", name: "Belgium" },
    { code: "CH", name: "Switzerland" },
    { code: "AT", name: "Austria" },
    { code: "DK", name: "Denmark" },
    { code: "FI", name: "Finland" },
    { code: "NO", name: "Norway" },
    { code: "SE", name: "Sweden" },
    { code: "PL", name: "Poland" },
    { code: "PT", name: "Portugal" },
    { code: "RU", name: "Russia" },
    { code: "JP", name: "Japan" },
    { code: "KR", name: "Korea" },
    { code: "CN", name: "China" },
    { code: "HK", name: "Hong Kong" },
    { code: "TW", name: "Taiwan" },
    { code: "IN", name: "India" },
    { code: "ID", name: "Indonesia" },
    { code: "MY", name: "Malaysia" },
    { code: "PH", name: "Philippines" },
    { code: "SA", name: "Saudi Arabia" },
    { code: "ZA", name: "South Africa" },
    { code: "BR", name: "Brazil" },
    { code: "AR", name: "Argentina" },
    { code: "CL", name: "Chile" },
    { code: "MX", name: "Mexico" },
    { code: "TR", name: "Turkey" },
    { code: "NZ", name: "New Zealand" }
]

// Brave API supported language codes
const BRAVE_LANGUAGES = [
    { code: "en", name: "English" },
    { code: "en-gb", name: "English (UK)" },
    { code: "de", name: "German" },
    { code: "fr", name: "French" },
    { code: "es", name: "Spanish" },
    { code: "it", name: "Italian" },
    { code: "nl", name: "Dutch" },
    { code: "pt-br", name: "Portuguese (Brazil)" },
    { code: "pt-pt", name: "Portuguese (Portugal)" },
    { code: "ru", name: "Russian" },
    { code: "ja", name: "Japanese" }, // jp in API, but ja is standard
    { code: "ko", name: "Korean" },
    { code: "zh-hans", name: "Chinese (Simplified)" },
    { code: "zh-hant", name: "Chinese (Traditional)" },
    { code: "ar", name: "Arabic" },
    { code: "hi", name: "Hindi" },
    { code: "da", name: "Danish" },
    { code: "fi", name: "Finnish" },
    { code: "no", name: "Norwegian" }, // nb in API
    { code: "sv", name: "Swedish" },
    { code: "pl", name: "Polish" },
    { code: "cs", name: "Czech" },
    { code: "hu", name: "Hungarian" },
    { code: "ro", name: "Romanian" },
    { code: "bg", name: "Bulgarian" },
    { code: "hr", name: "Croatian" },
    { code: "sk", name: "Slovak" },
    { code: "sl", name: "Slovenian" },
    { code: "et", name: "Estonian" },
    { code: "lv", name: "Latvian" },
    { code: "lt", name: "Lithuanian" },
    { code: "tr", name: "Turkish" },
    { code: "he", name: "Hebrew" },
    { code: "th", name: "Thai" },
    { code: "vi", name: "Vietnamese" },
    { code: "uk", name: "Ukrainian" }
]

// Google/Serper supported country codes (gl parameter)
const SERPER_COUNTRIES = [
    { code: "us", name: "United States" },
    { code: "gb", name: "United Kingdom" },
    { code: "ca", name: "Canada" },
    { code: "au", name: "Australia" },
    { code: "de", name: "Germany" },
    { code: "fr", name: "France" },
    { code: "it", name: "Italy" },
    { code: "es", name: "Spain" },
    { code: "nl", name: "Netherlands" },
    { code: "be", name: "Belgium" },
    { code: "ch", name: "Switzerland" },
    { code: "at", name: "Austria" },
    { code: "dk", name: "Denmark" },
    { code: "fi", name: "Finland" },
    { code: "no", name: "Norway" },
    { code: "se", name: "Sweden" },
    { code: "pl", name: "Poland" },
    { code: "pt", name: "Portugal" },
    { code: "ru", name: "Russia" },
    { code: "jp", name: "Japan" },
    { code: "kr", name: "South Korea" },
    { code: "cn", name: "China" },
    { code: "hk", name: "Hong Kong" },
    { code: "tw", name: "Taiwan" },
    { code: "in", name: "India" },
    { code: "id", name: "Indonesia" },
    { code: "my", name: "Malaysia" },
    { code: "ph", name: "Philippines" },
    { code: "sa", name: "Saudi Arabia" },
    { code: "za", name: "South Africa" },
    { code: "br", name: "Brazil" },
    { code: "ar", name: "Argentina" },
    { code: "cl", name: "Chile" },
    { code: "mx", name: "Mexico" },
    { code: "tr", name: "Turkey" },
    { code: "nz", name: "New Zealand" }
]

// Google/Serper supported language codes (hl parameter)
const SERPER_LANGUAGES = [
    { code: "en", name: "English" },
    { code: "de", name: "German" },
    { code: "fr", name: "French" },
    { code: "es", name: "Spanish" },
    { code: "it", name: "Italian" },
    { code: "nl", name: "Dutch" },
    { code: "pt", name: "Portuguese" },
    { code: "ru", name: "Russian" },
    { code: "ja", name: "Japanese" },
    { code: "ko", name: "Korean" },
    { code: "zh", name: "Chinese" },
    { code: "ar", name: "Arabic" },
    { code: "hi", name: "Hindi" },
    { code: "da", name: "Danish" },
    { code: "fi", name: "Finnish" },
    { code: "no", name: "Norwegian" },
    { code: "sv", name: "Swedish" },
    { code: "pl", name: "Polish" },
    { code: "cs", name: "Czech" },
    { code: "hu", name: "Hungarian" },
    { code: "ro", name: "Romanian" },
    { code: "bg", name: "Bulgarian" },
    { code: "hr", name: "Croatian" },
    { code: "sk", name: "Slovak" },
    { code: "sl", name: "Slovenian" },
    { code: "et", name: "Estonian" },
    { code: "lv", name: "Latvian" },
    { code: "lt", name: "Lithuanian" },
    { code: "tr", name: "Turkish" },
    { code: "he", name: "Hebrew" },
    { code: "th", name: "Thai" },
    { code: "vi", name: "Vietnamese" },
    { code: "uk", name: "Ukrainian" }
]

// Brave safesearch options
const BRAVE_SAFESEARCH_OPTIONS = [
    { value: "off", label: "Off" },
    { value: "moderate", label: "Moderate" },
    { value: "strict", label: "Strict" }
]

type SearchProviderCardProps = {
    provider: SearchProvider
    isSelected: boolean
    onSelect: (provider: SearchProvider) => void
    title: string
    description: string
}

const providerIcons: Record<SearchProvider, React.ComponentType<{ className?: string }> | string> =
    {
        firecrawl: "🔥",
        brave: BraveIcon,
        tavily: TavilyIcon,
        serper: SerperDevIcon
    }

export const SearchProviderCard = memo(
    ({ provider, isSelected, onSelect, title, description }: SearchProviderCardProps) => {
        const IconComponent = providerIcons[provider]

        return (
            <Card
                className={cn(
                    "cursor-pointer border-0 bg-muted/20 p-4 transition-all duration-200 hover:bg-muted/40",
                    isSelected
                        ? "bg-primary/5 ring-1 ring-primary/20"
                        : "hover:ring-1 hover:ring-border"
                )}
                onClick={() => onSelect(provider)}
            >
                <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full">
                        {typeof IconComponent === "string" ? (
                            <span className="text-2xl">{IconComponent}</span>
                        ) : (
                            <IconComponent className="size-10" />
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <Label className="cursor-pointer font-medium text-foreground">
                                {title}
                            </Label>
                            {isSelected && <CheckCircle className="ml-auto size-4 text-primary" />}
                        </div>
                        <p className="mt-1 text-muted-foreground text-sm">{description}</p>
                    </div>
                </div>
            </Card>
        )
    }
)

// New BYOK Search Provider Card Component
type BYOKSearchProviderCardProps = {
    provider: {
        id: SearchProvider
        name: string
        description: string
        placeholder: string
        icon: React.ComponentType<{ className?: string }> | string
    }
    currentConfig?: { enabled: boolean; encryptedKey: string } & Record<string, any>
    onSave: (
        providerId: string,
        config: { enabled: boolean; newKey?: string } & Record<string, any>
    ) => Promise<void>
    loading: boolean
}

export const BYOKSearchProviderCard = memo(
    ({ provider, currentConfig, onSave, loading }: BYOKSearchProviderCardProps) => {
        const [isEditing, setIsEditing] = useState(false)
        const [enabled, setEnabled] = useState(currentConfig?.enabled || false)
        const [newKey, setNewKey] = useState("")
        const [rotatingKey, setRotatingKey] = useState(false)

        // Additional fields for provider-specific settings
        const [additionalFields, setAdditionalFields] = useState<Record<string, string>>({
            country: currentConfig?.country || "",
            searchLang: currentConfig?.searchLang || "",
            safesearch: currentConfig?.safesearch || "moderate",
            language: currentConfig?.language || ""
        })

        const hasExistingKey = Boolean(currentConfig?.encryptedKey)
        const canSave = enabled ? (hasExistingKey && !rotatingKey) || newKey.trim() : true
        const isEnabled = currentConfig?.enabled || false

        const handleSave = async () => {
            try {
                const config: any = {
                    enabled,
                    newKey: rotatingKey || !hasExistingKey ? newKey : undefined
                }

                // Add provider-specific fields for Brave and Serper
                if (provider.id === "brave") {
                    config.country = additionalFields.country
                    config.searchLang = additionalFields.searchLang
                    config.safesearch = additionalFields.safesearch
                } else if (provider.id === "serper") {
                    config.language = additionalFields.language
                    config.country = additionalFields.country
                }

                await onSave(provider.id, config)
                setIsEditing(false)
                setNewKey("")
                setRotatingKey(false)
            } catch (error) {
                // Error handled in parent
            }
        }

        const handleCancel = () => {
            setIsEditing(false)
            setEnabled(currentConfig?.enabled || false)
            setNewKey("")
            setRotatingKey(false)
            setAdditionalFields({
                country: currentConfig?.country || "",
                searchLang: currentConfig?.searchLang || "",
                safesearch: currentConfig?.safesearch || "moderate",
                language: currentConfig?.language || ""
            })
        }

        const Icon = provider.icon

        return (
            <Card className="p-4 shadow-xs">
                <div className="flex items-start gap-2 space-y-4">
                    <div className="flex size-8 items-center justify-center rounded-lg">
                        {typeof Icon === "string" ? (
                            <span className="text-2xl">{Icon}</span>
                        ) : (
                            <Icon className="size-5" />
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="mb-4 flex items-start justify-between">
                            <div className="flex items-start gap-2">
                                <div>
                                    <h4 className="font-semibold text-sm">{provider.name}</h4>
                                    <p className="mt-0.5 text-muted-foreground text-xs">
                                        {provider.description}
                                    </p>
                                </div>
                            </div>

                            {isEnabled && (
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-green-500" />
                                    <span className="text-muted-foreground text-xs">BYOK</span>
                                </div>
                            )}
                        </div>

                        {isEditing ? (
                            <div className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id={`${provider.id}-enabled`}
                                        checked={enabled}
                                        onCheckedChange={setEnabled}
                                    />
                                    <Label htmlFor={`${provider.id}-enabled`}>
                                        Enable {provider.name} BYOK
                                    </Label>
                                </div>

                                {enabled && (
                                    <div className="space-y-3">
                                        {hasExistingKey && (
                                            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                                                <div className="flex items-center gap-2">
                                                    <Key className="h-4 w-4 text-green-600" />
                                                    <span className="text-sm">
                                                        API key configured
                                                    </span>
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
                                                <Label htmlFor={`${provider.id}-key`}>
                                                    {rotatingKey ? "New API Key" : "API Key"}
                                                </Label>
                                                <Input
                                                    id={`${provider.id}-key`}
                                                    type="password"
                                                    value={newKey}
                                                    onChange={(e) => setNewKey(e.target.value)}
                                                    placeholder={provider.placeholder}
                                                    className="font-mono"
                                                />
                                                {rotatingKey && (
                                                    <p className="text-muted-foreground text-xs">
                                                        Leave empty to keep existing key
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Provider-specific fields */}
                                        {provider.id === "brave" && (
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor={`${provider.id}-country`}>
                                                            Country
                                                        </Label>
                                                        <Select
                                                            value={additionalFields.country}
                                                            onValueChange={(value) =>
                                                                setAdditionalFields((prev) => ({
                                                                    ...prev,
                                                                    country: value
                                                                }))
                                                            }
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select country" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {BRAVE_COUNTRIES.map((country) => (
                                                                    <SelectItem
                                                                        key={country.code}
                                                                        value={country.code}
                                                                    >
                                                                        {country.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor={`${provider.id}-lang`}>
                                                            Search Language
                                                        </Label>
                                                        <Select
                                                            value={additionalFields.searchLang}
                                                            onValueChange={(value) =>
                                                                setAdditionalFields((prev) => ({
                                                                    ...prev,
                                                                    searchLang: value
                                                                }))
                                                            }
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select language" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {BRAVE_LANGUAGES.map((language) => (
                                                                    <SelectItem
                                                                        key={language.code}
                                                                        value={language.code}
                                                                    >
                                                                        {language.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor={`${provider.id}-safesearch`}>
                                                        Safe Search
                                                    </Label>
                                                    <Select
                                                        value={additionalFields.safesearch}
                                                        onValueChange={(value) =>
                                                            setAdditionalFields((prev) => ({
                                                                ...prev,
                                                                safesearch: value
                                                            }))
                                                        }
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select safe search level" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {BRAVE_SAFESEARCH_OPTIONS.map(
                                                                (option) => (
                                                                    <SelectItem
                                                                        key={option.value}
                                                                        value={option.value}
                                                                    >
                                                                        {option.label}
                                                                    </SelectItem>
                                                                )
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        )}

                                        {provider.id === "serper" && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor={`${provider.id}-language`}>
                                                        Language
                                                    </Label>
                                                    <Select
                                                        value={additionalFields.language}
                                                        onValueChange={(value) =>
                                                            setAdditionalFields((prev) => ({
                                                                ...prev,
                                                                language: value
                                                            }))
                                                        }
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select language" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {SERPER_LANGUAGES.map((language) => (
                                                                <SelectItem
                                                                    key={language.code}
                                                                    value={language.code}
                                                                >
                                                                    {language.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label
                                                        htmlFor={`${provider.id}-country-serper`}
                                                    >
                                                        Country
                                                    </Label>
                                                    <Select
                                                        value={additionalFields.country}
                                                        onValueChange={(value) =>
                                                            setAdditionalFields((prev) => ({
                                                                ...prev,
                                                                country: value
                                                            }))
                                                        }
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select country" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {SERPER_COUNTRIES.map((country) => (
                                                                <SelectItem
                                                                    key={country.code}
                                                                    value={country.code}
                                                                >
                                                                    {country.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        )}

                                        {enabled && !hasExistingKey && !newKey.trim() && (
                                            <div className="flex items-center gap-2 text-amber-600">
                                                <AlertCircle className="h-4 w-4" />
                                                <span className="text-sm">
                                                    API key required to enable BYOK
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
                        ) : (
                            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                                {isEnabled ? (
                                    <SquarePen className="size-4" />
                                ) : (
                                    <Key className="size-4" />
                                )}
                                {isEnabled ? "Edit BYOK" : "Setup BYOK"}
                            </Button>
                        )}
                    </div>
                </div>
            </Card>
        )
    }
)
