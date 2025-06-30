import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@docsurf/ui/components/accordion";
import { Button } from "@docsurf/ui/components/button";
import { Link, createLazyFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";

export const Route = createLazyFileRoute("/_welcome/pricing")({
   component: RouteComponent,
});

function RouteComponent() {
   return (
      <>
         <div className="container mx-auto text-primary-foreground">
            <div className="relative flex flex-col items-center text-center">
               <h1 className="mt-24 mb-4 text-center font-medium text-5xl">Simple, transparent pricing</h1>
               <p className="mb-12 max-w-2xl text-md text-muted-foreground">
                  Choose the plan that's right for you and start your 14-day trial today.
               </p>

               <div className="mt-8 grid w-full max-w-5xl grid-cols-1 gap-10 md:grid-cols-2">
                  {/* Starter Plan */}
                  <div className="flex flex-col rounded-[4px] border bg-primary p-8">
                     <h2 className="mb-2 text-left text-xl">Starter</h2>
                     <div className="mt-4 flex items-baseline">
                        <span className="font-medium text-[40px] tracking-tight">$29</span>
                        <span className="ml-1 font-medium text-2xl">/mo</span>
                        <span className="ml-2 text-muted-foreground text-sm">Excl. VAT</span>
                     </div>
                     <p className="mt-4 text-left text-sm">For freelancers and solo founders who need the essentials.</p>

                     <div className="mt-8">
                        <h3 className="text-left font-medium font-mono text-xs uppercase tracking-wide">INCLUDING</h3>
                        <ul className="mt-4 space-y-2">
                           <li className="flex items-start">
                              <Check className="mr-2 h-5 w-5 flex-shrink-0 text-primary" />
                              <span className="text-sm">AI-powered writing assistance</span>
                           </li>
                           <li className="flex items-start">
                              <Check className="mr-2 h-5 w-5 flex-shrink-0 text-primary" />
                              <span className="text-sm">Smart text suggestions & completions</span>
                           </li>
                           <li className="flex items-start">
                              <Check className="mr-2 h-5 w-5 flex-shrink-0 text-primary" />
                              <span className="text-sm">Standard grammar & style checks</span>
                           </li>
                           <li className="flex items-start">
                              <Check className="mr-2 h-5 w-5 flex-shrink-0 text-primary" />
                              <span className="text-sm">AI-driven document organization</span>
                           </li>
                           <li className="flex items-start">
                              <Check className="mr-2 h-5 w-5 flex-shrink-0 text-primary" />
                              <span className="text-sm">30-day version history</span>
                           </li>
                           <li className="flex items-start">
                              <Check className="mr-2 h-5 w-5 flex-shrink-0 text-primary" />
                              <span className="text-sm">Import & export .docx files</span>
                           </li>
                           <li className="flex items-start">
                              <Check className="mr-2 h-5 w-5 flex-shrink-0 text-primary" />
                              <span className="text-sm">Create up to 50 documents</span>
                           </li>
                           <li className="flex items-start">
                              <Check className="mr-2 h-5 w-5 flex-shrink-0 text-primary" />
                              <span className="text-sm">2 users included</span>
                           </li>
                           <li className="flex items-start">
                              <Check className="mr-2 h-5 w-5 flex-shrink-0 text-primary" />
                              <span className="text-sm">10GB secure storage</span>
                           </li>
                           <li className="flex items-start">
                              <Check className="mr-2 h-5 w-5 flex-shrink-0 text-primary" />
                              <span className="text-sm">Community support access</span>
                           </li>
                           <li className="flex items-start">
                              <Check className="mr-2 h-5 w-5 flex-shrink-0 text-primary" />
                              <span className="text-sm">Basic document analytics</span>
                           </li>
                        </ul>
                     </div>

                     <div className="mt-8 border-border border-t-[1px] pt-8">
                        <Link to="/auth">
                           <Button className="border-border hover:border-border h-12 w-full border hover:bg-primary/90">
                              Get Started
                           </Button>
                        </Link>
                     </div>
                  </div>

                  {/* Pro Plan */}
                  <div className="relative flex flex-col rounded-[4px] border border-brand bg-primary p-8">
                     <div className="absolute top-0 right-0 mt-4 mr-4 rounded-full border px-2 py-1 font-mono font-normal text-[9px]">
                        Limited offer
                     </div>
                     <h2 className="mb-2 text-left text-xl">Pro</h2>
                     <div className="mt-1 flex items-baseline">
                        <span className="font-medium text-[40px] tracking-tight line-through">$99</span>

                        <span className="ml-1 font-medium text-[40px] tracking-tight">49</span>

                        <span className="ml-1 font-medium text-xl">/mo</span>
                        <span className="ml-2 text-muted-foreground text-xs">Excl. VAT</span>
                     </div>
                     <p className="mt-4 text-left text-sm">For growing teams and businesses that need more flexibility.</p>

                     <div className="mt-8">
                        <h3 className="text-left font-medium font-mono text-xs uppercase tracking-wide">INCLUDING</h3>
                        <ul className="mt-4 space-y-2">
                           <li className="flex items-start">
                              <Check className="mr-2 h-5 w-5 flex-shrink-0 text-primary" />
                              <span className="text-sm">Advanced AI writing assistance</span>
                           </li>
                           <li className="flex items-start">
                              <Check className="mr-2 h-5 w-5 flex-shrink-0 text-primary" />
                              <span className="text-sm">Smart text suggestions & completions</span>
                           </li>
                           <li className="flex items-start">
                              <Check className="mr-2 h-5 w-5 flex-shrink-0 text-primary" />
                              <span className="text-sm">Premium grammar & style checks</span>
                           </li>
                           <li className="flex items-start">
                              <Check className="mr-2 h-5 w-5 flex-shrink-0 text-primary" />
                              <span className="text-sm">AI-driven document organization</span>
                           </li>
                           <li className="flex items-start">
                              <Check className="mr-2 h-5 w-5 flex-shrink-0 text-primary" />
                              <span className="text-sm">Unlimited version history</span>
                           </li>
                           <li className="flex items-start">
                              <Check className="mr-2 h-5 w-5 flex-shrink-0 text-primary" />
                              <span className="text-sm">Import & export .docx files</span>
                           </li>
                           <li className="flex items-start">
                              <Check className="mr-2 h-5 w-5 flex-shrink-0 text-primary" />
                              <span className="text-sm">Create unlimited documents</span>
                           </li>
                           <li className="flex items-start">
                              <Check className="mr-2 h-5 w-5 flex-shrink-0 text-primary" />
                              <span className="text-sm">10 users included</span>
                           </li>
                           <li className="flex items-start">
                              <Check className="mr-2 h-5 w-5 flex-shrink-0 text-primary" />
                              <span className="text-sm">100GB secure storage</span>
                           </li>
                           <li className="flex items-start">
                              <Check className="mr-2 h-5 w-5 flex-shrink-0 text-primary" />
                              <span className="text-sm">Priority email support</span>
                           </li>
                           <li className="flex items-start">
                              <Check className="mr-2 h-5 w-5 flex-shrink-0 text-primary" />
                              <span className="text-sm">Advanced document analytics</span>
                           </li>
                        </ul>
                     </div>

                     <div className="mt-8 border-border border-t pt-8">
                        <Link to="/auth">
                           <Button variant="secondary" className="h-12 w-full">
                              Get Started
                           </Button>
                        </Link>
                     </div>
                  </div>
               </div>

               <div className="mt-4 flex w-full max-w-5xl items-center justify-between">
                  <p className="mt-4 font-mono text-muted-foreground text-xs">14 day trial (No credit card required)</p>

                  <p className="mt-4 hidden font-mono text-muted-foreground text-xs md:block">
                     Need more? Feel free to{" "}
                     <Link to="/auth" className="underline">
                        contact us
                     </Link>
                     .
                  </p>
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
                        <a href="mailto:support@docsurf.com" className="underline">
                           support@docsurf.com
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
