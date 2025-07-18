import { motion } from "motion/react";
// import { useAuth } from "@/providers/auth-provider";
import { useState } from "react";
import { DiamondsFour } from "@phosphor-icons/react";
import NumberFlow from "@number-flow/react";
import { Button } from "@docsurf/ui/components/button";

export default function PlansModal() {
   // how to use
   // onClick={() => {showModal(<PlansModal />)}}
   //    const { db, user } = useAuth();
   const [sliderValue, setSliderValue] = useState(10); // Default to $10

   const url = "";
   //    const url = db.auth.createAuthorizationURL({
   //       clientName: "google-web",
   //       redirectURL: window.location.href,
   //    });

   const credits = sliderValue * 1000;

   return (
      <motion.div
         initial={{ opacity: 0, y: 10 }}
         animate={{ opacity: 1, y: 0 }}
         exit={{ opacity: 0, y: -10 }}
         className="w-full max-w-xl h-max absolute inset-0 mt-20 z-50 rounded-xl mx-auto"
      >
         <div className="flex flex-col w-full p-2">
            <h1 className="text-gray-12 font-medium text-md">Purchase Credits</h1>
            <p className="text-gray-11 text-sm">Select an amount for a one-time credit purchase.</p>

            <div className="flex flex-col items-center w-full mt-8 gap-4 bg-white dark:bg-gray-2 border border-gray-3 rounded-lg p-6">
               <div className="w-full flex justify-between items-center mb-4">
                  <span className="text-gray-12 font-medium text-lg">
                     {/* ${sliderValue} */}
                     <NumberFlow value={sliderValue} prefix="$" />
                  </span>

                  <p className="text-gray-10 text-[11px] max-w-xs text-right">
                     Chaterface is fully open source so you can also use it for free by hosting it yourself.{" "}
                     <a
                        href="https://github.com/hyperaide/chaterface"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-12 hover:underline transition-all duration-300"
                     >
                        View on GitHub
                     </a>
                  </p>
               </div>

               <input
                  type="range"
                  min="5"
                  max="100"
                  value={sliderValue}
                  onChange={(e) => setSliderValue(Number.parseInt(e.target.value))}
                  className="w-full h-1 bg-gray-4 rounded-lg appearance-none cursor-pointer dark:bg-gray-5 accent-teal-9"
                  //   autoFocus={false}
               />
               <div className="w-full flex justify-between text-[10px] text-gray-11">
                  <span>$5 (5,000 credits)</span>
                  <span>$100 (100,000 credits)</span>
               </div>

               <div className="w-full flex flex-row gap-2 justify-between items-center mt-2">
                  <div className="text-gray-11 text-md flex flex-row items-center gap-1">
                     <DiamondsFour
                        size={16}
                        weight="fill"
                        className="text-teal-8 group-hover:text-gray-12 transition-colors duration-300"
                     />
                     <NumberFlow value={credits} className="text-md text-gray-12" />
                  </div>
                  {/* <p className="text-gray-10 text-xs mt-4 max-w-xs">
              Chaterface is fully open source. You can also host it yourself
              for free. {" "}
              <a href="https://github.com/hyperaide/chaterface" target="_blank" rel="noopener noreferrer" className="text-gray-12 hover:underline transition-all duration-300">
                View on GitHub
              </a>
            </p> */}
                  <div className="w-max">
                     {/* {user ? ( */}
                     <Button
                        onClick={async () => {
                           try {
                              const response = await fetch("/api/stripe/create-checkout-session", {
                                 method: "POST",
                                 headers: {
                                    "Content-Type": "application/json",
                                    // "X-Token": user?.refresh_token ?? "",
                                 },
                                 body: JSON.stringify({ amount: sliderValue }),
                              });
                              if (!response.ok) {
                                 // Handle errors, e.g., show a notification to the user
                                 console.error("Failed to create Stripe session:", response.statusText);
                                 // You might want to show an error mesgray to the user here
                                 return;
                              }
                              const { url: checkoutUrl } = await response.json();
                              if (checkoutUrl) {
                                 window.location.href = checkoutUrl;
                              } else {
                                 console.error("No checkout URL returned from API");
                                 // Handle missing URL, e.g., show a notification
                              }
                           } catch (error) {
                              console.error("Error during Stripe session creation:", error);
                              // Handle network errors or other issues
                           }
                        }}
                        className="w-max ml-auto justify-center text-xs bg-gray-1 border border-gray-5 rounded-md px-4 py-2 text-gray-12 hover:bg-gray-3 dark:bg-gray-3 dark:border-gray-5 dark:text-gray-11 dark:hover:bg-gray-4"
                     >
                        Buy Credits
                     </Button>
                     {/* ) : ( */}
                     <Button
                        // href={url}
                        className="w-full justify-center text-sm bg-gray-1 border border-gray-5 rounded px-4 py-2 text-gray-12 hover:bg-gray-3 dark:bg-gray-3 dark:border-gray-5 dark:text-gray-11 dark:hover:bg-gray-4"
                     >
                        Sign Up With Google
                     </Button>
                     {/* )} */}
                  </div>
               </div>
            </div>
         </div>
      </motion.div>
   );
}
