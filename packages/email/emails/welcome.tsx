import { Body, Container, Head, Heading, Html, Img, Link, Preview, Section, Tailwind, Text } from "@react-email/components";
import { Footer } from "../components/footer";
import { Logo } from "../components/logo";
import { getEmailUrl } from "@docsurf/utils/envs";

interface Props {
   fullName: string;
}

/**
 * WelcomeEmail - A personalized welcome email for new users.
 * Includes a dashboard preview image and founder's message.
 */
export const WelcomeEmail = ({ fullName = "DocSurf User" }: Props) => {
   const firstName = fullName.split(" ")[0];
   const text = `Hi ${firstName}, Welcome to DocSurf!`;
   const baseUrl = getEmailUrl();
   return (
      <Html>
         <Head />
         <Preview>{text}</Preview>
         <Tailwind>
            <Body className="mx-auto my-auto bg-white font-sans">
               <Container className="mx-auto my-10 max-w-[600px] rounded border border-solid border-neutral-200 px-10 py-5">
                  <Section className="mt-8 text-center">
                     <Logo />
                  </Section>
                  <Heading className="mx-0 my-7 p-0 text-xl font-medium text-black text-center">Welcome to DocSurf</Heading>
                  <Text className="text-sm leading-6 text-black">Hi {firstName},</Text>
                  <Text className="text-sm leading-6 text-black">Welcome to DocSurf! I'm Raheem, the solo founder.</Text>
                  <Text className="text-sm leading-6 text-black mt-2">
                     DocSurf is self-funded and built for writers who want a modern, AI-powered document platform. I know firsthand the
                     challenges of building something new, and I'm excited to have you join us.
                  </Text>
                  <Text className="text-sm leading-6 text-black mt-2">
                     Take your time to explore DocSurf at your own pace.{" "}
                     {/* If you ever want to chat with me, you can schedule a time here: <Link href="https://cal.com/raheem">https://cal.com/raheem</Link> */}
                  </Text>
                  {/* <Text className="text-sm leading-6 text-black mt-2">If there's anything I can do to help, just reply. I'm always one message away.</Text> */}
                  <Section className="text-center mt-8 mb-8">
                     <Img
                        src={`${baseUrl}/email/docsurf-dashboard-preview.png`}
                        alt="DocSurf Dashboard Preview"
                        width="520"
                        height="auto"
                        style={{ margin: "0 auto", borderRadius: "8px", border: "1px solid #eee" }}
                     />
                  </Section>
                  <Footer />
               </Container>
            </Body>
         </Tailwind>
      </Html>
   );
};

export default WelcomeEmail;
