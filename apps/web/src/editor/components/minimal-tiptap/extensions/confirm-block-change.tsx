/**
 * ConfirmBlockChange extension for TipTap
 * Handles block-level changes that require user confirmation before applying them to the document.
 * Supports three types of changes: replace, insert, and remove.
 */
/** biome-ignore-all lint/a11y/useSemanticElements: <explanation> */
import { Node, mergeAttributes, ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import * as React from "react";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { NodeSelection, TextSelection } from "@tiptap/pm/state";
import { GapCursor } from "@tiptap/pm/gapcursor";
import DOMPurify from "dompurify";
import { DOMParser as ProseMirrorDOMParser } from "@tiptap/pm/model";
import { motion, AnimatePresence } from "motion/react";
import type { Editor } from "@tiptap/react";
import type { ReactNodeViewProps } from "@tiptap/react";
import debounce from "lodash/debounce";

// Add command type declarations
declare module "@tiptap/core" {
   interface Commands<ReturnType> {
      confirmBlockChange: {
         acceptBlockChange: (pos: number) => ReturnType;
         rejectBlockChange: (pos: number) => ReturnType;
      };
   }
}

// Types
export interface ConfirmBlockChangeAttrs {
   changeType: "replace" | "insert" | "remove";
   originalContent: string;
   newContent: string;
   blockId: string;
   updateId: string;
}

interface ConfirmBlockChangeProps {
   node: { attrs: ConfirmBlockChangeAttrs; nodeSize: number };
   getPos: () => number;
   editor: Editor;
}

interface ConfirmBlockChangeOptions {
   minContentLength: number;
   animationDuration: number;
   buttonPlacement: "bottom-right" | "inline";
}

// Constants
const DEFAULT_OPTIONS: ConfirmBlockChangeOptions = {
   minContentLength: 1,
   animationDuration: 0.225,
   buttonPlacement: "bottom-right",
};

// Styles
const styles = {
   block: {
      base: "relative w-full m-0 p-0 transition-colors duration-200 mb-2.5 p-[2px] rounded-[4px]",
      remove: "bg-red-600/19",
      insert: "bg-green-600/19",
   },
   buttonGroup: {
      base: (placement: ConfirmBlockChangeOptions["buttonPlacement"]) =>
         placement === "bottom-right"
            ? "absolute bottom-2 right-0 z-10 flex ml-auto mr-4 translate-y-full gap-1 bg-border/60 p-1 rounded-[4px] w-fit"
            : "flex gap-1 bg-border/65 p-1 rounded-[2px] w-fit mt-2",
      accept:
         "px-[5px] py-[1.5px] rounded-[2px] text-white hover:bg-green-600/95 bg-green-600/77 transition-colors duration-200 text-sm font-medium flex items-center gap-1 focus:outline-none border-l border-green-400 w-1/2 sm:w-auto",
      reject:
         "px-[5px] py-[1.5px] rounded-[2px] text-white hover:bg-red-700/95 bg-red-700/77 transition-colors duration-200 text-sm font-medium flex items-center gap-1 focus:outline-none w-1/2 sm:w-auto",
   },
   icon: {
      base: "absolute right-[-1rem] top-1/2 -translate-y-1/2 text-xl font-bold select-none pointer-events-none",
      remove: "text-red-500",
      insert: "text-green-500",
   },
} as const;

// Utility functions
const getTextLength = (html: string) => html.replace(/<[^>]+>/g, "").trim().length;

const getPlainText = (html: string) =>
   html
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, "")
      .trim();

// Content parsing utility
const parseContent = (content: string, schema: any) => {
   const parser = ProseMirrorDOMParser.fromSchema(schema);
   const element = document.createElement("div");
   element.innerHTML = DOMPurify.sanitize(content);
   return parser.parseSlice(element);
};

// Action buttons component
const ActionButtons: React.FC<{
   onAction: (action: "accept" | "reject") => void;
   buttonPlacement: ConfirmBlockChangeOptions["buttonPlacement"];
   animationDuration: number;
}> = ({ onAction, buttonPlacement, animationDuration }) => (
   <motion.div
      className={styles.buttonGroup.base(buttonPlacement)}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
         end: { duration: 0.15, ease: [0.4, 0, 0.2, 1] },
      }}
      role="group"
      aria-label="Review actions"
   >
      <button
         className={styles.buttonGroup.accept}
         onClick={() => onAction("accept")}
         aria-label="Accept change"
         tabIndex={0}
         type="button"
      >
         Accept
      </button>
      <button
         className={styles.buttonGroup.reject}
         onClick={() => onAction("reject")}
         aria-label="Reject change"
         tabIndex={0}
         type="button"
      >
         Reject
      </button>
   </motion.div>
);

// Content block component
const ContentBlock: React.FC<{
   content: string;
   isEditable?: boolean;
   ref?: React.RefObject<HTMLDivElement | null>;
   className: string;
   icon: string;
}> = React.forwardRef<
   HTMLDivElement,
   {
      content: string;
      isEditable?: boolean;
      className: string;
      icon: string;
   }
>(({ content, isEditable, className, icon }, ref) => (
   <>
      <div
         ref={ref}
         contentEditable={isEditable}
         className={`${className} outline-none w-full [&:not(:read-only)]:autocapitalize-none [&:not(:read-only)]:autocorrect-none [&:not(:read-only)]:autocomplete-none`}
         suppressContentEditableWarning={isEditable}
         // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
         dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
         spellCheck="false"
      />
      <span className={`${styles.icon.base} ${icon}`} aria-hidden="true">
         {icon === styles.icon.remove ? "–" : "+"}
      </span>
   </>
));

// Main component
const ConfirmBlockChangeComponent: React.FC<ReactNodeViewProps<HTMLElement>> = ({ node, getPos, editor }) => {
   const { changeType, originalContent, newContent } = node.attrs as ConfirmBlockChangeAttrs;
   const options = editor.extensionManager.extensions.find((ext) => ext.name === "confirmBlockChange")
      ?.options as ConfirmBlockChangeOptions;

   // Sanitize HTML for security
   const safeOriginalContent = React.useMemo(() => DOMPurify.sanitize(originalContent), [originalContent]);
   const safeNewContent = React.useMemo(() => DOMPurify.sanitize(newContent), [newContent]);

   // Refs and state
   const editableRef = React.useRef<HTMLDivElement>(null);
   const [isVisible, setIsVisible] = React.useState(true);
   const [pendingAction, setPendingAction] = React.useState<"accept" | "reject" | null>(null);

   // Combined action handler
   const handleAction = React.useCallback((action: "accept" | "reject") => {
      setPendingAction(action);
      setIsVisible(false);
   }, []);

   // Editor mutation logic
   const performAction = React.useCallback(() => {
      if (!pendingAction) return;
      const pos = getPos();

      const applyContent = (content: string) => {
         try {
            const slice = parseContent(content, editor.state.schema);
            editor
               .chain()
               .focus()
               .deleteRange({ from: pos, to: pos + node.nodeSize })
               .insertContentAt(pos, slice.content.toJSON())
               .setTextSelection(pos + slice.content.size)
               .scrollIntoView()
               .run();
         } catch (e) {
            editor
               .chain()
               .focus()
               .deleteRange({ from: pos, to: pos + node.nodeSize })
               .insertContentAt(pos, content.replace(/<[^>]+>/g, ""))
               .setTextSelection(pos)
               .scrollIntoView()
               .run();
         }
      };

      if (pendingAction === "accept") {
         if (changeType === "replace" || changeType === "insert") {
            const htmlToInsert = editableRef.current?.innerHTML || newContent;
            applyContent(htmlToInsert);
         } else if (changeType === "remove") {
            editor
               .chain()
               .focus()
               .deleteRange({ from: pos, to: pos + node.nodeSize })
               .setTextSelection(pos)
               .scrollIntoView()
               .run();
         }
      } else if (pendingAction === "reject") {
         if (changeType === "replace") {
            applyContent(originalContent);
         } else if (changeType === "insert") {
            editor
               .chain()
               .focus()
               .deleteRange({ from: pos, to: pos + node.nodeSize })
               .setTextSelection(pos)
               .scrollIntoView()
               .run();
         } else if (changeType === "remove") {
            applyContent(originalContent);
         }
      }

      setPendingAction(null);
   }, [pendingAction, getPos, editor, changeType, newContent, originalContent, node.nodeSize]);

   // Auto-reject on empty content with debounce
   React.useEffect(() => {
      if (!editableRef.current) return;
      const node = editableRef.current;

      const checkContent = debounce(() => {
         const text = node.innerText.replace(/\s+/g, "").trim();
         if (text.length === 0) {
            handleAction("reject");
         }
      }, 300);

      const observer = new MutationObserver(checkContent);
      observer.observe(node, {
         childList: true,
         subtree: true,
         characterData: true,
      });

      return () => {
         observer.disconnect();
         checkContent.cancel();
      };
   }, [handleAction]);

   // Early return if content is too short
   if (getTextLength(originalContent) < options.minContentLength && getTextLength(newContent) < options.minContentLength) {
      return null;
   }

   const isRemove = changeType === "remove";
   const isInsert = changeType === "insert";
   const isReplace = changeType === "replace";

   // Render replace (diff) view
   if (isReplace) {
      return (
         <NodeViewWrapper
            className="pending-change-container not-prose ProseMirror-widget rounded-[4px]"
            contentEditable={false}
            // biome-ignore lint/a11y/useSemanticElements: <explanation>
            role="region"
            aria-label="Review block change: replacement"
            tabIndex={0}
            style={{ background: "none", border: "none", padding: 0 }}
         >
            <AnimatePresence mode="wait" onExitComplete={performAction}>
               {isVisible && (
                  <>
                     <motion.section
                        key="replace-old"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{
                           end: { duration: 0.15, ease: [0.4, 0, 0.2, 1] },
                        }}
                        className={`${styles.block.base} ${styles.block.remove} relative mb-1`}
                        aria-label="Original content to be replaced"
                        contentEditable={false}
                     >
                        <ContentBlock content={safeOriginalContent} className="outline-none w-full" icon={styles.icon.remove} />
                     </motion.section>
                     <motion.section
                        key="replace-new"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{
                           end: { duration: 0.15, ease: [0.4, 0, 0.2, 1] },
                        }}
                        className={`${styles.block.base} ${styles.block.insert} relative`}
                        aria-label="Replacement content"
                     >
                        <ContentBlock
                           content={safeNewContent}
                           isEditable={true}
                           ref={editableRef}
                           className="outline-none w-full"
                           icon={styles.icon.insert}
                        />
                        <ActionButtons
                           onAction={handleAction}
                           buttonPlacement={options.buttonPlacement}
                           animationDuration={options.animationDuration}
                        />
                     </motion.section>
                  </>
               )}
            </AnimatePresence>
         </NodeViewWrapper>
      );
   }

   // Render insert/remove view
   return (
      <NodeViewWrapper
         className={`pending-change-container not-prose ProseMirror-widget rounded-[4px] ${
            isRemove ? "pending-change-delete" : "pending-change-insert"
         }`}
         contentEditable={false}
         role="region"
         aria-label={`Review block change: ${isRemove ? "removal" : "insertion"}`}
         tabIndex={0}
         style={{ background: "none", border: "none", padding: 0 }}
      >
         <AnimatePresence mode="wait" onExitComplete={performAction}>
            {isVisible && (
               <motion.section
                  key={isRemove ? "remove" : "insert"}
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{
                     end: { duration: 0.15, ease: [0.4, 0, 0.2, 1] },
                  }}
                  className={`${styles.block.base} ${isRemove ? styles.block.remove : styles.block.insert} relative`}
               >
                  <ContentBlock
                     content={isRemove ? safeOriginalContent : safeNewContent}
                     isEditable={isInsert}
                     ref={isInsert ? editableRef : undefined}
                     className="outline-none w-full"
                     icon={isRemove ? styles.icon.remove : styles.icon.insert}
                  />
                  <ActionButtons
                     onAction={handleAction}
                     buttonPlacement={options.buttonPlacement}
                     animationDuration={options.animationDuration}
                  />
               </motion.section>
            )}
         </AnimatePresence>
      </NodeViewWrapper>
   );
};

// Validation utility
export function isValidConfirmBlockChange({
   originalContent,
   newContent,
   changeType,
   minContentLength = DEFAULT_OPTIONS.minContentLength,
}: {
   originalContent: string;
   newContent: string;
   changeType: string;
   minContentLength?: number;
}): boolean {
   if (changeType === "replace") {
      if (getTextLength(originalContent) < minContentLength || getTextLength(newContent) < minContentLength) return false;
      if (getPlainText(originalContent) === getPlainText(newContent)) return false;
      return true;
   }
   if (changeType === "insert") {
      return getTextLength(newContent) >= minContentLength;
   }
   if (changeType === "remove") {
      return getTextLength(originalContent) >= minContentLength;
   }
   return false;
}

// Node extension
export const ConfirmBlockChange = Node.create<ConfirmBlockChangeOptions>({
   name: "confirmBlockChange",
   group: "block",
   atom: false,
   inline: false,
   selectable: false,
   draggable: false,
   marks: "",
   allowGapCursor: true,

   addOptions() {
      return {
         minContentLength: DEFAULT_OPTIONS.minContentLength,
         animationDuration: DEFAULT_OPTIONS.animationDuration,
         buttonPlacement: DEFAULT_OPTIONS.buttonPlacement,
      };
   },

   addAttributes() {
      return {
         changeType: { default: "replace" },
         originalContent: { default: "" },
         newContent: { default: "" },
         blockId: { default: "" },
         updateId: { default: "" },
      };
   },

   parseHTML() {
      return [{ tag: "confirm-block-change" }];
   },

   renderHTML({ HTMLAttributes }) {
      return ["confirm-block-change", mergeAttributes(HTMLAttributes)];
   },

   addNodeView() {
      return ReactNodeViewRenderer(ConfirmBlockChangeComponent);
   },

   addCommands() {
      return {
         acceptBlockChange:
            (pos: number) =>
            ({
               tr,
               dispatch,
            }: {
               tr: import("@tiptap/pm/state").Transaction;
               dispatch?: (tr: import("@tiptap/pm/state").Transaction) => void;
            }) => {
               if (dispatch) {
                  const node = tr.doc.nodeAt(pos);
                  if (node?.type.name === "confirmBlockChange") {
                     const { changeType, originalContent, newContent } = node.attrs;

                     if (changeType === "replace" || changeType === "insert") {
                        const slice = parseContent(newContent, this.editor.state.schema);
                        tr.replaceWith(pos, pos + node.nodeSize, slice.content).setSelection(
                           TextSelection.create(tr.doc, pos + slice.content.size)
                        );
                     } else if (changeType === "remove") {
                        tr.delete(pos, pos + node.nodeSize).setSelection(TextSelection.create(tr.doc, pos));
                     }

                     return true;
                  }
               }
               return false;
            },

         rejectBlockChange:
            (pos: number) =>
            ({
               tr,
               dispatch,
            }: {
               tr: import("@tiptap/pm/state").Transaction;
               dispatch?: (tr: import("@tiptap/pm/state").Transaction) => void;
            }) => {
               if (dispatch) {
                  const node = tr.doc.nodeAt(pos);
                  if (node?.type.name === "confirmBlockChange") {
                     const { originalContent } = node.attrs;
                     const slice = parseContent(originalContent, this.editor.state.schema);

                     tr.replaceWith(pos, pos + node.nodeSize, slice.content).setSelection(
                        TextSelection.create(tr.doc, pos + slice.content.size)
                     );

                     return true;
                  }
               }
               return false;
            },
      } as Partial<import("@tiptap/core").RawCommands>;
   },

   addProseMirrorPlugins() {
      const pluginKey = new PluginKey("confirmBlockChange");

      return [
         new Plugin({
            key: pluginKey,
            props: {
               handleKeyDown(view, event) {
                  const { state, dispatch } = view;
                  const { selection, doc, schema } = state;
                  const pos = selection.from;

                  // Handle NodeSelection on confirmBlockChange
                  if (
                     (event.key === "Backspace" || event.key === "Delete") &&
                     selection instanceof NodeSelection &&
                     selection.node.type.name === "confirmBlockChange"
                  ) {
                     const node = selection.node;
                     const originalContent = node.attrs.originalContent;
                     try {
                        const slice = parseContent(originalContent, schema);
                        dispatch(state.tr.replaceWith(pos, pos + node.nodeSize, slice.content));
                        return true;
                     } catch (e) {
                        dispatch(
                           state.tr.replaceWith(
                              pos,
                              pos + node.nodeSize,
                              schema.node("paragraph", undefined, schema.text(originalContent.replace(/<[^>]+>/g, "")))
                           )
                        );
                        return true;
                     }
                  }

                  // Handle text selection before confirmBlockChange
                  if (
                     (event.key === "Backspace" || event.key === "Delete") &&
                     selection.empty &&
                     !!doc.nodeAt(pos) &&
                     doc.nodeAt(pos)?.type?.name === "confirmBlockChange"
                  ) {
                     dispatch(state.tr.setSelection(new GapCursor(doc.resolve(pos))));
                     return true;
                  }

                  return false;
               },
            },
         }),
      ];
   },
});

export default ConfirmBlockChange;
