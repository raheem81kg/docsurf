import { motion } from "motion/react";
import docsurfChat from "/images/docsurf-chat.png";
import docsurfChatLight from "/images/docsurf-chat-light.png";
import docsurfDiffMessage from "/images/docsurf-diff-message.png";
import docsurfDiffMessageLight from "/images/docsurf-diff-message-light.png";
import { DynamicImage } from "../dynamic-image";
import { CtaLink } from "./cta-link";

export function SectionFour() {
	return (
		<section className="relative mb-12 flex flex-col justify-between space-y-12 overflow-hidden lg:flex-row lg:space-x-8 lg:space-y-0">
			<div className="group flex flex-col justify-between border border-border p-10 md:basis-2/3 md:flex-row md:space-x-8 dark:bg-[#121212]">
				<div className="flex flex-col md:basis-1/2">
					<h4 className="mb-4 font-medium text-xl md:text-2xl">
						Advanced AI Writing Suite
					</h4>

					<p className="text-[#878787] text-sm md:mb-4">
						Transform your writing with our sophisticated AI suite that delivers
						intelligent enhancements, style optimization, and creative
						suggestions to elevate your content.
					</p>

					<div className="flex flex-col space-y-2">
						<div className="mt-8 flex items-center space-x-2 text-sm">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width={18}
								height={13}
								fill="none"
							>
								<path
									fill="currentColor"
									d="M6.55 13 .85 7.3l1.425-1.425L6.55 10.15 15.725.975 17.15 2.4 6.55 13Z"
								/>
							</svg>
							<span className="text-primary">
								Intelligent style enhancement
							</span>
						</div>
						<div className="flex items-center space-x-2 text-sm">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width={18}
								height={13}
								fill="none"
							>
								<path
									fill="currentColor"
									d="M6.55 13 .85 7.3l1.425-1.425L6.55 10.15 15.725.975 17.15 2.4 6.55 13Z"
								/>
							</svg>
							<span className="text-primary">
								Advanced content optimization
							</span>
						</div>

						<div className="flex items-center space-x-2 text-sm">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width={18}
								height={13}
								fill="none"
							>
								<path
									fill="currentColor"
									d="M6.55 13 .85 7.3l1.425-1.425L6.55 10.15 15.725.975 17.15 2.4 6.55 13Z"
								/>
							</svg>
							<span className="text-primary">Creative content generation</span>
						</div>

						<div className="flex items-center space-x-2 text-sm">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width={18}
								height={13}
								fill="none"
							>
								<path
									fill="currentColor"
									d="M6.55 13 .85 7.3l1.425-1.425L6.55 10.15 15.725.975 17.15 2.4 6.55 13Z"
								/>
							</svg>
							<span className="text-primary">
								Precision grammar & style checks
							</span>
						</div>

						<div className="flex items-center space-x-2 text-sm">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width={18}
								height={13}
								fill="none"
							>
								<path
									fill="currentColor"
									d="M6.55 13 .85 7.3l1.425-1.425L6.55 10.15 15.725.975 17.15 2.4 6.55 13Z"
								/>
							</svg>
							<span className="text-primary">Dynamic tone adaptation</span>
						</div>

						<div className="flex items-center space-x-2 text-sm">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width={18}
								height={13}
								fill="none"
							>
								<path
									fill="currentColor"
									d="M6.55 13 .85 7.3l1.425-1.425L6.55 10.15 15.725.975 17.15 2.4 6.55 13Z"
								/>
							</svg>
							<span className="text-primary">Advanced version tracking</span>
						</div>

						<div className="absolute bottom-6">
							<CtaLink text="Start writing with AI assistance" />
						</div>
					</div>
				</div>

				<div className="-ml-[40px] md:-ml-0 -bottom-[8px] relative md:mt-0 md:mt-8 md:basis-1/2">
					<DynamicImage
						lightSrc={docsurfChatLight}
						darkSrc={docsurfChat}
						width={299}
						height={423}
						className="-bottom-[33px] relative ml-[10%] object-contain xl:ml-[20%]"
						alt="AI Writing Assistant"
					/>

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3, delay: 0.7 }}
						viewport={{ once: true }}
						className="md:-left-[80px] absolute bottom-[35px] left-4"
					>
						<DynamicImage
							lightSrc={docsurfDiffMessageLight}
							darkSrc={docsurfDiffMessage}
							height={57}
							width={327}
							className="object-contain"
							alt="AI suggestions"
						/>
					</motion.div>
				</div>
			</div>

			<div className="group relative flex basis-1/3 flex-col border border-border p-10 dark:bg-[#121212]">
				<h4 className="mb-4 font-medium text-xl md:text-2xl">Smart Features</h4>
				<ul className="list-inside list-decimal space-y-2 text-[#878787] text-sm leading-relaxed">
					<li>
						Get intelligent suggestions as you type, powered by advanced AI.
					</li>
					<li>One-click improvements for clarity, conciseness, and style.</li>
					<li>Automatic version tracking and document history.</li>
				</ul>

				<div className="mb-6 flex flex-col space-y-2">
					<div className="mt-8 flex items-center space-x-2 text-sm">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width={18}
							height={13}
							fill="none"
						>
							<path
								fill="currentColor"
								d="M6.55 13 .85 7.3l1.425-1.425L6.55 10.15 15.725.975 17.15 2.4 6.55 13Z"
							/>
						</svg>
						<span className="text-primary">Real-time suggestions</span>
					</div>
					<div className="flex items-center space-x-2 text-sm">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width={18}
							height={13}
							fill="none"
						>
							<path
								fill="currentColor"
								d="M6.55 13 .85 7.3l1.425-1.425L6.55 10.15 15.725.975 17.15 2.4 6.55 13Z"
							/>
						</svg>
						<span className="text-primary">Smart formatting & structure</span>
					</div>

					<div className="flex items-center space-x-2 text-sm">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width={18}
							height={13}
							fill="none"
						>
							<path
								fill="currentColor"
								d="M6.55 13 .85 7.3l1.425-1.425L6.55 10.15 15.725.975 17.15 2.4 6.55 13Z"
							/>
						</svg>
						<span className="text-primary">Auto-save & cloud sync</span>
					</div>
				</div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3, delay: 0.2 }}
					viewport={{ once: true }}
					className="bottom-[100px] xl:absolute"
				>
					<div className="flex-grow text-muted-foreground text-sm">
						<p className="leading-[1.6]">
							<span className="demo-text-base">
								You start typing, and the AI offers
							</span>
							<span className="inline-flex items-baseline gap-1">
								<span
									className="demo-inline-suggestion-animated"
									data-suggestion=" a helpful completion."
								/>
								<kbd className="inline-tab-icon">Tab</kbd>
							</span>
						</p>
					</div>
				</motion.div>

				<div className="absolute bottom-6">
					<CtaLink text="Experience AI-powered writing" />
				</div>
			</div>
		</section>
	);
}
