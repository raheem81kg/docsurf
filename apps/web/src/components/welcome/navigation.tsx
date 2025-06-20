import { Button } from "@docsurf/ui/components/button";
import {
	ListItem,
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuList,
	NavigationMenuTrigger,
	//  ListItem,
} from "@docsurf/ui/components/navigation-menu";
import { Separator } from "@docsurf/ui/components/separator";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@docsurf/ui/components/sheet";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Icons } from "@/components/assets/icons";
import logo from "/icons/logo.svg";
import logoDark from "/icons/logo-dark.svg";
import { DynamicImage } from "./dynamic-image";

const resources = [
	// {
	//    title: "GitHub",
	//    href: "https://github.com/docsurf",
	//    description: "Check out our open-source projects and contributions.",
	//    platform: "github" as const,
	// },
	{
		title: "Twitter",
		href: "https://x.com/docsurf_ai",
		description: "Follow us for the latest updates and announcements.",
		platform: "twitter" as const,
	},
	{
		title: "LinkedIn",
		href: "https://www.linkedin.com/company/docsurf/",
		description: "Connect with us professionally and stay updated.",
		platform: "linkedin" as const,
	},
	// {
	//    title: "Discord",
	//    href: "https://discord.gg/docsurf",
	//    description: "Join our community and chat with the team.",
	//    platform: "discord" as const,
	// },
];

const aboutLinks = [
	{
		title: "About",
		href: "/about",
		description: "Learn more about DocSurf and our mission.",
	},
	{
		title: "Privacy",
		href: "/policy",
		description: "Read our privacy policy and data handling practices.",
	},
	{
		title: "Terms of Service",
		href: "/terms",
		description: "Review our terms of service and usage guidelines.",
	},
];

const IconComponent = {
	github: Icons.Github,
	twitter: Icons.X,
	discord: Icons.Discord,
	linkedin: Icons.LinkedIn,
};

type Profile = {
	email: string | null;
	full_name: string | null;
};

export default function Navigation({ profile }: { profile: Profile }) {
	return (
		<header className="sticky top-4 z-50 mt-4 justify-center px-2 md:flex md:px-4 ">
			<nav className="relative z-20 flex h-[50px] items-center justify-between rounded-[4px] border border-border bg-[#FFFFFF] bg-opacity-70 px-4 backdrop-blur-xl backdrop-filter md:justify-center dark:bg-[#121212] ">
				<div className="flex items-center gap-6">
					<Link to="/" className="relative bottom-1 cursor-pointer">
						<DynamicImage
							lightSrc={logo}
							darkSrc={logoDark}
							alt="DocSurf"
							width={22}
							height={22}
						/>
						<span className="-right-[-0.5px] absolute text-[10px] text-muted-foreground">
							beta
						</span>
					</Link>
					<div className="hidden md:block">
						<NavigationMenu className="!rounded-sm">
							<NavigationMenuList className="gap-1">
								<NavigationMenuItem>
									<NavigationMenuTrigger className="bg-transparent">
										Company
									</NavigationMenuTrigger>
									<NavigationMenuContent className="!rounded-sm bg-default">
										<ul className="grid w-[400px] gap-3 rounded-sm p-4 md:w-[500px] md:grid-cols-1 lg:w-[600px]">
											{aboutLinks.map((link) => (
												<ListItem
													key={link.title}
													title={link.title}
													href={link.href}
												>
													{link.description}
												</ListItem>
											))}
										</ul>
									</NavigationMenuContent>
								</NavigationMenuItem>
								<NavigationMenuItem>
									<NavigationMenuTrigger className="bg-transparent">
										Resources
									</NavigationMenuTrigger>
									<NavigationMenuContent className="!rounded-sm bg-default">
										<ul className="grid w-[400px] gap-3 rounded-sm p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
											{resources.map((resource) => (
												<ListItem
													key={resource.title}
													title={resource.title}
													href={resource.href}
													target="_blank"
													aria-label={resource.title}
													IconComponent={IconComponent[resource.platform]}
												>
													{resource.description}
												</ListItem>
											))}
										</ul>
									</NavigationMenuContent>
								</NavigationMenuItem>
								<NavigationMenuItem>
									<a href="/pricing">
										<Button variant="ghost" className="h-9 text-text-default">
											Pricing
										</Button>
									</a>
								</NavigationMenuItem>
							</NavigationMenuList>
						</NavigationMenu>
					</div>
					<Separator orientation="vertical" className="h-8 w-[1px] bg-border" />
					<div className="hidden md:block">
						<a href={profile.email ? "/doc" : "/auth"}>
							<Button size="lg" className="!h-9 flex items-center gap-2">
								<span className="text-default">Go to app</span>
								<ArrowRight className="size-4" />
							</Button>
						</a>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<div className="block md:hidden">
						<Sheet>
							<SheetTrigger asChild>
								<button
									type="button"
									className="ml-auto rounded-sm p-2 transition-all hover:bg-muted disabled:pointer-events-none disabled:opacity-50 md:hidden"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width={18}
										height={13}
										fill="none"
									>
										<path
											fill="currentColor"
											d="M0 12.195v-2.007h18v2.007H0Zm0-5.017V5.172h18v2.006H0Zm0-5.016V.155h18v2.007H0Z"
										/>
									</svg>
								</button>
							</SheetTrigger>
							<SheetContent
								side="left"
								className="w-[300px] gap-0 bg-sidebar px-6 py-7 sm:w-[400px]"
								hideCloseButton
							>
								<SheetHeader className="flex flex-row items-center justify-between p-0">
									<SheetTitle>
										<DynamicImage
											lightSrc={logo}
											darkSrc={logoDark}
											alt="DocSurf"
											width={22}
											height={22}
										/>
									</SheetTitle>
									<a href="/auth">
										<Button size="md">Sign in</Button>
									</a>
								</SheetHeader>
								<div className="mt-8 flex flex-col gap-3">
									<div className="flex flex-col gap-3">
										<Link
											to="/pricing"
											className="mt-2 text-text-default transition-opacity duration-200 hover:opacity-80"
										>
											Pricing
										</Link>
										{aboutLinks.map((link) => (
											<a
												key={link.title}
												href={link.href}
												target="_blank"
												aria-label={link.title}
												className="block font-medium text-text-default transition-opacity duration-200 hover:opacity-80"
											>
												{link.title}
											</a>
										))}
									</div>
									<a
										rel="noopener noreferrer"
										target="_blank"
										href="https://cal.com/team/docsurf"
										aria-label="Contact Us"
										className="font-medium text-text-default transition-opacity duration-200 hover:opacity-80"
									>
										Contact Us
									</a>
								</div>
								<Separator className="mt-8" />
								<div className="mt-8 flex flex-row items-center justify-center gap-4">
									{resources.map((resource) => {
										const Icon = IconComponent[resource.platform];
										return (
											<Link
												key={resource.title}
												to={resource.href}
												rel="noopener noreferrer"
												target="_blank"
												className="flex items-center gap-2 font-medium transition-opacity duration-200 hover:opacity-80"
											>
												{resource.platform && (
													<Icon className="h-5 w-5 fill-muted-foreground transition-colors duration-200 ease-in-out hover:fill-brand" />
												)}
											</Link>
										);
									})}
								</div>
							</SheetContent>
						</Sheet>
					</div>
				</div>
			</nav>
		</header>
	);
}
