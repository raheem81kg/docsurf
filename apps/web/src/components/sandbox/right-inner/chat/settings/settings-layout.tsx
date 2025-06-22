import type { ReactNode } from "react"

interface SettingsLayoutProps {
    title: string
    description: string
    action?: ReactNode
    children: ReactNode
}

export function SettingsLayout({ title, description, action, children }: SettingsLayoutProps) {
    return <div className="mx-auto max-w-4xl space-y-8">{children}</div>
}
