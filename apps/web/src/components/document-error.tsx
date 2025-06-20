import {
	ErrorComponent,
	type ErrorComponentProps,
} from "@tanstack/react-router";

export function DocumentErrorComponent({ error }: ErrorComponentProps) {
	return <ErrorComponent error={error} />;
}
