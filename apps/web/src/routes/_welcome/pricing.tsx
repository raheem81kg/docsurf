import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@docsurf/ui/components/accordion";
import { Button } from "@docsurf/ui/components/button";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { PLANS, getCurrentPlan } from "@docsurf/utils/constants/pricing";

export const Route = createFileRoute("/_welcome/pricing")({
   component: RouteComponent,
   ssr: true,
});

function RouteComponent() {
   const freePlan = getCurrentPlan("Free");
   const proPlan = getCurrentPlan("Pro");

   return (
      <>
         <div className="container mx-auto text-text-default">
            <div className="relative flex flex-col items-center text-center">
               <h1 className="mt-24 mb-4 text-center font-medium text-5xl text-text-default">Simple, transparent pricing</h1>
               <p className="mb-12 max-w-2xl text-md text-[#878787]">Choose the plan that's right for you and start Docsurf today.</p>

               <div className="mt-8 grid w-full max-w-5xl grid-cols-1 gap-10 md:grid-cols-2">
                  {/* Free Plan */}
                  <div className="flex flex-col rounded-[4px] border border-border bg-[#F2F1EF] dark:bg-[#121212] p-8">
                     <h2 className="mb-2 text-left text-xl text-text-default">{freePlan?.name}</h2>
                     <div className="mt-4 flex items-baseline">
                        <span className="font-medium text-[40px] tracking-tight text-text-default">${freePlan?.price.monthly}</span>
                        <span className="ml-1 font-medium text-2xl text-text-default">/mo</span>
                     </div>
                     <p className="mt-4 text-left text-[#878787] text-sm">
                        {freePlan?.limits.requests1d} chat requests per day, 6 file uploads per day, and unlimited suggestions.
                     </p>

                     <div className="mt-8">
                        <h3 className="text-left font-medium font-mono text-xs uppercase tracking-wide text-text-default">
                           INCLUDING
                        </h3>
                        <ul className="mt-4 space-y-2">
                           <li className="flex items-start">
                              <Check className="mr-2 h-5 w-5 flex-shrink-0 text-[#878787]" />
                              <span className="text-sm text-text-default">AI-powered writing assistance</span>
                           </li>
                           <li className="flex items-start">
                              <Check className="mr-2 h-5 w-5 flex-shrink-0 text-[#878787]" />
                              <span className="text-sm text-text-default">Unlimited text suggestions & auto-completions</span>
                           </li>
                           <li className="flex items-start">
                              <Check className="mr-2 h-5 w-5 flex-shrink-0 text-[#878787]" />
                              <span className="text-sm text-text-default">Import & export .docx files</span>
                           </li>
                           <li className="flex items-start">
                              <Check className="mr-2 h-5 w-5 flex-shrink-0 text-[#878787]" />
                              <span className="text-sm text-text-default">20 version history per document</span>
                           </li>

                           <li className="flex items-start">
                              <Check className="mr-2 h-5 w-5 flex-shrink-0 text-[#878787]" />
                              <span className="text-sm text-text-default">Basic AI models</span>
                           </li>
                           <li className="flex items-start">
                              <Check className="mr-2 h-5 w-5 flex-shrink-0 text-[#878787]" />
                              <span className="text-sm text-text-default">{freePlan?.limits.requests1d} chat requests/day</span>
                           </li>
                           <li className="flex items-start">
                              <Check className="mr-2 h-5 w-5 flex-shrink-0 text-[#878787]" />
                              <span className="text-sm text-text-default">6 file uploads/day</span>
                           </li>
                        </ul>
                     </div>

                     <div className="mt-8 border-border border-t-[1px] pt-8">
                        <Link to="/auth">
                           <Button variant="outline" className="border border-brand text-primary h-12 w-full">
                              Get Started
                           </Button>
                        </Link>
                     </div>
                  </div>

                  {/* Pro Plan */}
                  <div className="relative flex flex-col rounded-[4px] border border-border bg-[#F2F1EF] dark:bg-[#121212] p-8">
                     <div className="absolute top-0 right-0 mt-4 mr-4 rounded-full border px-2 py-1 font-mono font-normal text-[9px] text-text-default border-border bg-[#fff] dark:bg-[#121212]">
                        Limited Offer
                     </div>
                     <h2 className="mb-2 text-left text-xl text-text-default">{proPlan?.name}</h2>

                     <div className="mt-1 flex items-baseline">
                        <span className="text-[40px] font-medium tracking-tight line-through text-[#878787]">${20}</span>
                        <span className="ml-1 text-[40px] font-medium tracking-tight">${proPlan?.price.monthly}</span>
                        <span className="ml-1 text-xl font-medium">/mo</span>
                     </div>
                     <p className="mt-4 text-left text-[#878787] text-sm">
                        Unlimited chat requests and unlimited file uploads per day.
                     </p>

                     <div className="mt-8">
                        <h3 className="text-left font-medium font-mono text-xs uppercase tracking-wide text-text-default">
                           INCLUDING
                        </h3>
                        <ul className="mt-4 space-y-2">
                           <li className="flex items-start">
                              <Check className="mr-2 h-5 w-5 flex-shrink-0 text-[#878787]" />
                              <span className="text-sm text-text-default">Everything in Free, plus:</span>
                           </li>

                           <li className="flex items-start">
                              <Check className="mr-2 h-5 w-5 flex-shrink-0 text-[#878787]" />
                              <span className="text-sm text-text-default">Priority support</span>
                           </li>
                           <li className="flex items-start">
                              <Check className="mr-2 h-5 w-5 flex-shrink-0 text-[#878787]" />
                              <span className="text-sm text-text-default">200 version history per document</span>
                           </li>
                           <li className="flex items-start">
                              <Check className="mr-2 h-5 w-5 flex-shrink-0 text-[#878787]" />
                              <span className="text-sm text-text-default">Premium AI models</span>
                           </li>
                           <li className="flex items-start">
                              <Check className="mr-2 h-5 w-5 flex-shrink-0 text-[#878787]" />
                              <span className="text-sm text-text-default">Unlimited chat requests</span>
                           </li>
                           <li className="flex items-start">
                              <Check className="mr-2 h-5 w-5 flex-shrink-0 text-[#878787]" />
                              <span className="text-sm text-text-default">Unlimited file uploads</span>
                           </li>
                        </ul>
                     </div>

                     <div className="mt-8 border-border border-t pt-8">
                        <Button className="h-12 w-full" variant="default">
                           Get Started
                        </Button>
                     </div>
                  </div>
               </div>

               <div className="mt-4 flex w-full max-w-5xl items-center justify-between">
                  <p className="mt-4 font-mono text-muted-foreground text-xs">(No credit card required)</p>

                  {/* <p className="mt-4 hidden font-mono text-muted-foreground text-xs md:block">
                     Need more? Feel free to{" "}
                     <Link to="/auth" className="underline">
                        contact us
                     </Link>
                     .
                  </p> */}
               </div>
            </div>
         </div>

         <div className="container mx-auto mt-32 max-w-[800px]">
            <div>
               <div className="text-center">
                  <h4 className="text-4xl">Frequently asked questions</h4>
               </div>

               <Accordion type="single" collapsible className="mt-10 mb-48 w-full">
                  <AccordionItem value="item-1">
                     <AccordionTrigger>
                        <span className="truncate">What is Docsurf?</span>
                     </AccordionTrigger>
                     <AccordionContent>
                        Docsurf is an AI-powered document creation platform that helps you write better content faster. It offers
                        intelligent suggestions, advanced editing tools, and seamless document management to unlock your writing
                        potential.
                     </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                     <AccordionTrigger>How does the AI writing assistance work?</AccordionTrigger>
                     <AccordionContent>
                        Our AI provides real-time suggestions, completions, and style enhancements as you type. It helps improve
                        clarity, tone, and grammar, helping you craft high-quality documents more efficiently.
                     </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3">
                     <AccordionTrigger>Can I import existing documents?</AccordionTrigger>
                     <AccordionContent>
                        Yes, you can easily import your existing `.docx` documents. Our platform preserves your original formatting,
                        making the transition seamless so you can start enhancing them with AI right away.
                     </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-4">
                     <AccordionTrigger>
                        <span className="max-w-[300px] truncate md:max-w-full">What are your data privacy & security policies?</span>
                     </AccordionTrigger>
                     <AccordionContent>
                        We take data privacy very seriously and implement state-of-the-art security measures to protect your data. We
                        are also actively working towards SOC 2 Type II compliance. We encrypt data at rest and in transit.
                        <Link to="/policy" className="ml-1 underline">
                           Learn more.
                        </Link>
                     </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-5">
                     <AccordionTrigger>
                        <span className="max-w-[300px] truncate md:max-w-full">Can I cancel my subscription at any time?</span>
                     </AccordionTrigger>
                     <AccordionContent>
                        Yes, you can cancel your subscription at any time. If you cancel your subscription, you will still be able to
                        use Docsurf until the end of your billing period.
                     </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-6">
                     <AccordionTrigger>
                        <span className="max-w-[300px] truncate md:max-w-full">I have more questions. How can I get in touch?</span>
                     </AccordionTrigger>
                     <AccordionContent>
                        Sure, we're happy to answer any questions you might have. Just send us an email at{" "}
                        <a href="mailto:support@docsurf.ai" className="underline">
                           support@docsurf.ai
                        </a>{" "}
                        and we'll get back to you as soon as possible.
                     </AccordionContent>
                  </AccordionItem>
               </Accordion>
            </div>
         </div>
      </>
   );
}
