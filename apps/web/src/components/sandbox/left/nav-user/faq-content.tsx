/**
 * FAQ content for DocSurf, covering basics, features, AI, privacy, and versioning.
 * Used in the Help dialog/drawer.
 */

/**
 * Renders frequently asked questions about DocSurf.
 */
export function FaqContent() {
   return (
      <div className="space-y-6 p-2">
         <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Basics</h3>
            <div className="space-y-4">
               <div className="space-y-1.5 bg-muted/50 p-3.5 rounded-2xl">
                  <h4 className="font-medium text-[15px]">What is DocSurf?</h4>
                  <p className="text-sm text-muted-foreground">
                     DocSurf is a modern, AI-powered document editor focused on privacy, productivity, and version history. It features
                     rich editing, built-in AI assistance, and online document storage.
                  </p>
               </div>
               <div className="space-y-1.5 bg-muted/50 p-3.5 rounded-2xl">
                  <h4 className="font-medium text-[15px]">How do I create a new document?</h4>
                  <p className="text-sm text-muted-foreground">
                     Click the <b>pen icon</b> in the sidebar to instantly create a new document. You can also use keyboard shortcuts
                     (see Help or press <kbd>Ctrl+Alt+N</kbd>).
                  </p>
               </div>
               <div className="space-y-1.5 bg-muted/50 p-3.5 rounded-2xl">
                  <h4 className="font-medium text-[15px]">Is DocSurf free to use?</h4>
                  <p className="text-sm text-muted-foreground">DocSurf is currently free. Pricing is in beta.</p>
               </div>
            </div>
         </div>

         <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Features</h3>
            <div className="space-y-4">
               <div className="space-y-1.5 bg-muted/50 p-3.5 rounded-2xl">
                  <h4 className="font-medium text-[15px]">What makes DocSurf different?</h4>
                  <p className="text-sm text-muted-foreground">
                     DocSurf combines AI-powered writing, online document storage, version history, and a beautiful, modern UI. It
                     supports rich text, code, tables, images, and more.
                  </p>
               </div>
               <div className="space-y-1.5 bg-muted/50 p-3.5 rounded-2xl">
                  <h4 className="font-medium text-[15px]">How does version history work?</h4>
                  <p className="text-sm text-muted-foreground">
                     Every change is saved automatically. Version history is available offline for privacy and reliability, but your
                     documents themselves are stored securely in the cloud.
                  </p>
               </div>
               <div className="space-y-1.5 bg-muted/50 p-3.5 rounded-2xl">
                  <h4 className="font-medium text-[15px]">Can I use DocSurf offline?</h4>
                  <p className="text-sm text-muted-foreground">
                     Only version history is available offline. Your documents are stored in an online database and require an internet
                     connection to access or edit.
                  </p>
               </div>
            </div>
         </div>

         <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">AI & Privacy</h3>
            <div className="space-y-4">
               <div className="space-y-1.5 bg-muted/50 p-3.5 rounded-2xl">
                  <h4 className="font-medium text-[15px]">How does AI work in DocSurf?</h4>
                  <p className="text-sm text-muted-foreground">
                     DocSurf offers two main AI-powered features:
                     <br />
                     <br />
                     <b>Floating AI Toolbar:</b> Select text and click the magic wand button to access advanced editing options like
                     rewriting, summarizing, or expanding your selection.
                     <br />
                     <br />
                     <b>AI Autocomplete:</b> Press <kbd>Ctrl+Space</kbd> while typing to get instant, context-aware suggestions.
                     Double-press <kbd>Ctrl+Space</kbd> to refresh the suggestion.
                     <br />
                     <br />
                     All AI features are powered by Vercel AI SDK and OpenAI.
                  </p>
               </div>
               <div className="space-y-1.5 bg-muted/50 p-3.5 rounded-2xl">
                  <h4 className="font-medium text-[15px]">Is my data private?</h4>
                  <p className="text-sm text-muted-foreground">
                     Your documents are stored securely in the cloud. Version history is kept locally for privacy. AI requests are sent
                     securely and never used to train third-party models.
                  </p>
               </div>
            </div>
         </div>

         {/*
         <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Support</h3>
            <div className="space-y-4">
               <div className="space-y-1.5 bg-muted/50 p-3.5 rounded-2xl">
                  <h4 className="font-medium text-[15px]">Where can I get help or report issues?</h4>
                  <p className="text-sm text-muted-foreground">
                     Support is coming soon.
                  </p>
               </div>
            </div>
         </div>
         */}
      </div>
   );
}
