import { Link } from "@tanstack/react-router";

import { DOCSURF_VERSION, COMPANY_NAME } from "@/utils/constants";
import { env } from "@/env";

const DocSurfVersion = `v.${DOCSURF_VERSION ?? "0.0.1"}-${"h"}`;

export default function Credits() {
   return (
      <small className="text-text-default mx-3 mb-2 mt-1 hidden text-[0.5rem] opacity-50 lg:block">
         &copy; {new Date().getFullYear()}{" "}
         <Link to={env.VITE_SITE_URL ?? "#"} target="_blank" className="hover:underline">
            {COMPANY_NAME}
         </Link>{" "}
         <Link to={env.VITE_SITE_URL ?? "#"} target="_blank" className="hover:underline">
            {DocSurfVersion}
         </Link>
      </small>
   );
}
