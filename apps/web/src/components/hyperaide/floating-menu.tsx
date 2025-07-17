import React from "react";

/**
 * FloatingMenu displays a fixed menu at the bottom of the screen with logo and navigation links.
 */
type Props = {};

const FloatingMenu = (props: Props) => {
   return (
      <div
         className="fixed z-50 inset-x-4 mx-auto bottom-10 bg-black better-shadow rounded-xl p-2 flex flex-row w-max gap-1 items-center"
         style={{ opacity: 1, transform: "none" }}
      >
         <img
            alt="Logo"
            loading="lazy"
            width={16}
            height={16}
            decoding="async"
            data-nimg="1"
            className="h-5 ml-2 mr-3 w-auto"
            style={{ color: "transparent" }}
            src="/_next/static/media/white-logomark.aa7659ab.svg"
         />
         <a href="/pricing">
            <div className="text-xs bg-graydark-3 better-shadow border border-graydark-4 text-white font-medium px-4 py-2 rounded-md hover:bg-graydark-4 hover:border-graydark-5 transition-all duration-300">
               Pricing
            </div>
         </a>
         {/* TODO: Add more menu items as needed */}
      </div>
   );
};

export default FloatingMenu;
