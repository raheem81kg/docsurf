import { getEmailUrl } from "@docsurf/utils/envs";
import { Button, Section } from "@react-email/components";

export function GetStarted() {
   const baseUrl = getEmailUrl();
   return (
      <Section className="text-center mt-8 mb-8">
         <Button
            className="mx-auto border border-black border-solid bg-white px-6 py-3 font-medium font-sans text-black text-sm"
            href={`${baseUrl}/doc`}
         >
            Start Writing For Free
         </Button>
      </Section>
   );
}
