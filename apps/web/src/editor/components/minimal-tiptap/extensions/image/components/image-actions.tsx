import * as React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@docsurf/ui/components/tooltip";
import { cn } from "@docsurf/ui/lib/utils";
import { Button } from "@docsurf/ui/components/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@docsurf/ui/components/dropdown-menu";
import { ClipboardCopyIcon, DotsHorizontalIcon, DownloadIcon, Link2Icon, SizeIcon } from "@radix-ui/react-icons";
import { AlignLeft, AlignCenter, AlignRight, Check } from "lucide-react";

interface ImageActionsProps {
   shouldMerge?: boolean;
   isLink?: boolean;
   onView?: () => void;
   onDownload?: () => void;
   onCopy?: () => void;
   onCopyLink?: () => void;
   align?: string;
   onAlignChange?: (align: string) => void;
}

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
   icon: React.ReactNode;
   tooltip: string;
}

export const ActionWrapper = React.memo(
   React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ children, className, ...props }, ref) => (
      <div
         ref={ref}
         className={cn(
            "absolute right-3 top-3 flex flex-row rounded px-0.5 opacity-0 group-hover/node-image:opacity-100",
            "border-[0.5px] bg-[var(--mt-bg-secondary)] [backdrop-filter:saturate(1.8)_blur(20px)]",
            className
         )}
         {...props}
      >
         {children}
      </div>
   ))
);

ActionWrapper.displayName = "ActionWrapper";

export const ActionButton = React.memo(
   React.forwardRef<HTMLButtonElement, ActionButtonProps>(({ icon, tooltip, className, ...props }, ref) => (
      <Tooltip>
         <TooltipTrigger asChild>
            <Button
               ref={ref}
               variant="ghost"
               className={cn(
                  "relative flex h-7 w-7 flex-row rounded-none p-0 text-muted-foreground hover:text-foreground",
                  "bg-transparent hover:bg-transparent",
                  className
               )}
               {...props}
            >
               {icon}
            </Button>
         </TooltipTrigger>
         <TooltipContent side="bottom">{tooltip}</TooltipContent>
      </Tooltip>
   ))
);

ActionButton.displayName = "ActionButton";

type ActionKey = "onView" | "onDownload" | "onCopy" | "onCopyLink";

const ActionItems: Array<{
   key: ActionKey;
   icon: React.ReactNode;
   tooltip: string;
   isLink?: boolean;
}> = [
   {
      key: "onView",
      icon: <SizeIcon className="size-4" />,
      tooltip: "View image",
   },
   {
      key: "onDownload",
      icon: <DownloadIcon className="size-4" />,
      tooltip: "Download image",
   },
   {
      key: "onCopy",
      icon: <ClipboardCopyIcon className="size-4" />,
      tooltip: "Copy image to clipboard",
   },
   {
      key: "onCopyLink",
      icon: <Link2Icon className="size-4" />,
      tooltip: "Copy image link",
      isLink: true,
   },
];

const alignmentOptions = [
   { value: "left", icon: <AlignLeft className="size-4" /> },
   { value: "center", icon: <AlignCenter className="size-4" /> },
   { value: "right", icon: <AlignRight className="size-4" /> },
];

export const ImageActions: React.FC<ImageActionsProps> = React.memo(
   ({ shouldMerge = false, isLink = false, align = "center", onAlignChange, ...actions }) => {
      const [isOpen, setIsOpen] = React.useState(false);
      const [alignMenuOpen, setAlignMenuOpen] = React.useState(false);

      const handleAction = React.useCallback((e: React.MouseEvent, action: (() => void) | undefined) => {
         e.preventDefault();
         e.stopPropagation();
         action?.();
      }, []);

      const filteredActions = React.useMemo(() => ActionItems.filter((item) => isLink || !item.isLink), [isLink]);

      // Alignment dropdown menu
      const alignDropdown = (
         <DropdownMenu open={alignMenuOpen} onOpenChange={setAlignMenuOpen}>
            <DropdownMenuTrigger asChild>
               <ActionButton
                  icon={alignmentOptions.find((o) => o.value === align)?.icon || <AlignCenter className="size-4" />}
                  tooltip="Image alignment"
                  onClick={(e) => e.preventDefault()}
               />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-0">
               {alignmentOptions.map((option) => (
                  <DropdownMenuItem
                     key={option.value}
                     onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onAlignChange?.(option.value);
                        setAlignMenuOpen(false);
                     }}
                     className={align === option.value ? "bg-accent" : ""}
                  >
                     <span className="flex items-center gap-2">{option.icon}</span>
                     {align === option.value && <Check className="ml-auto size-4 text-primary" />}
                  </DropdownMenuItem>
               ))}
            </DropdownMenuContent>
         </DropdownMenu>
      );

      return (
         <ActionWrapper className={cn({ "opacity-100": isOpen })}>
            {shouldMerge ? (
               <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                  <DropdownMenuTrigger asChild>
                     <ActionButton
                        icon={<DotsHorizontalIcon className="size-4" />}
                        tooltip="Open menu"
                        onClick={(e) => e.preventDefault()}
                     />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                     {filteredActions.map(({ key, icon, tooltip }) => (
                        <DropdownMenuItem key={key} onClick={(e) => handleAction(e, actions[key])}>
                           <div className="flex flex-row items-center gap-2">
                              {icon}
                              <span>{tooltip}</span>
                           </div>
                        </DropdownMenuItem>
                     ))}
                     <DropdownMenuItem disabled className="opacity-60 cursor-default select-none">
                        <span className="flex items-center gap-2">Align</span>
                     </DropdownMenuItem>
                     {alignmentOptions.map((option) => (
                        <DropdownMenuItem
                           key={option.value}
                           onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onAlignChange?.(option.value);
                              setIsOpen(false);
                           }}
                           className={align === option.value ? "bg-accent" : ""}
                        >
                           <span className="flex items-center gap-2">{option.icon}</span>
                           {align === option.value && <Check className="ml-auto size-4 text-primary" />}
                        </DropdownMenuItem>
                     ))}
                  </DropdownMenuContent>
               </DropdownMenu>
            ) : (
               filteredActions.map(({ key, icon, tooltip }, idx) => (
                  <React.Fragment key={key}>
                     <ActionButton icon={icon} tooltip={tooltip} onClick={(e) => handleAction(e, actions[key])} />
                     {/* Insert align dropdown after copy image to clipboard */}
                     {key === "onCopy" && alignDropdown}
                  </React.Fragment>
               ))
            )}
         </ActionWrapper>
      );
   }
);

ImageActions.displayName = "ImageActions";
