import { SettingsLayout } from "@/components/sandbox/right-inner/chat/settings/settings-layout";
import { useDocumentSettings } from "@/store/document-settings-store";
import type { DocumentFont } from "@/store/document-settings-store";
import { Card } from "@docsurf/ui/components/card";
import { Label } from "@docsurf/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@docsurf/ui/components/select";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/settings/document")({
   ssr: false,
   component: DocumentSettingsPage,
});

const FONT_OPTIONS = [
   { label: "Sans (Inter)", value: "sans" },
   { label: "Lato (Slack Canvas)", value: "lato" },
   { label: "Serif (Merriweather)", value: "serif" },
   { label: "Mono (Source Code Pro)", value: "mono" },
];

function DocumentSettingsPage() {
   const defaultFont = useDocumentSettings((s) => s.defaultFont);
   const setDefaultFont = useDocumentSettings((s) => s.setDefaultFont);

   const handleFontChange = (value: DocumentFont) => {
      setDefaultFont(value);
   };

   return (
      <SettingsLayout title="Document Settings" description="Customize default document behavior and appearance.">
         <div className="space-y-8">
            <Card className="p-6 max-w-xl">
               <div className="space-y-4">
                  <div>
                     <h3 className="font-semibold text-foreground">Default Font</h3>
                     <p className="mt-1 text-muted-foreground text-sm">
                        Choose the default font for all your documents. This will apply to all documents you view or edit.
                     </p>
                  </div>
                  <div className="flex items-center gap-4">
                     <Label htmlFor="font-select" className="min-w-[120px]">
                        Font
                     </Label>
                     <Select value={defaultFont} onValueChange={handleFontChange}>
                        <SelectTrigger id="font-select" className="w-56">
                           <SelectValue placeholder="Select font" />
                        </SelectTrigger>
                        <SelectContent>
                           {FONT_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                 {option.label}
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </div>
               </div>
            </Card>
            {/* TODO: Add more document settings here in the future */}
         </div>
      </SettingsLayout>
   );
}
