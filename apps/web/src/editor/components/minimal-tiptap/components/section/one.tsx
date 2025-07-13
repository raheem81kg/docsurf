import * as React from "react";
import { useEditorState, type Editor } from "@tiptap/react";
import type { Level } from "@tiptap/extension-heading";
import type { FormatAction } from "../../types";
import type { VariantProps } from "class-variance-authority";
import type { toggleVariants } from "@docsurf/ui/components/toggle";
import { cn } from "@docsurf/ui/lib/utils";
import { CaretDownIcon, LetterCaseCapitalizeIcon } from "@radix-ui/react-icons";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@docsurf/ui/components/dropdown-menu";
import { ToolbarButton } from "../toolbar-button";
import { ShortcutKey } from "../shortcut-key";
import { Button } from "@docsurf/ui/components/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@docsurf/ui/components/dialog";
import { getBlockBasedState, type EditType, type EditWithContent, type Placement } from "../../edit-utils";
import { isValidConfirmBlockChange } from "../../extensions/confirm-block-change";
// import { EditType, Placement } from "@/app/api/tiptap-ai-chat/apply-edits/route";
import { applySingleEditToEditor } from "../../extensions/apply-edit";
import { generateUUID } from "@docsurf/utils/generate-uuid";

interface TextStyle extends Omit<FormatAction, "value" | "icon" | "action" | "isActive" | "canExecute"> {
   element: keyof React.JSX.IntrinsicElements;
   level?: Level;
   className: string;
}

const formatActions: TextStyle[] = [
   {
      label: "Normal Text",
      element: "span",
      className: "grow",
      shortcuts: ["mod", "alt", "0"],
   },
   {
      label: "Heading 1",
      element: "h1",
      level: 1,
      className: "m-0 grow text-3xl font-extrabold",
      shortcuts: ["mod", "alt", "1"],
   },
   {
      label: "Heading 2",
      element: "h2",
      level: 2,
      className: "m-0 grow text-xl font-bold",
      shortcuts: ["mod", "alt", "2"],
   },
   {
      label: "Heading 3",
      element: "h3",
      level: 3,
      className: "m-0 grow text-lg font-semibold",
      shortcuts: ["mod", "alt", "3"],
   },
   {
      label: "Heading 4",
      element: "h4",
      level: 4,
      className: "m-0 grow text-base font-semibold",
      shortcuts: ["mod", "alt", "4"],
   },
   {
      label: "Heading 5",
      element: "h5",
      level: 5,
      className: "m-0 grow text-sm font-normal",
      shortcuts: ["mod", "alt", "5"],
   },
   {
      label: "Heading 6",
      element: "h6",
      level: 6,
      className: "m-0 grow text-sm font-normal",
      shortcuts: ["mod", "alt", "6"],
   },
];

interface SectionOneProps extends VariantProps<typeof toggleVariants> {
   editor: Editor;
   activeLevels?: Level[];
   isDocLocked?: boolean;
}

export const SectionOne: React.FC<SectionOneProps> = function SectionOne({
   editor,
   activeLevels = [1, 2, 3, 4, 5, 6],
   size,
   variant,
   isDocLocked,
}) {
   const editorState = useEditorState({
      editor,
      selector: ({ editor }: { editor: Editor }) => {
         const headingLevels: Record<number, boolean> = {};
         [1, 2, 3, 4, 5, 6].forEach((level) => {
            headingLevels[level] = editor.isActive("heading", { level });
         });
         return {
            isHeading: editor.isActive("heading"),
            isParagraph: editor.isActive("paragraph"),
            isCodeBlock: editor.isActive("codeBlock"),
            headingLevels,
         };
      },
   });
   const [dialogOpen, setDialogOpen] = React.useState(false);
   const filteredActions = formatActions.filter((action) => !action.level || activeLevels.includes(action.level));

   function handleStyleChange(level?: Level) {
      if (level) {
         editor.chain().focus().toggleHeading({ level }).run();
      } else {
         editor.chain().focus().setParagraph().run();
      }
   }

   function renderMenuItem({ label, element: Element, level, className, shortcuts }: TextStyle) {
      return (
         <DropdownMenuItem
            key={label}
            onClick={() => handleStyleChange(level)}
            className={cn("flex flex-row items-center justify-between gap-4", {
               "bg-accent": level ? editorState.headingLevels[level] : editorState.isParagraph,
               "cursor-not-allowed": isDocLocked,
            })}
            aria-label={label}
         >
            <Element className={className}>{label}</Element>
            <ShortcutKey keys={shortcuts} />
         </DropdownMenuItem>
      );
   }

   const blocks = getBlockBasedState(editor);

   if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      // console.log("[SectionOne] blocks:", blocks);
   }

   // Local state for staged edits
   const [blockEdits, setBlockEdits] = React.useState<EditWithContent[]>(() =>
      blocks.map((block) => ({
         id: block.id,
         content: block.content,
         editType: "replace" as EditType,
         placement: "in_place" as Placement,
         updateId: generateUUID(),
         range: {
            from: block.range.from,
            to: block.range.to,
         },
      }))
   );

   // Sync blockEdits with blocks if blocks change (e.g. after apply)
   React.useEffect(() => {
      setBlockEdits((prev) => {
         if (blocks.length === 0) return [];
         return blocks.map((block) => {
            const existing = prev.find((b) => b.id === block.id);
            return existing
               ? {
                    ...existing,
                    content: block.content,
                    range: {
                       from: block.range.from,
                       to: block.range.to,
                    },
                 }
               : {
                    id: block.id,
                    content: block.content,
                    editType: "replace" as EditType,
                    placement: "in_place" as Placement,
                    updateId: generateUUID(),
                    range: {
                       from: block.range.from,
                       to: block.range.to,
                    },
                 };
         });
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [blocks.length, blocks.map((b) => b.content).join("")]);

   // Handler for changing staged edits
   const handleEditChange = React.useCallback((idx: number, field: string, value: any) => {
      setBlockEdits((prev) => prev.map((edit, i) => (i === idx ? { ...edit, [field]: value } : edit)));
   }, []);

   // Apply single edit
   const handleApplyEdit = React.useCallback(
      (edit: EditWithContent) => {
         if (!editor || !edit) return;
         const blocks = getBlockBasedState(editor);
         applySingleEditToEditor(editor, edit, blocks);
      },
      [editor]
   );

   // const handleApplyAll = React.useCallback(() => {
   //    if (!editor || blockEdits.length === 0) return;
   //    const blocks = getBlockBasedState(editor);
   //    blockEdits.forEach((edit) => {
   //       if (edit.editType === ("insert" as EditType)) {
   //          // Handle insert
   //          const pos = edit.placement === ("after_block" as Placement) ? edit.range.to : edit.range.from;
   //          editor
   //             .chain()
   //             .focus()
   //             .insertContentAt(pos, {
   //                type: "confirmBlockChange",
   //                attrs: {
   //                   changeType: edit.editType,
   //                   originalContent: "",
   //                   newContent: edit.content,
   //                   blockId: edit.id,
   //                },
   //             })
   //             .run();
   //       } else if (edit.editType === ("remove" as EditType)) {
   //          // Handle remove
   //          editor.chain().focus().deleteRange(edit.range).run();
   //       } else {
   //          // Handle replace
   //          editor
   //             .chain()
   //             .focus()
   //             .deleteRange(edit.range)
   //             .insertContentAt(edit.range.from, {
   //                type: "confirmBlockChange",
   //                attrs: {
   //                   changeType: edit.editType,
   //                   originalContent: "",
   //                   newContent: edit.content,
   //                   blockId: edit.id,
   //                },
   //             })
   //             .run();
   //       }
   //    });
   // }, [editor, blockEdits]);

   return (
      <div className="flex items-center gap-2">
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <ToolbarButton
                  isActive={editorState.isHeading}
                  tooltip="Text styles"
                  aria-label="Text styles"
                  pressed={editorState.isHeading}
                  className="w-12"
                  disabled={editorState.isCodeBlock || isDocLocked}
                  size={size}
                  variant={variant}
                  disableHoverableContent
               >
                  <LetterCaseCapitalizeIcon className="size-5" />
                  <CaretDownIcon className="size-5" />
               </ToolbarButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-full">
               {filteredActions.map(renderMenuItem)}
            </DropdownMenuContent>
         </DropdownMenu>
         {/* {process.env.NODE_ENV === "development" && (
            <Button type="button" variant="outline" size="sm" onClick={() => setDialogOpen(true)} className="ml-1">
               Show Blocks
            </Button>
         )} */}
         <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-w-2xl">
               <DialogHeader>
                  <DialogTitle>Block-based State</DialogTitle>
                  <DialogDescription>Edit blocks below. Changes are applied immediately.</DialogDescription>
               </DialogHeader>
               <div className="max-h-[60vh] space-y-6 overflow-y-auto">
                  {blocks.length === 0 ? (
                     <div className="text-muted-foreground">No blocks found.</div>
                  ) : (
                     blocks.map((block, idx) => {
                        const edit = blockEdits[idx];
                        if (!edit) return null;
                        return (
                           <div key={edit.id} className="rounded border bg-muted/50 p-3">
                              <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                 <span className="font-mono">{block.id}</span> — <span>{block.type}</span>
                                 <select
                                    className="ml-2 rounded border px-1 py-0.5 text-xs"
                                    value={edit.editType}
                                    onChange={(e) =>
                                       handleEditChange(idx, "editType", e.target.value as "replace" | "insert" | "remove")
                                    }
                                 >
                                    <option value="replace">Replace</option>
                                    <option value="insert">Insert</option>
                                    <option value="remove">Remove</option>
                                 </select>
                                 {edit.editType === "insert" && (
                                    <select
                                       className="ml-2 rounded border px-1 py-0.5 text-xs"
                                       value={edit.placement}
                                       onChange={(e) =>
                                          handleEditChange(
                                             idx,
                                             "placement",
                                             e.target.value as "before_block" | "after_block" | "in_place"
                                          )
                                       }
                                    >
                                       <option value="before_block">Before</option>
                                       <option value="after_block">After</option>
                                    </select>
                                 )}
                              </div>
                              <textarea
                                 className="min-h-[60px] w-full rounded border bg-background p-2 font-mono text-xs"
                                 value={edit.content}
                                 onChange={(e) => handleEditChange(idx, "content", e.target.value)}
                                 readOnly={edit.editType === "remove"}
                                 spellCheck={false}
                              />
                              <div className="mt-1 text-xs text-muted-foreground">
                                 Range: {block.range.from} - {block.range.to}
                              </div>
                              <Button
                                 type="button"
                                 size="sm"
                                 className="mt-2"
                                 onClick={() => handleApplyEdit(edit)}
                                 disabled={isDocLocked}
                              >
                                 Apply Edit
                              </Button>
                           </div>
                        );
                     })
                  )}
               </div>
               <DialogFooter>
                  <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)} disabled={isDocLocked}>
                     Close
                  </Button>
               </DialogFooter>
            </DialogContent>
         </Dialog>
      </div>
   );
};

SectionOne.displayName = "SectionOne";

export default SectionOne;
