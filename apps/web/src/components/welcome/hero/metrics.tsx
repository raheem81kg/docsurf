export function Metrics() {
   return (
      <div className="bottom-0 left-0 mt-20 grid grid-cols-2 gap-8 md:flex md:flex-nowrap md:divide-x lg:absolute lg:mt-0">
         <div className="flex flex-col text-center md:pr-8">
            <h4 className="mb-4 text-[#878787] text-sm">Active Users</h4>
            <span className="font-mono text-2xl text-stroke">350+</span>
         </div>
         <div className="flex flex-col text-center md:px-8">
            <h4 className="mb-4 text-[#878787] text-sm">Documents Created</h4>
            <span className="font-mono text-2xl text-stroke">1,500+</span>
         </div>
         <div className="flex flex-col text-center md:px-8">
            <h4 className="mb-4 text-[#878787] text-sm">AI Chat Messages</h4>
            <span className="font-mono text-2xl text-stroke">10K+</span>
         </div>
         <div className="flex flex-col text-center md:px-8">
            <h4 className="mb-4 text-[#878787] text-sm">Words Written</h4>
            <span className="font-mono text-2xl text-stroke">350K+</span>
         </div>
      </div>
   );
}
