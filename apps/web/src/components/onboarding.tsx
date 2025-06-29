// import { Dialog, DialogContent, DialogTitle } from "@docsurf/ui/components/dialog";
// import { Button } from "@docsurf/ui/components/button";
// import { useState, useEffect, useMemo, useRef, useLayoutEffect } from "react";
// import confetti from "canvas-confetti";
// import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

// const getSteps = () => [
//    {
//       title: "Welcome to DocSurf!",
//       description: (
//          <>
//             <span className="text-muted-foreground mb-6">
//                A modern document editor that keeps your work private and accessible offline, with powerful version history and built-in
//                AI to boost your productivity.
//             </span>
//          </>
//       ),
//       video: "/onboarding/welcome-placeholder.png",
//    },
//    {
//       title: "Floating AI Toolbar",
//       description: (
//          <>
//             <span className="text-muted-foreground mb-6">
//                Instantly access AI-powered editing and suggestions with the floating toolbar.
//                <br />
//                Select any text to rewrite, summarize, or expand it with a single click—right inside your document.
//             </span>
//          </>
//       ),
//       video: "/onboarding/ai-toolbar-placeholder.png",
//    },
//    {
//       title: "AI Autocomplete",
//       description: (
//          <>
//             <span className="text-muted-foreground mb-6">
//                Get smart, context-aware suggestions as you type.
//                <br />
//                Press <kbd>Ctrl+Space</kbd> to trigger autocomplete and speed up your writing.
//             </span>
//          </>
//       ),
//       video: "/onboarding/ai-autocomplete-placeholder.png",
//    },
//    {
//       title: "Version History",
//       description: (
//          <>
//             <span className="text-muted-foreground mb-6">
//                Every change is saved automatically and stored <b>locally on your device</b> for privacy and offline access.
//                <br />
//                Browse, restore, or manually save document versions—never lose your work again.
//             </span>
//          </>
//       ),
//       video: "/onboarding/version-history-placeholder.png",
//    },
//    {
//       title: "Ready to Start?",
//       description: (
//          <>
//             <span className="text-muted-foreground mb-6">Begin creating and versioning your documents with DocSurf!</span>
//          </>
//       ),
//       video: "/onboarding/ready-placeholder.png",
//    },
// ];

// export function OnboardingDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
//    const [currentStep, setCurrentStep] = useState(0);
//    // const { attach } = useBilling();
//    // const { customer } = useCustomer();

//    // const isPro = useMemo(() => {
//    //    return (
//    //       customer &&
//    //       Array.isArray(customer.products) &&
//    //       customer.products.some((product: any) => product.id.includes("pro-example") || product.name.includes("pro-example"))
//    //    );
//    // }, [customer]);
//    const isPro = false;

//    const steps = useMemo(() => getSteps(), []);

//    useEffect(() => {
//       if (currentStep === steps.length - 1) {
//          confetti({
//             particleCount: 100,
//             spread: 70,
//             origin: { y: 0.6 },
//          });
//       }
//    }, [currentStep, steps.length]);

//    const handleNext = () => {
//       if (currentStep < steps.length - 1) {
//          setCurrentStep(currentStep + 1);
//       } else {
//          onOpenChange(false);
//       }
//    };

//    // const handleUpgrade = async () => {
//    //    if (attach) {
//    //       try {
//    //          await attach({
//    //             productId: "pro-example",
//    //             successUrl: `${window.location.origin}/mail/inbox?success=true`,
//    //          });
//    //       } catch (error) {
//    //          console.error("Failed to upgrade:", error);
//    //       }
//    //    }
//    // };
//    const handleUpgrade = () => {};

//    const [containerHeight, setContainerHeight] = useState<number | undefined>(undefined);
//    const contentRef = useRef<HTMLDivElement>(null);

//    useLayoutEffect(() => {
//       if (contentRef.current) {
//          setContainerHeight(contentRef.current.offsetHeight);
//       }
//    }, [currentStep, steps]);

//    return (
//       <Dialog open={open} onOpenChange={onOpenChange}>
//          <VisuallyHidden>
//             <DialogTitle>Onboarding</DialogTitle>
//          </VisuallyHidden>
//          <DialogContent showOverlay className="bg-sidebar mx-auto w-full rounded-xl border p-4 sm:max-w-[690px] dark:bg-[#111111]">
//             <div
//                style={{ height: containerHeight, transition: "height 300ms cubic-bezier(0.4, 0, 0.2, 1)" }}
//                className="relative w-full"
//             >
//                <div ref={contentRef} className="flex flex-col gap-6 p-6">
//                   <div className="flex items-center justify-center">
//                      <div className="flex gap-1">
//                         {steps.map((_, index) => (
//                            <div
//                               // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
//                               key={index}
//                               className={`h-1 w-16 rounded-full ${index === currentStep ? "bg-brand" : "bg-emphasis/50"}`}
//                            />
//                         ))}
//                      </div>
//                   </div>
//                   <div className="space-y-2 text-center">
//                      <h2 className="text-4xl font-semibold">{steps[currentStep]?.title}</h2>
//                      <p className="text-muted-foreground mx-auto max-w-md text-sm">
//                         {typeof steps[currentStep]?.description === "function"
//                            ? (steps[currentStep]?.description as (arg: any) => React.ReactNode)(handleUpgrade)
//                            : steps[currentStep]?.description}
//                      </p>
//                   </div>

//                   {steps[currentStep] && steps[currentStep].video && (
//                      <div className="relative flex items-center justify-center">
//                         <div className="bg-muted aspect-video w-full max-w-4xl overflow-hidden rounded-lg">
//                            <div className="h-48 w-full bg-muted flex items-center justify-center rounded-lg">Image Placeholder</div>
//                         </div>
//                      </div>
//                   )}

//                   <div className="mx-auto flex w-full max-w-xl gap-2">
//                      <Button
//                         onClick={() => setCurrentStep(currentStep - 1)}
//                         variant="outline"
//                         className="h-8 flex-1"
//                         disabled={currentStep === 0}
//                      >
//                         Go back
//                      </Button>
//                      <Button onClick={handleNext} className="h-8 flex-1 border bg-brand hover:bg-brand-emphasis">
//                         {currentStep === steps.length - 1 ? "Get Started" : "Next"}
//                      </Button>
//                   </div>
//                </div>
//             </div>
//          </DialogContent>
//       </Dialog>
//    );
// }

// export function OnboardingWrapper() {
//    const [showOnboarding, setShowOnboarding] = useState(false);

//    useEffect(() => {
//       const hasOnboarded = localStorage.getItem("doc-surf-hasOnboarded");
//       if (!hasOnboarded) {
//          setShowOnboarding(true);
//       }
//    }, []);

//    const handleOpenChange = (open: boolean) => {
//       setShowOnboarding(open);
//       if (!open) {
//          localStorage.setItem("doc-surf-hasOnboarded", "true");
//       }
//    };

//    return <OnboardingDialog open={showOnboarding} onOpenChange={handleOpenChange} />;
// }
