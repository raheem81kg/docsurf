import OrderedMap from "orderedmap";
import { Schema, type Node as ProsemirrorNode, type MarkSpec, DOMParser } from "@tiptap/pm/model";
import { schema } from "@tiptap/pm/schema-basic";
import { addListNodes } from "@tiptap/pm/schema-list";
import { EditorState } from "@tiptap/pm/state";
import { EditorView } from "@tiptap/pm/view";
import React, { useEffect, useRef } from "react";
import { renderToString } from "react-dom/server";
import ReactMarkdown from "react-markdown";

import { diffEditor, DiffType } from "./lib/diff";

const diffSchema = new Schema({
   nodes: addListNodes(schema.spec.nodes, "paragraph block*", "block"),
   marks: OrderedMap.from({
      ...schema.spec.marks.toObject(),
      diffMark: {
         attrs: { type: { default: "" } },
         toDOM(mark) {
            let className = "";

            switch (mark.attrs.type) {
               case DiffType.Inserted:
                  className = "bg-green-100 text-green-700 dark:bg-green-500/70 dark:text-green-300";
                  break;
               case DiffType.Deleted:
                  className = "bg-red-100 line-through text-red-600 dark:bg-red-500/70 dark:text-red-300";
                  break;
               default:
                  className = "";
            }
            return ["span", { class: className }, 0];
         },
      } as MarkSpec,
   }),
});

function computeDiff(oldDoc: ProsemirrorNode, newDoc: ProsemirrorNode) {
   return diffEditor(diffSchema, oldDoc.toJSON(), newDoc.toJSON());
}

/**
 * DiffView: Shows the updated HTML content (newContent) only. The oldContent prop is now always empty.
 * This is used for update proposals where only the new content is returned by the tool.
 *
 * Props:
 * - oldContent: string (will be empty)
 * - newContent: string (the updated HTML to display)
 */
type DiffEditorProps = {
   /**
    * The old content (will be empty for update proposals)
    */
   oldContent: string;
   /**
    * The new content (updated HTML to display)
    */
   newContent: string;
};

export const DiffView = ({ oldContent, newContent }: DiffEditorProps) => {
   const editorRef = useRef<HTMLDivElement>(null);
   const viewRef = useRef<EditorView | null>(null);

   useEffect(() => {
      if (editorRef.current && !viewRef.current) {
         const parser = DOMParser.fromSchema(diffSchema);

         const oldHtmlContent = renderToString(<ReactMarkdown>{String(oldContent ?? "")}</ReactMarkdown>);
         const newHtmlContent = renderToString(<ReactMarkdown>{String(newContent ?? "")}</ReactMarkdown>);

         const oldContainer = document.createElement("div");
         oldContainer.innerHTML = oldHtmlContent;

         const newContainer = document.createElement("div");
         newContainer.innerHTML = newHtmlContent;

         const oldDoc = parser.parse(oldContainer);
         const newDoc = parser.parse(newContainer);

         const diffedDoc = computeDiff(oldDoc, newDoc);

         const state = EditorState.create({
            doc: diffedDoc,
            plugins: [],
         });

         viewRef.current = new EditorView(editorRef.current, {
            state,
            editable: () => false,
         });
      }

      return () => {
         if (viewRef.current) {
            viewRef.current.destroy();
            viewRef.current = null;
         }
      };
   }, [oldContent, newContent]);

   return <div className="diff-editor" ref={editorRef} />;
};
