import { motion } from "motion/react";
import { DynamicImage } from "../dynamic-image";
import { CtaLink } from "./cta-link";
import { ExportToast } from "./export-toast";

export function SectionFive() {
   return (
      <section className="mb-12 flex flex-col justify-between space-y-12 overflow-hidden lg:flex-row lg:space-x-8 lg:space-y-0">
         <div className="group flex flex-col-reverse border border-border p-10 lg:basis-2/3 lg:flex-row lg:items-start lg:space-x-8 dark:bg-[#121212]">
            <DynamicImage
               lightSrc="/images/docsurf-file-system-light.png"
               darkSrc="/images/docsurf-file-system.png"
               alt="Document Management"
               className="mt-8 max-w-[70%] basis-1/2 object-contain sm:max-w-[50%] md:max-w-[35%] lg:mt-0"
            />

            <div className="relative flex h-full basis-1/2 flex-col">
               <h4 className="mb-4 font-medium text-xl md:text-2xl">Smart Document Management</h4>

               <p className="mb-4 text-[#878787] text-sm">
                  Organize and manage your documents with intelligent version control and auto-save features.
               </p>

               <p className="text-[#878787] text-sm">
                  Access your documents instantly from anywhere. Our smart system helps you organize and search your content with
                  powerful AI-driven features.
               </p>

               <div className="flex h-full flex-col space-y-2">
                  <div className="mt-8 flex items-center space-x-2 text-sm">
                     <svg xmlns="http://www.w3.org/2000/svg" width={18} height={13} fill="none">
                        <path fill="currentColor" d="M6.55 13 .85 7.3l1.425-1.425L6.55 10.15 15.725.975 17.15 2.4 6.55 13Z" />
                     </svg>
                     <span className="text-primary">AI-powered document organization</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                     <svg xmlns="http://www.w3.org/2000/svg" width={18} height={13} fill="none">
                        <path fill="currentColor" d="M6.55 13 .85 7.3l1.425-1.425L6.55 10.15 15.725.975 17.15 2.4 6.55 13Z" />
                     </svg>
                     <span className="text-primary">Version history & auto-save</span>
                  </div>

                  <div className="absolute bottom-0 left-0">
                     <CtaLink text="Start organizing your documents" />
                  </div>
               </div>
            </div>
         </div>

         <div className="group flex basis-1/3 flex-col border border-border p-10 dark:bg-[#121212]">
            <h4 className="mb-4 font-medium text-xl md:text-2xl">Word Document Support</h4>
            <p className="mb-8 text-[#878787] text-sm">
               Seamlessly import and export Word documents with full formatting support. Import .docx files up to 10MB and export your
               content with preserved formatting and images.
            </p>

            <div className="mb-6 flex flex-col space-y-2">
               <div className="mt-8 flex items-center space-x-2 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width={18} height={13} fill="none">
                     <path fill="currentColor" d="M6.55 13 .85 7.3l1.425-1.425L6.55 10.15 15.725.975 17.15 2.4 6.55 13Z" />
                  </svg>
                  <span className="text-primary">Import .docx files (up to 10MB)</span>
               </div>
               <div className="flex items-center space-x-2 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width={18} height={13} fill="none">
                     <path fill="currentColor" d="M6.55 13 .85 7.3l1.425-1.425L6.55 10.15 15.725.975 17.15 2.4 6.55 13Z" />
                  </svg>
                  <span className="text-primary">Export with formatting & images</span>
               </div>
            </div>

            <motion.div
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.5 }}
               className="mt-auto"
            >
               <ExportToast />
            </motion.div>

            <div className="mt-8 hidden md:flex">
               <CtaLink text="Try Word import/export" />
            </div>
         </div>
      </section>
   );
}
