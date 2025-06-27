import { createFileRoute, Link } from "@tanstack/react-router";
import { DocumentErrorComponent } from "@/components/document-error";
import { NotFound } from "@/components/not-found";
import MinimalTiptap from "@/editor/components/custom/minimal-tiptap";
import { cn } from "@docsurf/ui/lib/utils";
import * as React from "react";
import content from "@/editor/data/content.json";

export const Route = createFileRoute("/_main/doc/$documentId")({
   errorComponent: DocumentErrorComponent,
   component: DocumentComponent,
   notFoundComponent: () => {
      return <NotFound>Document not found</NotFound>;
   },
});

function DocumentComponent() {
   // Only allow text/plain documents in the editor
   // if (document.documentType !== "text/plain") {
   //    return (
   //       <div className="grid h-full place-content-center">
   //          <p className="text-sm text-muted-foreground">{document.documentType} is not supported for editing.</p>
   //       </div>
   //    );
   // }

   // // Memoize the editor value for performance
   // const editorValue = React.useMemo(() => {
   //    if (document?.content && typeof document.content === "object" && Object.keys(document.content).length > 0) {
   //       return document.content;
   //    }
   //    return {};
   // }, [document?.content]);

   return (
      <div className="h-full">
         <MinimalTiptap
            value={content}
            throttleDelay={3000}
            className={cn("")}
            editorContentClassName=""
            registerInStore={true}
            output="json"
            onChange={(value) => {
               console.log("[Tiptap Editor] onChange", value);
            }}
            placeholder="Press Ctrl+SPACE for autocomplete..."
            editable={true}
            editorClassName="focus:outline-none px-8 py-4 min-h-full"
         />
      </div>
   );
}
