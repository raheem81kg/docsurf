import { getEmailUrl } from "@docsurf/utils/envs";
import { Img, Section } from "@react-email/components";

const baseUrl = getEmailUrl();

export function Logo() {
   return (
      <Section className="mt-[32px]">
         <Img src={`${baseUrl}/email/logo.png`} width="40" height="40" alt="Docsurf" className="my-0 mx-auto block" />
      </Section>
   );
}
