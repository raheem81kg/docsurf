import type { Id } from "@docsurf/backend/convex/_generated/dataModel";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ProjectStore {
   selectedProjectId: Id<"projects"> | null;
   setSelectedProject: (projectId: Id<"projects"> | null) => void;
   expandedFolderId: Id<"projects"> | null; // Only one folder can be expanded at a time
   setExpandedFolder: (folderId: Id<"projects"> | null) => void;
}

export const useProjectStore = create<ProjectStore>()(
   persist(
      (set, get) => ({
         selectedProjectId: null,
         setSelectedProject: (projectId) => set({ selectedProjectId: projectId }),
         expandedFolderId: null,
         setExpandedFolder: (folderId) => set({ expandedFolderId: folderId }),
      }),
      {
         name: "project-selection",
         partialize: (state) => ({
            selectedProjectId: state.selectedProjectId,
            expandedFolderId: state.expandedFolderId,
         }),
      }
   )
);
