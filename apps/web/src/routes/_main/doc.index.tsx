import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_main/doc/")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Hello "/_doc/doc"!</div>;
}
