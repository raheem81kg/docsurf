import { Button } from "@docsurf/ui/components/button";
import { Link } from "@tanstack/react-router";
import { Icons } from "@/components/assets/icons";
import { HeroImage } from "./hero-image";
import { Metrics } from "./metrics";
import { WordAnimation } from "./word-animation";

export function Hero() {
	return (
		<section className="relative mt-[60px] min-h-[530px] lg:mt-[180px] lg:h-[calc(100vh-300px)]">
			<div className="flex flex-col">
				{/* <Link href="/updates/april-product-update">
               <Button variant="outline" className="rounded-full border-border flex space-x-2 items-center">
                  <span className="font-mono text-xs">April Product Updates</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width={12} height={12} fill="none">
                     <path
                        fill="currentColor"
                        d="M8.783 6.667H.667V5.333h8.116L5.05 1.6 6 .667 11.333 6 6 11.333l-.95-.933 3.733-3.733Z"
                     />
                  </svg>
               </Button>
            </Link> */}

				<h2 className="mt-6 max-w-[580px] font-medium text-[#878787] text-[24px] leading-tight md:mt-10 md:text-[36px]">
					Transform your writing experience with AI-powered insights,
					intelligent suggestions & your personal writing companion for{" "}
					<WordAnimation />
				</h2>

				<div className="mt-8 md:mt-10">
					<div className="flex max-w-[540px] items-center gap-4">
						<Link to="/auth">
							<Button
								size="lg"
								className="flex w-full space-x-2 rounded-[3px] font-medium active:scale-[0.98]"
							>
								{/* Google Icon */}
								<span className="flex items-center space-x-2">
									<Icons.Google className="!size-[22px]" />
									<span>Sign in with Google</span>
								</span>
							</Button>
						</Link>
						<Link to="/auth">
							<Button
								size="lg"
								variant="secondary"
								className="flex w-full space-x-2 rounded-[3px] font-medium active:scale-[0.98]"
							>
								{/* Email Icon */}
								<span className="flex items-center space-x-2">
									<Icons.EmailIcon className="!size-5" />
									<span>Sign in with email</span>
								</span>
							</Button>
						</Link>
					</div>
				</div>

				<p className="mt-4 font-mono text-[#707070] text-xs">
					No credit card required.
				</p>
			</div>

			<HeroImage />
			<Metrics />
		</section>
	);
}
