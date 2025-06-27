/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
/** biome-ignore-all lint/a11y/useKeyWithMouseEvents: <explanation> */
"use client";
import React, { useState } from "react";

import { TABLE_DEFAULT_SELECTED_GRID_SIZE, TABLE_INIT_GRID_SIZE, TABLE_MAX_GRID_SIZE } from "../../../tiptap-util";

import { Popover, PopoverContent, PopoverTrigger } from "@docsurf/ui/components/popover";
import { useIsMobile } from "@docsurf/ui/hooks/use-mobile";

const createArray = (length: number) => Array.from({ length }).map((_, index) => index + 1);

interface IPropsCreateTablePopover {
   createTable: any;
   children: any;
}

export interface GridSize {
   rows: number;
   cols: number;
}

export interface CreateTablePayload extends GridSize {
   withHeaderRow: boolean;
}

function CreateTablePopover(props: IPropsCreateTablePopover) {
   const [withHeaderRow, setWithHeaderRow] = useState<boolean>(true);
   const [tableGridSize, setTableGridSize] = useState<GridSize>({
      rows: useIsMobile() ? TABLE_MAX_GRID_SIZE : TABLE_INIT_GRID_SIZE,
      cols: useIsMobile() ? TABLE_MAX_GRID_SIZE : TABLE_INIT_GRID_SIZE,
   });

   const [selectedTableGridSize, setSelectedTableGridSize] = useState<GridSize>({
      rows: TABLE_DEFAULT_SELECTED_GRID_SIZE,
      cols: TABLE_DEFAULT_SELECTED_GRID_SIZE,
   });

   function selectTableGridSize(rows: number, cols: number): void {
      if (rows === tableGridSize.rows) {
         setTableGridSize((prev) => {
            return {
               ...prev,
               rows: Math.min(rows + 1, TABLE_MAX_GRID_SIZE),
            };
         });
      }

      if (cols === tableGridSize.cols) {
         setTableGridSize((prev) => {
            return {
               ...prev,
               cols: Math.min(cols + 1, TABLE_MAX_GRID_SIZE),
            };
         });
      }

      setSelectedTableGridSize({
         rows,
         cols,
      });
   }

   function onMouseDown(rows: number, cols: number) {
      props?.createTable({ rows, cols, withHeaderRow });
      resetTableGridSize();
   }

   function resetTableGridSize(): void {
      setWithHeaderRow(false);

      setTableGridSize({
         rows: TABLE_INIT_GRID_SIZE,
         cols: TABLE_INIT_GRID_SIZE,
      });

      setSelectedTableGridSize({
         rows: TABLE_DEFAULT_SELECTED_GRID_SIZE,
         cols: TABLE_DEFAULT_SELECTED_GRID_SIZE,
      });
   }

   return (
      <Popover modal>
         <PopoverTrigger asChild>{props?.children}</PopoverTrigger>

         <PopoverContent align="start" className="w-full !p-2" side="bottom">
            <div className="table-grid-size-editor p-0">
               <div className="flex flex-col flex-wrap justify-between gap-1">
                  {createArray(tableGridSize?.rows)?.map((row: any) => {
                     return (
                        <div className="flex gap-1" key={`r-${row}`}>
                           {createArray(tableGridSize?.cols)?.map((col: any) => {
                              return (
                                 <div
                                    key={`c-${col}`}
                                    onMouseDown={() => onMouseDown(row, col)}
                                    onMouseOver={() => selectTableGridSize(row, col)}
                                    className={`cursor-pointer border-border ${
                                       col <= selectedTableGridSize.cols &&
                                       row <= selectedTableGridSize.rows &&
                                       "tableCellActive !bg-foreground"
                                    }`}
                                 >
                                    <div className="box-border size-4 rounded-[2px] border border-solid border-border p-1" />
                                 </div>
                              );
                           })}
                        </div>
                     );
                  })}
               </div>

               <div className="mt-2 text-center text-sm text-zinc-600">
                  {selectedTableGridSize.rows} x{selectedTableGridSize.cols}
               </div>
            </div>
         </PopoverContent>
      </Popover>
   );
}

export default CreateTablePopover;
