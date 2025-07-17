/** biome-ignore-all lint/style/useSelfClosingElements: <explanation> */
export default function FloatingMenuMini() {
   return (
      <div
         // biome-ignore lint/a11y/noNoninteractiveTabindex: <explanation>
         tabIndex={0}
         className="fixed bottom-4 z-50 left-4 rounded-xl right-4 bg-black shadow-md w-max mx-auto"
         style={{ bottom: 20, opacity: 1, transform: "none" }}
      >
         <div className="flex flex-row justify-between items-center gap-2 p-2">
            <div className="flex flex-row gap-2">
               <a className="flex flex-col items-center gap-2 p-2 hover:bg-gray-12 rounded-lg bg-gray-12" href="/">
                  <svg
                     width="20"
                     height="20"
                     viewBox="0 0 24 24"
                     xmlns="http://www.w3.org/2000/svg"
                     className="text-gray-2"
                     fill="none"
                     role="img"
                     aria-label="check-tick-square icon"
                  >
                     <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="m8.5 12.51 2.34 2.34a15 15 0 0 1 4.56-4.93l.1-.07M12 21c-2.8 0-4.2 0-5.3-.46a6 6 0 0 1-3.24-3.24C3 16.2 3 14.8 3 12s0-4.2.46-5.3A6 6 0 0 1 6.7 3.46C7.8 3 9.2 3 12 3s4.2 0 5.3.46a6 6 0 0 1 3.24 3.24C21 7.8 21 9.2 21 12s0 4.2-.46 5.3a6 6 0 0 1-3.24 3.24c-1.1.46-2.5.46-5.3.46"
                        fill="none"
                     />
                  </svg>
               </a>
               <a className="flex flex-col items-center gap-2 p-2 hover:bg-gray-12 rounded-lg " href="/settings">
                  <svg
                     width="20"
                     height="20"
                     viewBox="0 0 24 24"
                     xmlns="http://www.w3.org/2000/svg"
                     className="text-gray-2"
                     fill="none"
                     role="img"
                     aria-label="settings-03 icon"
                  >
                     <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M11 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0"
                        fill="none"
                     />
                     <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8.56 4.32c1.25-.72 1.88-1.08 2.55-1.23a4 4 0 0 1 1.78 0c.67.15 1.3.5 2.55 1.23l1.5.86c1.25.73 1.88 1.09 2.33 1.6q.6.67.9 1.54c.2.65.2 1.37.2 2.82v1.72c0 1.45 0 2.17-.2 2.82a4 4 0 0 1-.9 1.55c-.45.5-1.08.86-2.33 1.59l-1.5.86c-1.25.72-1.88 1.08-2.55 1.23a4 4 0 0 1-1.78 0c-.67-.15-1.3-.5-2.55-1.23l-1.5-.86c-1.25-.73-1.88-1.09-2.33-1.6a4 4 0 0 1-.9-1.54c-.2-.65-.2-1.37-.2-2.82v-1.72c0-1.45 0-2.17.2-2.82q.3-.87.9-1.55c.45-.5 1.08-.86 2.33-1.59z"
                        fill="none"
                     />
                  </svg>
               </a>
               <div className="flex flex-col items-center gap-2 p-2 hover:bg-gray-12 rounded-lg ">
                  <svg
                     width="20"
                     height="20"
                     viewBox="0 0 24 24"
                     xmlns="http://www.w3.org/2000/svg"
                     className="text-gray-2"
                     fill="none"
                     role="img"
                     aria-label="message-ai icon"
                  >
                     <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16.2 3H7.8c-1.68 0-2.52 0-3.16.33a3 3 0 0 0-1.31 1.3C3 5.29 3 6.13 3 7.8v4.4c0 1.68 0 2.52.33 3.16a3 3 0 0 0 1.3 1.31c.65.33 1.49.33 3.17.33H8v4l5-4h3.2c1.68 0 2.52 0 3.16-.33a3 3 0 0 0 1.31-1.3c.33-.65.33-1.49.33-3.17V7.8c0-1.68 0-2.52-.33-3.16a3 3 0 0 0-1.3-1.31C18.71 3 17.87 3 16.2 3"
                        fill="none"
                     />
                     <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12.5 6.67a4.5 4.5 0 0 1-3 3 4.5 4.5 0 0 1 3 3 4.5 4.5 0 0 1 3-3 4.5 4.5 0 0 1-3-3"
                        fill="none"
                     />
                  </svg>
               </div>
            </div>
         </div>
      </div>
   );
}
