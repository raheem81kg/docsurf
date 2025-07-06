import { HARDCODED_APP_URL } from "./constants.js";

export type PlanFeature = {
   id?: string;
   text: string;
   tooltip?: {
      title: string;
      cta: string;
      href: string;
   };
};

// Warning:
// The links getAppUrl will behave differently depending on the environment (vite, convex, vercel)
export const PLANS = [
   {
      name: "Free",
      price: {
         monthly: 0,
         yearly: 0,
      },
      limits: {
         requests7d: 10000, // Total Requests (last 7 days)
         tokens7d: 10000000, // Total Tokens (input + output + reasoning)
      },
   },
   {
      name: "Pro",
      link: `${HARDCODED_APP_URL}/pricing`,
      price: {
         monthly: 30,
         yearly: 25,
         ids: [
            // 2025 pricing
            "20a3a3ba-0e8a-4523-afec-8723bce557ac", // monthly
         ],
      },
      limits: {
         requests7d: 10000, // Total Requests (last 7 days)
         tokens7d: 10000000, // Total Tokens (input + output + reasoning)
      },
      featureTitle: "Everything in Free, plus:",
      features: [
         { id: "clicks", text: "50K tracked clicks/mo" },
         { id: "links", text: "1K new links/mo" },
         { id: "retention", text: "1-year analytics retention" },
         { id: "domains", text: "10 domains" },
         { id: "users", text: "3 users" },
         {
            id: "advanced",
            text: "Advanced link features",
            tooltip: "ADVANCED_LINK_FEATURES",
         },
         // {
         //    id: "ai",
         //    text: "Unlimited AI credits",
         //    tooltip: {
         //       title: "Subject to fair use policy – you will be notified if you exceed the limit, which are high enough for frequent usage.",
         //       cta: "Learn more.",
         //       href: "https://dub.co/blog/introducing-dub-ai",
         //    },
         // },
         // {
         //    id: "dotlink",
         //    text: "Free .link domain",
         //    tooltip: {
         //       title: "All our paid plans come with a free .link custom domain, which helps improve click-through rates.",
         //       cta: "Learn more.",
         //       href: "https://dub.co/help/article/free-dot-link-domain",
         //    },
         // },
         // {
         //    id: "folders",
         //    text: "Link folders",
         //    tooltip: {
         //       title: "Organize and manage access to your links on Dub using folders.",
         //       cta: "Learn more.",
         //       href: "https://dub.co/help/article/link-folders",
         //    },
         // },
         // {
         //    id: "deeplinks",
         //    text: "Deep links",
         //    tooltip: {
         //       title: "Redirect users to a specific page within your mobile application using deep links.",
         //       cta: "Learn more.",
         //       href: "https://dub.co//help/article/custom-domain-deep-links",
         //    },
         // },
      ] as PlanFeature[],
   },
];

export const FREE_PLAN = PLANS.find((plan) => plan.name === "Free")!;
export const PRO_PLAN = PLANS.find((plan) => plan.name === "Pro")!;

export const SELF_SERVE_PAID_PLANS = PLANS.filter((p) => ["Pro"].includes(p.name));

export const getPlanFromPriceId = (priceId: string) => {
   return PLANS.find((plan) => plan.price.ids?.includes(priceId)) || null;
};

export const getPlanDetails = (plan: string) => {
   return SELF_SERVE_PAID_PLANS.find((p) => p.name.toLowerCase() === plan.toLowerCase())!;
};

export const getCurrentPlan = (plan: string) => {
   return PLANS.find((p) => p.name.toLowerCase() === plan.toLowerCase()) || FREE_PLAN;
};

export const getNextPlan = (plan?: string | null) => {
   if (!plan) return PRO_PLAN;
   return PLANS[PLANS.findIndex((p) => p.name.toLowerCase() === plan.toLowerCase()) + 1];
};

export const isDowngradePlan = (currentPlan: string, newPlan: string) => {
   const currentPlanIndex = PLANS.findIndex((p) => p.name.toLowerCase() === currentPlan.toLowerCase());
   const newPlanIndex = PLANS.findIndex((p) => p.name.toLowerCase() === newPlan.toLowerCase());
   return currentPlanIndex > newPlanIndex;
};
