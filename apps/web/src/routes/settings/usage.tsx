import { UsageDashboard } from "@/components/usage-dashboard";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/settings/usage")({
   ssr: false,
   component: UsageAnalyticsPage,
});

function UsageAnalyticsPage() {
   return <UsageDashboard />;
}
