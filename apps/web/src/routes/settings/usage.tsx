import { UsageDashboard } from "@/components/analytics/usage-dashboard"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/settings/usage")({
    component: UsageAnalyticsPage
})

function UsageAnalyticsPage() {
    return <UsageDashboard />
}
