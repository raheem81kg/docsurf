import { createFileRoute, Link } from "@tanstack/react-router";
import { DocumentErrorComponent } from "@/components/document-error";
import { NotFound } from "@/components/not-found";

const fetchPost = async ({ data: documentId }: { data: string }) => {
	return {
		id: documentId,
		title: "Document 1",
		body: "This is the body of document 1",
	}
};

export const Route = createFileRoute("/_main/doc/$documentId")({
	loader: ({ params: { documentId } }) => fetchPost({ data: documentId }),
	errorComponent: DocumentErrorComponent,
	component: DocumentComponent,
	notFoundComponent: () => {
		return <NotFound>Document not found</NotFound>;
	},
});

function DocumentComponent() {
	const document = Route.useLoaderData();

	return (
		<div className="space-y-2">
			<h4 className="font-bold text-xl underline">{document.title}</h4>
			<div className="text-sm">{document.body}</div>
			<Link
				to="/doc/$documentId"
				params={{
					documentId: document.id,
				}}
				activeProps={{ className: "text-black font-bold" }}
				className="inline-block py-1 text-blue-800 hover:text-blue-600"
			>
				Deep View
			</Link>
		</div>
	)
}
