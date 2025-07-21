import { HARDCODED_APP_URL } from "./constants.js";

export const INFINITY_NUMBER = 1000000000;

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
         requests1d: 60, // Total Requests (per day)
         tokens1d: 100000000, // Total Tokens (input + output + reasoning) per day
         uploads1d: 10, // File uploads per day
         // Suggestions are unlimited for all users
      },
      features: [
         { text: "Unlimited suggestions" },
         { text: "Basic AI models" },
         { text: "60 chat requests/day" },
         { text: "6 file uploads/day" },
      ],
   },
   {
      name: "Pro",
      link: `${HARDCODED_APP_URL}/pricing`,
      price: {
         monthly: 12,
         yearly: 12,
         ids: [
            // 2025 pricing
            "20a3a3ba-0e8a-4523-afec-8723bce557ac", // monthly
         ],
      },
      limits: {
         requests1d: INFINITY_NUMBER, // Total Requests (per day)
         tokens1d: INFINITY_NUMBER, // Total Tokens (input + output + reasoning) per day
         uploads1d: INFINITY_NUMBER, // Unlimited uploads per day
         // Suggestions are unlimited for all users
      },
      featureTitle: "Everything in Free, plus:",
      features: [
         { text: "Unlimited suggestions" },
         { text: "Premium AI models" },
         { text: "Unlimited chat requests" },
         { text: "Unlimited file uploads" },
         { text: "200 version history per document" },
         // {
         //    id: "advanced",
         //    text: "Advanced link features",
         //    tooltip: "ADVANCED_LINK_FEATURES",
         // },
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

export const getCurrentPlan = (plan: "Free" | "Pro") => {
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
