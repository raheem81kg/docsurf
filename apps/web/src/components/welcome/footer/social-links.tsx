import { FaGithub, FaLinkedinIn, FaProductHunt, FaYoutube } from "react-icons/fa";
import { FaDiscord, FaXTwitter } from "react-icons/fa6";

export function SocialLinks() {
   return (
      <ul className="flex items-center space-x-4 md:ml-5">
         <li>
            <a target="_blank" rel="noreferrer" href="https://x.com/docsurf_ai">
               <span className="sr-only">Twitter</span>
               <FaXTwitter size={22} className="fill-[#878787]" />
            </a>
         </li>
         {/* TODO: Add Product Hunt link when product is launched */}
         {/* <li>
        <a target="_blank" rel="noreferrer" href="https://go.midday.ai/7rhA3rz">
          <span className="sr-only">Producthunt</span>
          <FaProductHunt size={22} className="fill-[#878787]" />
        </a>
      </li> */}
         {/* TODO: Add Discord link when server is created */}
         {/* <li>
        <a target="_blank" rel="noreferrer" href="https://go.midday.ai/anPiuRx">
          <span className="sr-only">Discord</span>
          <FaDiscord size={24} className="fill-[#878787]" />
        </a>
      </li> */}
         {/* TODO: Add GitHub link when repository is public */}
         {/* <li>
        <a target="_blank" rel="noreferrer" href="https://git.new/midday">
          <span className="sr-only">Github</span>
          <FaGithub size={22} className="fill-[#878787]" />
        </a>
      </li> */}
         <li>
            <a target="_blank" rel="noreferrer" href="https://www.linkedin.com/company/docsurf/">
               <span className="sr-only">LinkedIn</span>
               <FaLinkedinIn size={22} className="fill-[#878787]" />
            </a>
         </li>
         {/* TODO: Add YouTube link when channel is created */}
         {/* <li>
        <a target="_blank" rel="noreferrer" href="https://go.midday.ai/0yq8rfn">
          <span className="sr-only">Youtube</span>
          <FaYoutube size={22} className="fill-[#878787]" />
        </a>
      </li> */}
      </ul>
   );
}
