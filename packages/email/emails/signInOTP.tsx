import { Heading, Text } from "@react-email/components";
import { BaseEmail, styles } from "../components/BaseEmail";

interface SignInOTPProps {
   code: string;
   brandName?: string;
   brandTagline?: string;
   brandLogoUrl?: string;
}

export default function SignInOTP({ code, brandName, brandTagline, brandLogoUrl }: SignInOTPProps) {
   return (
      <BaseEmail previewText="Your sign-in code" brandName={brandName} brandTagline={brandTagline} brandLogoUrl={brandLogoUrl}>
         <Heading style={styles.h1}>Your sign-in code for Docsurf</Heading>
         <Text style={styles.text}>Use this code to sign in to your Docsurf account:</Text>
         <code style={styles.code}>{code}</code>
         <Text style={styles.text}>This code will expire in 10 minutes for security reasons.</Text>
         <Text
            style={{
               ...styles.text,
               color: "#ababab",
               marginTop: "14px",
               marginBottom: "16px",
            }}
         >
            If you didn&apos;t request this code, you can safely ignore this email.
         </Text>
      </BaseEmail>
   );
}
