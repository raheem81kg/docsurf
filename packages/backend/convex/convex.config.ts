import betterAuth from "@convex-dev/better-auth/convex.config";
import rateLimiter from "@convex-dev/rate-limiter/convex.config";
import { defineApp } from "convex/server";
import polar from "@convex-dev/polar/convex.config";
import r2 from "@docsurf/r2/component/convex.config";
import aggregate from "@convex-dev/aggregate/convex.config";
import resend from "@convex-dev/resend/convex.config";

const app = defineApp();
app.use(betterAuth);
app.use(rateLimiter);
app.use(aggregate, { name: "aggregateFolderThreads" });
app.use(polar);
app.use(r2, {});
app.use(resend);

export default app;
