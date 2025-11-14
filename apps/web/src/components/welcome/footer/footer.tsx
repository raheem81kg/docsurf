// import { SubscribeInput } from "@/components/subscribe-input";
import { Link } from "@tanstack/react-router";
import { LogoLarge } from "./logo-large";
// import { GithubStars } from "./github-stars";
import { SocialLinks } from "./social-links";
import { StatusWidget } from "./status-widget";
import logo from "/logo-black.png";

export function Footer() {
   return (
      <footer className="overflow-hidden border-border border-t-[1px] bg-[#fff] px-4 pt-10 md:max-h-[820px] md:px-6 md:pt-16 dark:bg-[#0C0C0C]">
         <div className="container mx-auto">
            <div className="mb-12 flex items-center justify-between border-border border-b-[1px] pb-10 md:pb-16">
               <Link
                  to="/"
                  className="-ml-[52px] scale-0 md:ml-0 md:scale-100 flex text-[#0B100F] dark:text-foreground items-center gap-2.5"
                  title="Home"
               >
                  {/* <LogoLarge /> */}
                  <img
                     src={logo}
                     alt="DocSurf - AI-powered document editor logo"
                     className="rounded-lg dark:invert"
                     width={52}
                     height={52}
                  />
                  {/* <p className="text-3xl font-medium">Docsurf</p> */}
                  <span className="sr-only">Docsurf</span>
               </Link>

               <span className="text-right font-normal md:text-2xl">Write smarter with AI.</span>
            </div>

            <div className="flex w-full flex-col md:flex-row">
               <div className="flex flex-col justify-between space-y-8 leading-8 md:w-6/12 md:flex-row md:space-y-0">
                  <div>
                     <span className="font-medium">Features</span>
                     <ul>
                        <li className="text-[#878787] transition-colors">
                           <Link to="/doc" title="Editor">
                              Editor
                           </Link>
                        </li>
                        <li className="text-[#878787] transition-colors">
                           <Link to="/doc" title="AI Features">
                              AI Features
                           </Link>
                        </li>
                        <li className="text-[#878787] transition-colors">
                           <Link to="/doc" title="Version Control">
                              Document History
                           </Link>
                        </li>
                        <li className="text-[#878787] transition-colors">
                           <Link to="/doc" title="Import/Export">
                              Import/Export
                           </Link>
                        </li>
                        <li className="text-[#878787] transition-colors">
                           <Link to="/pricing" title="Pricing">
                              Pricing
                           </Link>
                        </li>
                     </ul>
                  </div>

                  <div>
                     <span>Resources</span>
                     <ul>
                        {/* <li className="text-[#878787] transition-colors">
                           <Link to="/" title="Support">
                              Support
                           </Link>
                        </li> */}
                        <li className="text-[#878787] transition-colors">
                           <Link to="/policy" title="Privacy Policy">
                              Privacy Policy
                           </Link>
                        </li>
                        <li className="text-[#878787] transition-colors">
                           <Link to="/terms" title="Terms of Service">
                              Terms of Service
                           </Link>
                        </li>
                     </ul>
                  </div>

                  <div className="min-w-[7.5ch]">
                     <span>Company</span>
                     <ul>
                        <li className="text-[#878787] transition-colors">
                           <Link to="/about" title="About">
                              About
                           </Link>
                        </li>
                        {/* <li className="text-[#878787] transition-colors">
                           <Link to="/" title="Contact">
                              Contact
                           </Link>
                        </li> */}
                     </ul>
                  </div>
                  <div>
                     <span>More</span>
                     <ul>
                        <li className="text-[#878787] transition-colors">
                           <a
                              href="https://www.betterpowerpoints.com"
                              title="Better Powerpoints"
                              target="_blank"
                              rel="noopener noreferrer"
                           >
                              Better Powerpoints
                           </a>
                        </li>
                     </ul>
                  </div>
               </div>

               <div className="mt-8 flex md:mt-0 md:w-6/12 md:justify-end">
                  <div className="flex flex-col md:items-end">
                     <div className="mb-8 flex flex-col items-start space-y-6 md:flex-row md:items-center md:space-y-0">
                        <SocialLinks />
                     </div>

                     {/* <div className="mb-8"><SubscribeInput /></div> */}
                     <div className="md:mr-0 mt-auto mr-auto">
                        <StatusWidget />
                     </div>
                  </div>
               </div>
            </div>
         </div>

         <h5 className="pointer-events-none text-center text-[#F4F4F3] text-[500px] leading-none dark:text-[#161616]">docsurf</h5>
      </footer>
   );
}
