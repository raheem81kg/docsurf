import { Body, Container, Head, Heading, Html, Img, Link, Preview, Section, Tailwind, Text } from "@react-email/components";
import { Footer } from "../components/footer";
import { GetStarted } from "../components/get-started";
import { Logo } from "../components/logo";
import { getEmailUrl } from "@docsurf/utils/envs";

interface Props {
   fullName: string;
}

export const GetStartedEmail = ({ fullName = "DocSurf User" }: Props) => {
   const firstName = fullName.split(" ")[0];
   const text = `Hi ${firstName}, Just checking in to help you get started. Here are a few things you can try today.`;
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
                  <Heading className="mx-0 my-7 p-0 text-xl font-medium text-black text-center">Unlock your writing potential</Heading>
                  <Text className="text-sm leading-6 text-black">Thanks for signing up, {fullName}!</Text>
                  <Text className="text-sm leading-6 text-black">
                     My name is Raheem, and I'm the founder of DocSurf – the modern AI-powered document platform for smart writing,
                     editing, and seamless document management. We're excited to have you on board!
                  </Text>
                  <Text className="text-sm leading-6 text-black mt-6">Here are a few things you can do:</Text>
                  <Text className="ml-1 text-sm leading-4 text-black">
                     ◆ Start writing in the{" "}
                     <Link href={`${baseUrl}/doc`} className="font-medium text-blue-600 no-underline">
                        AI-powered editor
                     </Link>{" "}
                     for smart suggestions and autocompletion.
                  </Text>
                  <Text className="ml-1 text-sm leading-4 text-black">
                     ◆ Keep your work safe with{" "}
                     <Link href={`${baseUrl}/doc`} className="font-medium text-blue-600 no-underline">
                        version history
                     </Link>{" "}
                     and{" "}
                     <Link href={`${baseUrl}/doc`} className="font-medium text-blue-600 no-underline">
                        auto-save
                     </Link>
                     .
                  </Text>
                  <Text className="ml-1 text-sm leading-4 text-black">
                     ◆{" "}
                     <Link href={`${baseUrl}/doc`} className="font-medium text-blue-600 no-underline">
                        Import or export Word documents
                     </Link>{" "}
                     with formatting support.
                  </Text>
                  <Text className="ml-1 text-sm leading-4 text-black">
                     ◆ Use our{" "}
                     <Link href={`${baseUrl}/doc`} className="font-medium text-blue-600 no-underline">
                        AI chat
                     </Link>{" "}
                     for writing help and brainstorming—no need to switch between apps.
                  </Text>
                  <Text className="text-sm leading-6 text-black mt-6">
                     Let me know if you have any questions or feedback. I'm always happy to help!
                  </Text>
                  {/* <Text className="text-sm font-light leading-6 text-neutral-400 mt-2">Raheem from DocSurf</Text> */}
                  <GetStarted />
                  <Footer />
               </Container>
            </Body>
         </Tailwind>
      </Html>
   );
};

export default GetStartedEmail;
