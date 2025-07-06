import { getEmailUrl } from "@docsurf/utils/envs";
import { Hr, Img, Link, Row, Section, Text, Column } from "@react-email/components";

const baseUrl = getEmailUrl();

export function Footer() {
   return (
      <Section className="w-full text-center font-sans mt-8 mb-2">
         <Hr />
         <Text className="text-sm font-light text-neutral-400 mt-6 mb-4">Write smarter with AI.</Text>
         <Row>
            <Column className="align-middle">
               <table role="presentation" style={{ margin: "0 auto", borderSpacing: 0, borderCollapse: "collapse" }}>
                  <tr>
                     <td style={{ paddingRight: 12 }}>
                        <Link href="https://x.com/docsurf_ai">
                           <Img src={`${baseUrl}/email/x.png`} width="18" height="18" alt="DocSurf on X" />
                        </Link>
                     </td>
                     <td>
                        <Link href="https://www.linkedin.com/company/docsurf/">
                           <Img src={`${baseUrl}/email/linkedin.png`} width="22" height="22" alt="DocSurf on LinkedIn" />
                        </Link>
                     </td>
                  </tr>
               </table>
            </Column>
         </Row>
      </Section>
   );
}
