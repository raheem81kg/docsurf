import { Button } from "@docsurf/ui/components/button";
import { Input } from "@docsurf/ui/components/input";
import { Check, Settings, Trash2, X } from "lucide-react";
import type { FormEvent, PropsWithChildren } from "react";

export const UserProfile = ({
	user,
}: {
	user?: { name: string; image?: string | null; email: string } | null;
}) => {
	return (
		<div className="flex items-center space-x-2">
			{user?.image ? (
				<img
					src={user.image}
					alt={user.name}
					width={40}
					height={40}
					className="rounded-full"
				/>
			) : (
				<div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 font-medium text-orange-600 dark:bg-orange-900 dark:text-orange-200">
					{user?.name?.[0].toUpperCase()}
				</div>
			)}
			<div>
				<h1 className="font-medium">{user?.name}</h1>
				<p className="text-neutral-500 text-sm">{user?.email}</p>
			</div>
		</div>
	);
};

export const AppContainer = ({ children }: PropsWithChildren) => {
	return <div className="min-h-screen w-full space-y-8 p-4">{children}</div>;
};

export const AppHeader = ({ children }: PropsWithChildren) => {
	return (
		<header className="mx-auto flex max-w-2xl items-center justify-between">
			{children}
		</header>
	);
};

export const AppNav = ({ children }: PropsWithChildren) => {
	return <div className="flex items-center gap-2">{children}</div>;
};

export const SettingsButton = ({ children }: PropsWithChildren) => {
	return (
		<Button variant="ghost" size="sm" asChild>
			{children}
		</Button>
	);
};

export const SettingsButtonContent = () => {
	return (
		<div className="flex items-center gap-2">
			<Settings size={16} />
			Settings
		</div>
	);
};

export const AddTodoForm = ({
	action,
	onSubmit,
	disabled,
}: {
	action?: (formData: FormData) => Promise<void>;
	onSubmit?: (event: FormEvent<HTMLFormElement>) => Promise<void>;
	disabled?: boolean;
}) => {
	return (
		<form className="flex gap-2" action={action} onSubmit={onSubmit}>
			<Input
				name="text"
				placeholder="Add a new todo..."
				className="border-neutral-800 bg-neutral-900 text-neutral-100 placeholder:text-neutral-500"
				disabled={disabled}
			/>
			<Button type="submit" variant="secondary" disabled={disabled}>
				Add
			</Button>
		</form>
	);
};

export const TodoListContainer = ({ children }: PropsWithChildren) => {
	return (
		<main>
			<div className="mx-auto max-w-2xl space-y-6">{children}</div>
		</main>
	);
};

export const TodoCompleteButton = ({
	completed,
	type = "button",
	onClick,
}: {
	completed: boolean;
	type?: "button" | "submit";
	onClick?: () => any;
}) => (
	<Button
		variant="ghost"
		size="icon"
		type={type}
		className="text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
		onClick={onClick}
	>
		{completed ? (
			<Check size={16} className="text-green-500" />
		) : (
			<X size={16} />
		)}
	</Button>
);

export const TodoRemoveButton = ({ onClick }: { onClick: () => any }) => (
	<Button
		variant="ghost"
		size="icon"
		onClick={onClick}
		className="text-neutral-500 opacity-0 transition-opacity hover:bg-neutral-800 hover:text-red-400 group-hover:opacity-100"
	>
		<Trash2 size={16} />
	</Button>
);

export const TodoText = ({
	text,
	completed,
}: {
	text: string;
	completed: boolean;
}) => (
	<span
		className={
			completed
				? "flex-1 text-neutral-500 line-through"
				: "flex-1 text-neutral-100"
		}
	>
		{text}
	</span>
);

export const TodoItem = ({ children }: PropsWithChildren) => {
	return (
		<li className="group flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900/50 p-3 transition-colors hover:bg-neutral-900">
			{children}
		</li>
	);
};

export const TodoList = ({ children }: PropsWithChildren) => {
	return <ul className="space-y-3">{children}</ul>;
};

export const TodoEmptyState = () => {
	return (
		<p className="py-8 text-center text-neutral-500">
			No todos yet. Add one above!
		</p>
	);
};
