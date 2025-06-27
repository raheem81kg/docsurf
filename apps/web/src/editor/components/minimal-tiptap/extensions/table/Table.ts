import TiptapTable from "@tiptap/extension-table";
import type { TableCellOptions } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import type { TableHeaderOptions } from "@tiptap/extension-table-header";
import type { TableRowOptions } from "@tiptap/extension-table-row";

import { TableCellBackground, type TableCellBackgroundOptions } from "./cell-background";
// import { TableRow } from "@tiptap/extension-table-row";
// import { TableCell } from "@tiptap/extension-table-cell";

import TableActionButton from "./components/TableActionButton";

import { TableCell } from "./components/TableCell";
import { TableRow } from "./components/TableRow";

export interface TableOptions {
   HTMLAttributes: Record<string, any>;
   resizable: boolean;
   handleWidth: number;
   cellMinWidth: number;
   lastColumnResizable: boolean;
   allowTableNodeSelection: boolean;
   /** options for table rows */
   tableRow: Partial<TableRowOptions>;
   /** options for table headers */
   tableHeader: Partial<TableHeaderOptions>;
   /** options for table cells */
   tableCell: Partial<TableCellOptions>;
   /** options for table cell background */
   tableCellBackground: Partial<TableCellBackgroundOptions>;
}
export const Table = /* @__PURE__ */ TiptapTable.extend<TableOptions>({
   addOptions() {
      return {
         ...this.parent?.(),
         resizable: true,
         lastColumnResizable: true,
         allowTableNodeSelection: true,
         button: ({ editor, t }: any) => ({
            component: TableActionButton,
            componentProps: {
               disabled: editor.isActive("table") || false,
               icon: "Table",
               tooltip: t("editor.table.tooltip"),
               editor,
            },
         }),
      };
   },

   addExtensions() {
      return [
         TableRow.configure(this.options.tableRow),
         TableHeader.configure(this.options.tableHeader),
         TableCell.configure(this.options.tableCell),
         TableCellBackground.configure(this.options.tableCellBackground),
      ];
   },
});

export default Table;
