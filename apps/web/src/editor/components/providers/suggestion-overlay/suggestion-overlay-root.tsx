"use client";

import { useEditorRefStore } from "@/store/use-editor-ref-store";
import { useSuggestionOverlayStore } from "@/store/use-suggestion-overlay-store";
import SuggestionOverlay from "./suggestion-overlay";
import { api } from "@docsurf/backend/convex/_generated/api";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { useCurrentDocument } from "@/components/sandbox/left/_tree_components/SortableTree";
import { useConvexTree } from "@/components/sandbox/left/_tree_components/use-convex-tree";

export function SuggestionOverlayRoot() {
   const { data: user } = useQuery(convexQuery(api.auth.getCurrentUser, {}));
   const workspaceId = user?.workspaces?.[0]?.workspace?._id;
   const { doc } = useCurrentDocument(user);
   const { isLoading: isTreeLoading } = useConvexTree({ workspaceId });
   const editor = useEditorRefStore((state) => state.editor);
   const { isOpen, selectedText, position, selectionRange, closeSuggestionOverlay, handleAcceptSuggestion, setSuggestionIsLoading } =
      useSuggestionOverlayStore();

   if (!doc?._id || isTreeLoading) return null;

   return (
      <SuggestionOverlay
         documentId={doc._id}
         workspaceId={workspaceId ?? ""}
         isOpen={isOpen}
         onClose={closeSuggestionOverlay}
         selectedText={selectedText}
         position={position}
         onAcceptSuggestion={(suggestion) =>
            handleAcceptSuggestion({
               suggestion,
               docId: doc._id,
               editor,
               selectionRange,
               selectedText,
               onClose: closeSuggestionOverlay,
            })
         }
         editor={editor}
         from={selectionRange?.from}
         to={selectionRange?.to}
         userId={user?._id}
         setSuggestionIsLoading={setSuggestionIsLoading}
      />
   );
}

export default SuggestionOverlayRoot;
