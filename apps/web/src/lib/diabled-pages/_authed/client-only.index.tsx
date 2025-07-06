import { createFileRoute } from "@tanstack/react-router";
import { TodoList } from "@/components/TodoListClient";

export const Route = createFileRoute("/_authed/client-only/")({
	component: RouteComponent,
});

function RouteComponent() {
	return <TodoList />;
}
