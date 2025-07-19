import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_welcome/about")({
   component: RouteComponent,
   ssr: true,
});

function RouteComponent() {
   return (
      <div className="m-auto my-20 max-w-[600px]">
         <h1 className="mb-10 scroll-m-20 text-2xl tracking-tight lg:text-3xl">About Us</h1>

         <div className="line-height-lg v-space-md text-component">
            <h2 className="scroll-m-20 border-b pb-2 font-semibold text-xl tracking-tight first:mt-0">Our Mission</h2>
            <p className="mt-6 leading-7">
               DocSurf is an AI-powered writing assistant platform that helps you create and edit documents with intelligent support.
               We combine powerful writing tools with AI capabilities to enhance your writing experience, making it more efficient and
               enjoyable.
            </p>

            <h2 className="mt-4 scroll-m-20 border-b pb-2 font-semibold text-xl tracking-tight first:mt-0">Why We Started</h2>
            <p className="mt-6 leading-7">
               I started DocSurf because I recognized that writing needed a modern, intelligent approach. While there are many writing
               tools available, none truly leverage AI to enhance the writing experience in real-time. I wanted to create a platform
               that helps you write better through AI assistance, making the writing process more intuitive and efficient.
            </p>

            <h2 className="mt-4 scroll-m-20 border-b pb-2 font-semibold text-xl tracking-tight first:mt-0">Our Journey</h2>
            <p className="mt-6 leading-7">
               Since launching DocSurf, we've focused on building a comprehensive writing platform that combines:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6">
               <li>AI Autocomplete with real-time, context-aware suggestions as you type</li>
               <li>Smart Text Suggestions that let you select text, describe changes, and see visual diffs</li>
               <li>AI Chat Features with multiple models, file uploads, web search, and image generation</li>
               <li>Document Management with automatic saving, document history, and organization</li>
               <li>Word Document Support for seamless import/export with formatting preservation</li>
            </ul>
            <p className="mt-6 leading-7">
               Our users appreciate how DocSurf makes writing more efficient through AI assistance, whether they're working on personal
               notes or professional documents. We're committed to continuously improving our AI capabilities to make document creation
               even more powerful.
            </p>

            <h2 className="mt-4 scroll-m-20 border-b pb-2 font-semibold text-xl tracking-tight first:mt-0">Contact</h2>
            <p className="mt-6 leading-7">Want to learn more about DocSurf? Get in touch:</p>
            <ul>
               <li>By email: support@docsurf.ai</li>
            </ul>
         </div>
      </div>
   );
}
