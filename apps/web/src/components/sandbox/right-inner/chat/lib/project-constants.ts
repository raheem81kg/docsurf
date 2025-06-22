// Project color palette with light/dark variants
export const PROJECT_COLORS = [
    {
        id: "blue",
        name: "Blue",
        class: "text-blue-500 bg-blue-500 border-blue-400 dark:text-blue-600 dark:bg-blue-600 dark:border-blue-500"
    },
    {
        id: "red",
        name: "Red",
        class: "text-red-500 bg-red-500 border-red-400 dark:text-red-600 dark:bg-red-600 dark:border-red-500"
    },
    {
        id: "green",
        name: "Green",
        class: "text-green-500 bg-green-500 border-green-400 dark:text-green-600 dark:bg-green-600 dark:border-green-500"
    },
    {
        id: "purple",
        name: "Purple",
        class: "text-purple-500 bg-purple-500 border-purple-400 dark:text-purple-600 dark:bg-purple-600 dark:border-purple-500"
    },
    {
        id: "orange",
        name: "Orange",
        class: "text-orange-500 bg-orange-500 border-orange-400 dark:text-orange-600 dark:bg-orange-600 dark:border-orange-500"
    },
    {
        id: "pink",
        name: "Pink",
        class: "text-pink-500 bg-pink-500 border-pink-400 dark:text-pink-600 dark:bg-pink-600 dark:border-pink-500"
    },
    {
        id: "teal",
        name: "Teal",
        class: "text-teal-500 bg-teal-500 border-teal-400 dark:text-teal-600 dark:bg-teal-600 dark:border-teal-500"
    },
    {
        id: "gray",
        name: "Gray",
        class: "text-gray-500 bg-gray-500 border-gray-400 dark:text-gray-600 dark:bg-gray-600 dark:border-gray-500"
    },
    {
        id: "indigo",
        name: "Indigo",
        class: "text-indigo-500 bg-indigo-500 border-indigo-400 dark:text-indigo-600 dark:bg-indigo-600 dark:border-indigo-500"
    },
    {
        id: "yellow",
        name: "Yellow",
        class: "text-yellow-500 bg-yellow-500 border-yellow-400 dark:text-yellow-600 dark:bg-yellow-600 dark:border-yellow-500"
    },
    {
        id: "cyan",
        name: "Cyan",
        class: "text-cyan-500 bg-cyan-500 border-cyan-400 dark:text-cyan-600 dark:bg-cyan-600 dark:border-cyan-500"
    }
] as const

export type ProjectColorId = (typeof PROJECT_COLORS)[number]["id"]

// Common project icons (emojis)
export const PROJECT_ICONS = [
    "📁",
    "💼",
    "🔬",
    "💡",
    "📚",
    "🎯",
    "🚀",
    "⚡",
    "🔥",
    "🌟",
    "💰",
    "🎨",
    "🛠️",
    "📊",
    "🏆",
    "🎮",
    "🌐",
    "📱",
    "💻",
    "📝",
    "🔍",
    "🧠",
    "❤️",
    "✨"
] as const

export type ProjectIcon = (typeof PROJECT_ICONS)[number]

// Get project color classes
export function getProjectColorClasses(colorId: ProjectColorId | undefined): string {
    if (!colorId)
        return "text-gray-500 bg-gray-500 border-gray-400 dark:text-gray-600 dark:bg-gray-600 dark:border-gray-500"

    const color = PROJECT_COLORS.find((c) => c.id === colorId)
    return (
        color?.class ||
        "text-gray-500 bg-gray-500 border-gray-400 dark:text-gray-600 dark:bg-gray-600 dark:border-gray-500"
    )
}

// Default project icon
export const DEFAULT_PROJECT_ICON = "📁"
