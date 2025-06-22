import { type ProjectColorId, getProjectColorClasses } from "./lib/project-constants";
import { cn } from "@docsurf/ui/lib/utils";
import { useLocation } from "@tanstack/react-router";
import { FolderOpen } from "lucide-react";
import { motion } from "motion/react";
import { Skeleton } from "@docsurf/ui/components/skeleton";

interface FolderHeroProps {
   project?: {
      name: string;
      description?: string;
      color?: string;
   } | null;
}

export const FolderHero = ({ project }: FolderHeroProps) => {
   const colorClasses = getProjectColorClasses(project?.color as ProjectColorId);
   const location = useLocation();
   const isRootPath = location.pathname === "/";

   const animProps = isRootPath
      ? {
           initial: { opacity: 0, y: 20 },
           animate: { opacity: 1, y: 0 },
           transition: { duration: 0.3 },
        }
      : {};

   return (
      <motion.div {...animProps} className="mb-8 flex max-w-4xl gap-2 px-3">
         <div className={cn("mt-1 flex size-5 self-baseline", colorClasses, "bg-transparent dark:bg-transparent")}>
            <FolderOpen className="size-5" fill="currentColor" strokeWidth={1} stroke="var(--foreground)" />
         </div>
         <div>
            {/* Folder name and description */}
            {project ? (
               <h1 className={cn("mb-1 font-bold text-foreground text-xl", !project.description && "pb-5")}>{project.name}</h1>
            ) : (
               <Skeleton className="mb-2 h-7 w-48" />
            )}
            {project ? (
               project?.description && <p className="max-w-md text-muted-foreground text-sm">{project.description}</p>
            ) : (
               <Skeleton className="mb-2 h-5 w-3/4" />
            )}
         </div>
      </motion.div>
   );
};
