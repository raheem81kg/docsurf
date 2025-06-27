import type React from "react";

import CreateTablePopover from "./CreateTablePopover";
import ToolbarButton from "../../../components/toolbar-button";
import type { VariantProps } from "class-variance-authority";
import type { toggleVariants } from "@docsurf/ui/components/toggle";

interface IPropsTableActionButton extends VariantProps<typeof toggleVariants> {
   editor: any;
   icon?: React.ReactNode;
   tooltip?: string;
   disabled?: boolean;
   color?: string;
   action?: (event: React.MouseEvent<HTMLButtonElement>) => void;
   isActive?: boolean;
   disableHoverableContent?: boolean;
}

function TableActionButton(props: IPropsTableActionButton) {
   function createTable(options: any) {
      if (!props.disabled) {
         props.editor
            .chain()
            .focus()
            .insertTable({ ...options, withHeaderRow: false })
            .run();
      }
   }

   return (
      <CreateTablePopover createTable={createTable}>
         <ToolbarButton
            isActive={props?.isActive}
            tooltip={props?.tooltip || ""}
            disabled={props?.disabled}
            className={props?.color}
            onClick={props?.action}
            variant={props?.variant}
            disableHoverableContent={props?.disableHoverableContent}
         >
            {props?.icon}
         </ToolbarButton>
      </CreateTablePopover>
   );
}

export default TableActionButton;
