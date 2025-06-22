import { useThemeStore } from "@/lib/theme-store"
import { cn } from "@/lib/utils"
import {
    SandpackLayout,
    SandpackPreview,
    SandpackProvider,
    useSandpack
} from "@codesandbox/sandpack-react"
import { memo, useEffect, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch"
import remarkGfm from "remark-gfm"
import { Codeblock } from "./codeblock"

// Supported languages for artifacts
export const ARTIFACT_SUPPORTED_LANGUAGES = [
    "mermaid",
    "html",
    "react",
    "jsx",
    "tsx",
    "markdown",
    "md"
] as const

export type ArtifactLanguage = (typeof ARTIFACT_SUPPORTED_LANGUAGES)[number]

export function isArtifactSupported(language: string): language is ArtifactLanguage {
    return ARTIFACT_SUPPORTED_LANGUAGES.includes(language as ArtifactLanguage)
}

interface ArtifactPreviewProps {
    code: string
    language: ArtifactLanguage
    className?: string
}

const MermaidRenderer = memo(({ code }: { code: string }) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const { themeState } = useThemeStore()
    const isDark = themeState.currentMode === "dark"
    const [mermaidHTML, setMermaidHTML] = useState<string | null>(null)

    useEffect(() => {
        ;(async () => {
            try {
                const mermaid = await import("mermaid")

                // Hardcoded colors based on globals.css
                const lightTheme = {
                    primary: "#10b981", // Green equivalent of oklch(0.5234 0.1347 144.1672)
                    primaryText: "#1f2937", // Dark gray for text on light backgrounds
                    background: "#fefefe", // Near white equivalent of oklch(0.9711 0.0074 80.7211)
                    foreground: "#1f2937", // Dark gray equivalent of oklch(0.3 0.0358 30.2042)
                    border: "#e5e7eb", // Light gray equivalent of oklch(0.8805 0.0208 74.6428)
                    muted: "#f3f4f6", // Light gray equivalent of oklch(0.937 0.0142 74.4218)
                    secondary: "#f0fdf4" // Very light green equivalent of oklch(0.9571 0.021 147.636)
                }

                const darkTheme = {
                    primary: "#10b981", // Green equivalent of oklch(0.4365 0.1044 156.7556)
                    primaryText: "#ecfdf5", // Light green equivalent of oklch(0.9213 0.0135 167.1556)
                    background: "#000000", // Black
                    foreground: "#f9fafb", // Near white equivalent of oklch(0.9288 0.0126 255.5078)
                    border: "#374151", // Dark gray equivalent of oklch(0.2264 0 0)
                    muted: "#1f2937", // Dark gray equivalent of oklch(0.2393 0 0)
                    secondary: "#111827" // Very dark gray equivalent of oklch(0.2603 0 0)
                }

                const colors = isDark ? darkTheme : lightTheme

                mermaid.default.initialize({
                    startOnLoad: false,
                    theme: "base",
                    themeVariables: {
                        primaryColor: colors.primary,
                        primaryTextColor: colors.primaryText,
                        primaryBorderColor: colors.border,
                        lineColor: colors.border,
                        secondaryColor: colors.secondary,
                        tertiaryColor: colors.muted,
                        background: colors.background,
                        mainBkg: colors.background,
                        secondBkg: colors.muted,
                        tertiaryBkg: colors.muted,
                        // Text colors
                        textColor: colors.foreground,
                        mainContrastColor: colors.foreground,
                        darkTextColor: colors.foreground,
                        altBackground: colors.muted,
                        // Node colors
                        nodeBkg: colors.primary,
                        nodeTextColor: colors.primaryText,
                        // Edge colors
                        edgeLabelBackground: colors.background,
                        // Class diagram colors
                        classText: colors.foreground
                    }
                })
                console.log(code)

                const { svg } = await mermaid.default.render(
                    `mermaid-${Date.now()}-${isDark ? "dark" : "light"}`,
                    code
                )
                console.log(svg)
                setMermaidHTML(svg)
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to render diagram")
            } finally {
                setIsLoading(false)
            }
        })()
    }, [code, isDark])

    if (error) {
        return (
            <div className="flex items-center justify-center p-8 text-destructive">
                <div className="text-center">
                    <p className="font-medium">Failed to render diagram</p>
                    <p className="text-muted-foreground text-sm">{error}</p>
                </div>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
            </div>
        )
    }

    return (
        <div className="[&>.react-transform-wrapper]:!w-full w-full">
            <TransformWrapper
                initialScale={1}
                minScale={0.5}
                maxScale={3}
                doubleClick={{ disabled: false, mode: "reset" }}
                wheel={{ step: 0.1 }}
                panning={{ velocityDisabled: true }}
                limitToBounds={false}
            >
                <TransformComponent
                    wrapperClass="flex items-center justify-center bg-background p-4 h-96 overflow-hidden"
                    contentClass="max-w-full"
                >
                    <div
                        ref={containerRef}
                        className="max-w-full"
                        // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
                        dangerouslySetInnerHTML={{ __html: mermaidHTML ?? "" }}
                    />
                </TransformComponent>
            </TransformWrapper>
        </div>
    )
})

MermaidRenderer.displayName = "MermaidRenderer"

const HTMLRenderer = memo(({ code }: { code: string }) => {
    const [isDark, setIsDark] = useState(false)

    useEffect(() => {
        const checkDarkMode = () => {
            const isDarkMode =
                document.documentElement.classList.contains("dark") ||
                window.matchMedia("(prefers-color-scheme: dark)").matches
            setIsDark(isDarkMode)
        }

        checkDarkMode()

        const observer = new MutationObserver(checkDarkMode)
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
        mediaQuery.addEventListener("change", checkDarkMode)

        return () => {
            observer.disconnect()
            mediaQuery.removeEventListener("change", checkDarkMode)
        }
    }, [])

    // Hardcoded colors based on globals.css
    const colors = isDark
        ? {
              background: "#000000", // Dark background
              foreground: "#f9fafb", // Light text
              primary: "#10b981", // Green primary
              border: "#374151" // Dark border
          }
        : {
              background: "#fefefe", // Light background
              foreground: "#1f2937", // Dark text
              primary: "#10b981", // Green primary
              border: "#e5e7eb" // Light border
          }

    // Inject basic theme CSS variables into the HTML
    const themeCSS = `
        <style>
            :root {
                --background: ${colors.background};
                --foreground: ${colors.foreground};
                --primary: ${colors.primary};
                --border: ${colors.border};
            }
            
            body {
                background-color: var(--background);
                color: var(--foreground);
                margin: 0;
                padding: 1rem;
                font-family: system-ui, -apple-system, sans-serif;
            }
        </style>
    `

    // Inject the CSS into the HTML document
    const enhancedCode = code.includes("<head>")
        ? code.replace("<head>", `<head>${themeCSS}`)
        : code.includes("<html>")
          ? code.replace("<html>", `<html><head>${themeCSS}</head>`)
          : `<html><head>${themeCSS}</head><body>${code}</body></html>`

    return (
        <iframe
            srcDoc={enhancedCode}
            className="h-96 w-full border-0"
            sandbox="allow-scripts allow-same-origin"
            title="HTML Preview"
        />
    )
})

HTMLRenderer.displayName = "HTMLRenderer"

const ReactRenderer = memo(({ code }: { code: string }) => {
    return (
        <div className="sandpack-container relative h-96 w-full">
            <SandpackProvider
                template="react"
                customSetup={{
                    dependencies: {
                        recharts: "2.15.0",
                        "lucide-react": "latest",
                        clsx: "latest",
                        "tailwind-merge": "latest"
                    }
                }}
                files={{
                    "/App.js": code
                }}
                options={{
                    externalResources: ["https://cdn.tailwindcss.com"]
                }}
                theme="auto"
            >
                <SandpackPreviewContainer />
            </SandpackProvider>
        </div>
    )
})

const SandpackPreviewContainer = memo(() => {
    const { sandpack } = useSandpack()

    return (
        <div className="relative h-full w-full">
            <SandpackLayout>
                <SandpackPreview
                    showRefreshButton={false}
                    showOpenInCodeSandbox={false}
                    style={{
                        height: "100%",
                        width: "100%"
                    }}
                />
            </SandpackLayout>
            {sandpack.error && (
                <div className="absolute bottom-4 left-4 z-10 rounded-md bg-destructive/90 p-3 text-destructive-foreground shadow-lg">
                    <div className="font-medium text-sm">Rendering Error</div>
                    <div className="text-xs opacity-90">{sandpack.error.message}</div>
                </div>
            )}
        </div>
    )
})

SandpackPreviewContainer.displayName = "SandpackPreviewContainer"

ReactRenderer.displayName = "ReactRenderer"

const MarkdownRenderer = memo(({ code }: { code: string }) => {
    return (
        <TransformWrapper
            initialScale={1}
            minScale={0.5}
            maxScale={2}
            doubleClick={{ disabled: false, mode: "reset" }}
            wheel={{ step: 0.1 }}
            panning={{ velocityDisabled: true }}
            limitToBounds={false}
        >
            <TransformComponent wrapperClass="prose prose-sm dark:prose-invert max-w-none p-4 overflow-hidden">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        code: ({ className, children, ...props }) => {
                            const inline = "inline" in props ? (props.inline as boolean) : false
                            return (
                                <Codeblock inline={inline} className={className} {...props}>
                                    {children}
                                </Codeblock>
                            )
                        }
                    }}
                >
                    {code}
                </ReactMarkdown>
            </TransformComponent>
        </TransformWrapper>
    )
})

MarkdownRenderer.displayName = "MarkdownRenderer"

export const ArtifactPreview = memo(({ code, language, className }: ArtifactPreviewProps) => {
    const renderPreview = () => {
        switch (language) {
            case "mermaid":
                return <MermaidRenderer code={code} />
            case "html":
                return <HTMLRenderer code={code} />
            case "react":
            case "jsx":
            case "tsx":
                return <ReactRenderer code={code} />
            case "markdown":
            case "md":
                return <MarkdownRenderer code={code} />
            default:
                return (
                    <div className="p-4 text-center text-muted-foreground">
                        Preview not available for {language}
                    </div>
                )
        }
    }

    return <div className={cn("min-h-[200px] bg-card", className)}>{renderPreview()}</div>
})

ArtifactPreview.displayName = "ArtifactPreview"
