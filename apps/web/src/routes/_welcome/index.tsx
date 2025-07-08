import { createFileRoute } from "@tanstack/react-router";
import { SectionFive } from "@/components/welcome/features/section-five";
import { SectionFour } from "@/components/welcome/features/section-four";
import { SectionOne } from "@/components/welcome/features/section-one";
import { SectionThree } from "@/components/welcome/features/section-three";
import { Hero } from "@/components/welcome/hero/hero";

export const Route = createFileRoute("/_welcome/")({
   ssr: false,
   component: HomeComponent,
});

function HomeComponent() {
   return (
      <div className="container mx-auto overflow-visible px-4">
         <Hero />
         <SectionOne />
         <SectionThree />
         <SectionFour />
         <SectionFive />
      </div>
   );
}
