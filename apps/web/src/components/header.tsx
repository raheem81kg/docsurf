import { Link } from "@tanstack/react-router";

export default function Header() {
	const links = [
		{ to: "/", label: "Home" },
		{ to: "/todos", label: "Todos" },
		{ to: "/sign-in", label: "Sign In" },
		{ to: "/sign-up", label: "Sign Up" },
		{ to: "/client-only", label: "Client Only" },
		{ to: "/server", label: "Server" },
		// { to: "/auth", label: "Auth" },
	];

	return (
		<div>
			<div className="flex flex-row items-center justify-between px-2 py-1">
				<nav className="flex gap-4 text-lg">
					{links.map(({ to, label }) => {
						return (
							<Link key={to} to={to}>
								{label}
							</Link>
						);
					})}
				</nav>
				<div className="flex items-center gap-2" />
			</div>
			<hr />
		</div>
	);
}
