import { httpRouter } from "convex/server";
import { betterAuthComponent, createAuth } from "./auth";
import { polar } from "./polar";
const http = httpRouter();

betterAuthComponent.registerRoutes(http, createAuth);
polar.registerRoutes(http);

export default http;
