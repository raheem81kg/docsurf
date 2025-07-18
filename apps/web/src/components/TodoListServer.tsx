import { getCookieName } from "@convex-dev/better-auth/react-start";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@docsurf/backend/convex/_generated/api";
import type { Id } from "@docsurf/backend/convex/_generated/dataModel";
import { createAuth } from "@docsurf/backend/convex/auth_create";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { ConvexHttpClient } from "convex/browser";
import {
   AddTodoForm,
   TodoCompleteButton,
   TodoEmptyState,
   TodoItem,
   TodoList as TodoListComponent,
   TodoListContainer,
   TodoRemoveButton,
   TodoText,
} from "@/components/server";
import { env } from "@/env";

const getToken = async () => {
   const sessionCookieName = await getCookieName(createAuth);
   return getCookie(sessionCookieName);
};

function setupClient(token?: string) {
   const client = new ConvexHttpClient(env.VITE_CONVEX_URL);
   if (token) {
      client.setAuth(token);
   }
   return client;
}

// Handle form data
export const toggleCompletedTodo = createServerFn({ method: "POST" })
   .validator((data) => {
      if (!(data instanceof FormData)) {
         throw new Error("Invalid form data");
      }
      const id = data.get("id");
      if (!id) {
         throw new Error("Todo id is required");
      }
      return {
         id: id.toString(),
      };
   })
   .handler(async ({ data: { id } }) => {
      const token = await getToken();
      await setupClient(token).mutation(api.todos.toggle, {
         id: id as Id<"todos">,
      });
   });

export const removeTodo = createServerFn({ method: "POST" })
   .validator((data: { id: string }) => {
      if (!data.id) {
         throw new Error("Todo id is required");
      }
      return data;
   })
   .handler(async ({ data: { id } }) => {
      const token = await getToken();
      await setupClient(token).mutation(api.todos.remove, {
         id: id as Id<"todos">,
      });
   });

export const addTodo = createServerFn({ method: "POST" })
   .validator((data) => {
      if (!(data instanceof FormData)) {
         throw new Error("Invalid form data");
      }
      const text = data.get("text");
      if (!text) {
         throw new Error("Todo text is required");
      }
      return {
         text: text.toString(),
      };
   })
   .handler(async ({ data: { text } }) => {
      const token = await getToken();
      await setupClient(token).mutation(api.todos.create, { text });
   });

export const TodoList = () => {
   const { data: todos } = useSuspenseQuery(convexQuery(api.todos.get, {}));

   return (
      <TodoListContainer>
         <AddTodoForm
            onSubmit={async (event) => {
               event.preventDefault();
               const formData = new FormData(event.currentTarget);
               await addTodo({ data: formData });
               (event.target as HTMLFormElement).reset();
            }}
         />

         {todos.length === 0 && <TodoEmptyState />}

         <TodoListComponent>
            {todos.map((todo) => (
               <TodoItem key={todo._id}>
                  <form
                     onSubmit={async (event) => {
                        event.preventDefault();
                        const formData = new FormData(event.currentTarget);
                        const response = await toggleCompletedTodo({ data: formData });
                     }}
                  >
                     <input type="hidden" name="id" value={todo._id} />
                     <TodoCompleteButton completed={todo.completed} type="submit" />
                  </form>

                  <TodoText text={todo.text} completed={todo.completed} />

                  <TodoRemoveButton onClick={() => removeTodo({ data: { id: todo._id } })} />
               </TodoItem>
            ))}
         </TodoListComponent>
      </TodoListContainer>
   );
};
