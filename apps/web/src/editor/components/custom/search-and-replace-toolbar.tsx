"use client";

import { ArrowLeft, ArrowRight, Repeat, X } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { motion } from "motion/react";

import { Button } from "@docsurf/ui/components/button";
import { Checkbox } from "@docsurf/ui/components/checkbox";
import { Input } from "@docsurf/ui/components/input";
import { Label } from "@docsurf/ui/components/label";
import { Separator } from "@docsurf/ui/components/separator";
import { cn } from "@docsurf/ui/lib/utils";
import type { SearchAndReplaceStorage } from "../minimal-tiptap/extensions/custom/search-and-replace";
import { useEditorState, type Editor } from "@tiptap/react";

export function SearchAndReplaceToolbar({ editor }: { editor: Editor }) {
   const editorState = useEditorState({
      editor,
      selector: (context) => ({
         results: context.editor.storage.searchAndReplace.results,
         selectedResult: context.editor.storage.searchAndReplace.selectedResult,
      }),
   });

   const [replacing, setReplacing] = useState(false);
   const [searchText, setSearchText] = useState("");
   const [replaceText, setReplaceText] = useState("");
   const [checked, setChecked] = useState(false);
   const searchInputRef = useRef<HTMLInputElement>(null);

   const results = editorState?.results as SearchAndReplaceStorage["results"];
   const selectedResult = editorState?.selectedResult as SearchAndReplaceStorage["selectedResult"];

   const replace = () => editor?.chain().replace().run();
   const replaceAll = () => {
      editor?.chain().replaceAll().run();
      // After replace all, re-trigger search to update match count
      editor?.chain().setSearchTerm(searchText).run();
   };
   const selectNext = () => editor?.chain().selectNextResult().run();
   const selectPrevious = () => editor?.chain().selectPreviousResult().run();

   useEffect(() => {
      editor?.chain().setSearchTerm(searchText).run();
   }, [searchText, editor]);

   useEffect(() => {
      editor?.chain().setReplaceTerm(replaceText).run();
   }, [replaceText, editor]);

   useEffect(() => {
      editor?.chain().setCaseSensitive(checked).run();
   }, [checked, editor]);

   useEffect(() => {
      if (!replacing && searchInputRef.current) {
         searchInputRef.current.focus();
      }
   }, [replacing]);

   // Clear search/replace on close and on unmount
   const handleClose = () => {
      setSearchText("");
      setReplaceText("");
      editor?.chain().setSearchTerm("").run();
      editor?.chain().setReplaceTerm("").run();
      const event = new CustomEvent("closeSearchReplacePanel");
      window.dispatchEvent(event);
   };

   useEffect(() => {
      return () => {
         // Cleanup on unmount
         setSearchText("");
         setReplaceText("");
         editor?.chain().setSearchTerm("").run();
         editor?.chain().setReplaceTerm("").run();
      };
   }, [editor]);

   return (
      <motion.div
         key="search-replace-panel"
         initial={{ x: 400, opacity: 0 }}
         animate={{ x: 0, opacity: 1 }}
         exit={{ x: 400, opacity: 0 }}
         transition={{ type: "spring", stiffness: 400, damping: 40 }}
         className={cn(
            "fixed z-50 top-6 right-6 rounded-lg border border-border bg-background shadow-lg px-2 py-2.5 flex flex-col gap-2",
            "select-none"
         )}
         style={{ pointerEvents: "auto" }}
      >
         {!replacing ? (
            <div className={cn("relative flex gap-1.5 items-center")}>
               <Input
                  ref={searchInputRef}
                  value={searchText}
                  className="w-48"
                  onChange={(e) => {
                     setSearchText(e.target.value);
                  }}
                  placeholder="Search..."
               />
               <span className="pl-1">
                  {results?.length === 0 ? selectedResult : selectedResult + 1}/{results?.length}
               </span>
               <Button onClick={selectPrevious} size="icon" variant="ghost" className="size-7">
                  <ArrowLeft className="size-4" />
               </Button>
               <Button onClick={selectNext} size="icon" className="size-7" variant="ghost">
                  <ArrowRight className="h-4 w-4" />
               </Button>
               <Separator orientation="vertical" className="!min-h-7 mx-0.5 min-w-[1px] !bg-border" />
               <Button
                  onClick={() => {
                     setReplacing(true);
                  }}
                  size="icon"
                  className="size-7"
                  variant="ghost"
               >
                  <Repeat className="h-4 w-4" />
               </Button>
               <Button onClick={handleClose} size="icon" className="size-7" variant="ghost">
                  <X className="h-4 w-4" />
               </Button>
            </div>
         ) : (
            <div className={cn("relative w-full")}>
               <X onClick={handleClose} className="absolute right-3 top-3 h-4 w-4 cursor-pointer" />
               <div className="flex w-full items-center gap-3">
                  <Button
                     size="icon"
                     className="size-7 rounded-full"
                     variant="ghost"
                     onClick={() => {
                        setReplacing(false);
                     }}
                  >
                     <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="text-sm font-medium">Search and replace</h2>
               </div>

               <div className="my-2 w-full">
                  <div className="mb-3">
                     <Label className="mb-1 text-xs text-gray-11">Search</Label>
                     <Input
                        ref={searchInputRef}
                        value={searchText}
                        onChange={(e) => {
                           setSearchText(e.target.value);
                        }}
                        placeholder="Search..."
                     />
                     {results?.length === 0 ? selectedResult : selectedResult + 1}/{results?.length}
                  </div>
                  <div className="mb-2">
                     <Label className="mb-1 text-xs text-gray-11">Replace with</Label>
                     <Input
                        className="w-full"
                        value={replaceText}
                        onChange={(e) => {
                           setReplaceText(e.target.value);
                        }}
                        placeholder="Replace..."
                     />
                  </div>
                  <div className="mt-3 flex items-center space-x-2">
                     <Checkbox
                        checked={checked}
                        onCheckedChange={(checked: boolean) => {
                           setChecked(checked);
                        }}
                        id="match_case"
                     />
                     <Label
                        htmlFor="match_case"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                     >
                        Match case
                     </Label>
                  </div>
               </div>

               <div className="actions mt-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <Button onClick={selectPrevious} size="icon" className="h-7 w-7" variant="secondary">
                        <ArrowLeft className="h-4 w-4" />
                     </Button>
                     <Button onClick={selectNext} size="icon" className="h-7 w-7" variant="secondary">
                        <ArrowRight className="h-4 w-4" />
                     </Button>
                  </div>

                  <div className="main-actions flex items-center gap-2">
                     <Button size="sm" className="h-7 px-3 text-xs" variant="secondary" onClick={replaceAll}>
                        Replace All
                     </Button>
                     <Button onClick={replace} size="sm" className="h-7 px-3 text-xs">
                        Replace
                     </Button>
                  </div>
               </div>
            </div>
         )}
      </motion.div>
   );
}
