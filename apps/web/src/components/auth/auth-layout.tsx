import { Suspense } from "react";
import { BlurImage } from "./blur-image";
import { ClientOnly } from "./client-only";

import DocsurfDashboardPreview from "/welcome/docsurf-dashboard-preview.png";
import { Icons } from "../assets/icons";
import { Link } from "@tanstack/react-router";

const logos = [
   "vercel",
   "perplexity",
   "prisma",
   "tinybird",
   "hashnode",
   "cal",
   "vercel",
   "perplexity",
   "prisma",
   "tinybird",
   "hashnode",
   "cal",
];

interface AuthLayoutProps {
   children: React.ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
   return (
      <div className="grid w-full grid-cols-1 md:grid-cols-5">
         <header className="w-full fixed left-0 right-0 z-50">
            <div className="ml-5 mt-4 md:ml-10 md:mt-10">
               <Link to="/">
                  <img src="/logo-black.png" alt="DocSurf" className="dark:invert" width={40} height={40} />
                  {/* <Icons.Logo /> */}
               </Link>
            </div>
         </header>
         <div className="col-span-1 flex min-h-screen flex-col items-center justify-between border-r border-neutral-200 dark:border-neutral-800 backdrop-blur sm:col-span-3">
            <div className="flex h-full w-full flex-col items-center justify-center">
               <ClientOnly className="relative flex w-full flex-col items-center justify-center px-4">{children}</ClientOnly>
            </div>
         </div>

         <div className="hidden h-full flex-col justify-center space-y-12 overflow-hidden md:col-span-2 md:flex">
            <div className="ml-12 h-1/2 w-[140%] rounded-xl border border-neutral-200 dark:border-neutral-700 p-2 shadow-xl">
               <BlurImage
                  alt="Dub Analytics"
                  src={DocsurfDashboardPreview}
                  width={2400}
                  height={1260}
                  className="aspect-[2400/1260] h-full rounded-lg border border-neutral-200 object-cover object-left-top"
               />
            </div>
            {/* <a href="https://dub.co/customers" target="_blank" className="animate-infinite-scroll flex items-center space-x-4">
               {logos.map((logo, idx) => (
                  <BlurImage
                     alt={`${logo} logo`}
                     key={idx}
                     src={`https://assets.dub.co/clients/${logo}.svg`}
                     width={520}
                     height={182}
                     className="h-12 grayscale transition-all hover:grayscale-0"
                  />
               ))}
            </a> */}
         </div>
      </div>
   );
};
