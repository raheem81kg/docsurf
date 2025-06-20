import { MINUTE, RateLimiter } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";

export const rateLimiter = new RateLimiter(components.rateLimiter, {
	// Limit how fast a user can add a new todo.
	addTodo: { kind: "token bucket", rate: 10, period: MINUTE, capacity: 3 },

	// Limit how fast a user can mutate (toggle, delete) todos.
	mutateTodo: { kind: "token bucket", rate: 20, period: MINUTE, capacity: 5 },
});
