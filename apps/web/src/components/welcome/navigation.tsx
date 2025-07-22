import { Button, buttonVariants } from "@docsurf/ui/components/button";
import {
   ListItem,
   NavigationMenu,
   NavigationMenuContent,
   NavigationMenuItem,
   NavigationMenuList,
   NavigationMenuTrigger,
   //  ListItem,
} from "@docsurf/ui/components/navigation-menu";
import { Separator } from "@docsurf/ui/components/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@docsurf/ui/components/sheet";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Icons } from "@/components/assets/icons";
import logo from "/logo-black.png";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@docsurf/ui/lib/utils";

const resources = [
   // {
   //    title: "GitHub",
   //    href: "https://github.com/docsurf",
   //    description: "Check out our open-source projects and contributions.",
   //    platform: "github" as const,
   // },
   {
      title: "Twitter",
      href: "https://x.com/docsurf_ai",
      description: "Follow us for the latest updates and announcements.",
      platform: "twitter" as const,
   },
   {
      title: "LinkedIn",
      href: "https://www.linkedin.com/company/docsurf/",
      description: "Connect with us professionally and stay updated.",
      platform: "linkedin" as const,
   },
   // {
   //    title: "Discord",
   //    href: "https://discord.gg/docsurf",
   //    description: "Join our community and chat with the team.",
   //    platform: "discord" as const,
   // },
];

const aboutLinks = [
   {
      title: "About",
      href: "/about",
      description: "Learn more about DocSurf and our mission.",
   },
   {
      title: "Privacy",
      href: "/policy",
      description: "Read our privacy policy and data handling practices.",
   },
   {
      title: "Terms of Service",
      href: "/terms",
      description: "Review our terms of service and usage guidelines.",
   },
];

const IconComponent = {
   github: Icons.Github,
   twitter: Icons.X,
   discord: Icons.Discord,
   linkedin: Icons.LinkedIn,
};

type Profile = {
   email: string | null;
   full_name: string | null;
};

export default function Navigation({ profile }: { profile: Profile }) {
   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

   // Animation variants for mobile menu
   const mobileMenuVariants = {
      closed: { opacity: 0, x: "100%" },
      open: {
         opacity: 1,
         x: "0%",
         transition: { stiffness: 400, damping: 30, staggerChildren: 0.1 },
      },
   };
   const mobileItemVariants = {
      closed: { opacity: 0, x: 20 },
      open: { opacity: 1, x: 0 },
   };

   return (
      <header className="sticky top-3 z-50 justify-center px-2 md:flex md:px-4 ">
         <nav className="relative z-20 flex h-[50px] w-full items-center justify-between rounded-[4px] border backdrop-blur-sm border-border bg-opacity-70 px-4 backdrop-blur-xl backdrop-filter">
            {/* Left group: logo + nav menu */}
            <div className="flex gap-4 items-center">
               <Link to="/" className="flex text-[#0B100F] dark:text-foreground items-center gap-2.5">
                  <img
                     src={logo}
                     alt="DocSurf - AI-powered document editor logo"
                     className="rounded-lg dark:invert"
                     width={33}
                     height={33}
                  />
                  {/* <p className="text-xl">Docsurf</p> */}
               </Link>

               {/* <Link to="/" className="relative bottom-1 cursor-pointer" title="Home">
                  <img src={logo} alt="DocSurf" width={22} height={22} />
                  <span className="-right-[-0.5px] absolute text-[10px] text-muted-foreground">beta</span>
               </Link> */}
               <div className="hidden md:block">
                  <NavigationMenu className="!rounded-sm">
                     <NavigationMenuList className="gap-1">
                        <NavigationMenuItem>
                           <NavigationMenuTrigger className="bg-transparent">Company</NavigationMenuTrigger>
                           <NavigationMenuContent className="!rounded-sm bg-background">
                              <ul className="grid w-[400px] gap-3 rounded-sm p-4 md:w-[500px] md:grid-cols-1 lg:w-[600px]">
                                 {aboutLinks.map((link) => (
                                    <ListItem key={link.title} title={link.title} href={link.href}>
                                       {link.description}
                                    </ListItem>
                                 ))}
                              </ul>
                           </NavigationMenuContent>
                        </NavigationMenuItem>
                        <NavigationMenuItem>
                           <NavigationMenuTrigger className="bg-transparent">Resources</NavigationMenuTrigger>
                           <NavigationMenuContent className="!rounded-sm bg-background">
                              <ul className="grid w-[400px] gap-3 rounded-sm p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                                 {resources.map((resource) => (
                                    <ListItem
                                       key={resource.title}
                                       title={resource.title}
                                       href={resource.href}
                                       target="_blank"
                                       aria-label={resource.title}
                                       IconComponent={IconComponent[resource.platform]}
                                    >
                                       {resource.description}
                                    </ListItem>
                                 ))}
                              </ul>
                           </NavigationMenuContent>
                        </NavigationMenuItem>
                        <NavigationMenuItem>
                           <Link to="/pricing">
                              <Button variant="ghost" className="h-9">
                                 Pricing
                              </Button>
                           </Link>
                        </NavigationMenuItem>
                     </NavigationMenuList>
                  </NavigationMenu>
               </div>
            </div>
            {/* Right group: button (and separator if needed) */}
            <div className="hidden md:flex items-center gap-2">
               <Separator orientation="vertical" className="h-8 w-[1px] bg-border" />
               <Link to={profile.email ? "/doc" : "/auth"}>
                  <Button size="lg" className="!h-9 flex items-center gap-2">
                     <span className="">Start Writing</span>
                     <ArrowRight className="size-4" />
                  </Button>
               </Link>
            </div>
            {/* Mobile menu button */}
            <div className="flex items-center gap-2 md:hidden">
               <button
                  type="button"
                  className="ml-auto rounded-sm p-2 transition-all hover:bg-muted disabled:pointer-events-none disabled:opacity-50 md:hidden"
                  onClick={() => setIsMobileMenuOpen((v) => !v)}
                  aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
               >
                  {isMobileMenuOpen ? (
                     <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} fill="none">
                        <path
                           fill="currentColor"
                           d="M2.343 2.343a1 1 0 0 1 1.414 0L9 7.586l5.243-5.243a1 1 0 1 1 1.414 1.414L10.414 9l5.243 5.243a1 1 0 0 1-1.414 1.414L9 10.414l-5.243 5.243a1 1 0 0 1-1.414-1.414L7.586 9 2.343 3.757a1 1 0 0 1 0-1.414Z"
                        />
                     </svg>
                  ) : (
                     <svg xmlns="http://www.w3.org/2000/svg" width={18} height={13} fill="none">
                        <path
                           fill="currentColor"
                           d="M0 12.195v-2.007h18v2.007H0Zm0-5.017V5.172h18v2.006H0Zm0-5.016V.155h18v2.007H0Z"
                        />
                     </svg>
                  )}
               </button>
            </div>
         </nav>
         {/* Animated mobile menu and backdrop - moved outside nav for full viewport coverage */}
         <AnimatePresence>
            {isMobileMenuOpen && (
               <>
                  {/* Backdrop */}
                  <motion.div
                     className="fixed inset-0 z-40 bg-black/20 md:hidden"
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     onClick={() => setIsMobileMenuOpen(false)}
                  />
                  {/* Slide-in menu */}
                  <motion.div
                     className="fixed right-4 top-16 z-50 w-80 overflow-hidden rounded-2xl border border-border bg-background shadow-2xl md:hidden"
                     variants={mobileMenuVariants}
                     initial="closed"
                     animate="open"
                     exit="closed"
                  >
                     <div className="space-y-6 p-6">
                        <div className="space-y-1">
                           {/* Pricing and about links */}
                           <motion.div variants={mobileItemVariants}>
                              <Link
                                 to="/pricing"
                                 className="block rounded-lg px-4 py-3 font-medium text-foreground transition-colors duration-200 hover:bg-muted"
                                 onClick={() => setIsMobileMenuOpen(false)}
                              >
                                 Pricing
                              </Link>
                           </motion.div>
                           {aboutLinks.map((link) => (
                              <motion.div key={link.title} variants={mobileItemVariants}>
                                 <Link
                                    to={link.href}
                                    title={link.title}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={link.title}
                                    className="block rounded-lg px-4 py-3 font-medium text-foreground transition-colors duration-200 hover:bg-muted"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                 >
                                    {link.title}
                                 </Link>
                              </motion.div>
                           ))}
                        </div>
                        <div className="space-y-3 border-t border-border pt-6">
                           <motion.div variants={mobileItemVariants}>
                              <Link
                                 to="/auth"
                                 className={cn(buttonVariants({ variant: "ghost" }), "w-full")}
                                 onClick={() => setIsMobileMenuOpen(false)}
                              >
                                 Sign In
                              </Link>
                           </motion.div>
                           <motion.div variants={mobileItemVariants}>
                              <Link
                                 to="/auth"
                                 className={cn(buttonVariants({ variant: "default" }), "w-full")}
                                 // className="block w-full rounded-lg bg-foreground py-3 text-center font-medium text-background transition-all duration-200 hover:bg-foreground/90"
                                 onClick={() => setIsMobileMenuOpen(false)}
                              >
                                 {profile.email ? "Start Writing" : "Get Started"}
                              </Link>
                           </motion.div>
                        </div>
                        <div className="flex flex-row items-center justify-center gap-4 pt-4">
                           {resources.map((resource) => {
                              const Icon = IconComponent[resource.platform];
                              return (
                                 <Link
                                    key={resource.title}
                                    title={resource.title}
                                    to={resource.href}
                                    rel="noopener noreferrer"
                                    target="_blank"
                                    className="flex items-center gap-2 font-medium transition-opacity duration-200 hover:opacity-80"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                 >
                                    {resource.platform && (
                                       <Icon className="h-5 w-5 fill-muted-foreground transition-colors duration-200 ease-in-out hover:fill-brand" />
                                    )}
                                 </Link>
                              );
                           })}
                        </div>
                     </div>
                  </motion.div>
               </>
            )}
         </AnimatePresence>
      </header>
   );
}
