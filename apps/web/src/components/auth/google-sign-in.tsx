import { ButtonIcon } from "./button-icon";
// import { authClient } from "@/utils/auth-client";
import { Button } from "@docsurf/ui/components/button";
import { Icons } from "../assets/icons";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export function GoogleSignIn({ onClick, disabled }: { onClick: () => Promise<void>; disabled: boolean }) {
   const [isLoading, setLoading] = useState(false);

   const handleSignIn = async () => {
      setLoading(true);

      await onClick();
   };

   return (
      <Button
         onClick={handleSignIn}
         size="lg"
         className="flex w-full space-x-2 font-medium active:scale-[0.98] rounded-none"
         disabled={disabled}
      >
         {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
         ) : (
            <>
               <ButtonIcon isLoading={isLoading}>
                  <Icons.Google className="!size-[22px]" />
               </ButtonIcon>
               <span>Sign in with Google</span>
            </>
         )}
      </Button>
   );
}
