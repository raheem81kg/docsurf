import { tool } from "ai";
import { z } from "zod";

const recommendGuitar = tool({
   description: "Use this tool to recommend a guitar to the user",
   parameters: z.object({
      id: z.string().describe("The id of the guitar to recommend"),
   }),
});

const addGuitarToCart = tool({
   description: "Use this tool to add a guitar to the user's cart",
   parameters: z.object({
      id: z.string().describe("The id of the guitar to add to the cart"),
   }),
});

export default async function getTools() {
   // TODO: Integrate with Convex for real guitar data if needed
   return {
      addGuitarToCart,
      recommendGuitar,
   };
}
