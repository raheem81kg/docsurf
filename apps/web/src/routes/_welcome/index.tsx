import { convexQuery } from "@convex-dev/react-query";
import { api } from "@docsurf/backend/convex/_generated/api";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { SectionFive } from "@/components/welcome/features/section-five";
import { SectionFour } from "@/components/welcome/features/section-four";
import { SectionOne } from "@/components/welcome/features/section-one";
import { SectionThree } from "@/components/welcome/features/section-three";
import { Hero } from "@/components/welcome/hero/hero";

export const Route = createFileRoute("/_welcome/")({
	component: HomeComponent,
});

function HomeComponent() {
	const healthCheck = useSuspenseQuery(convexQuery(api.healthCheck.get, {}));

	return (
		<div className="container mx-auto overflow-visible px-4">
			<Hero />
			<SectionOne />
			<SectionThree />
			<SectionFour />
			<SectionFive />
		</div>
	);
}
