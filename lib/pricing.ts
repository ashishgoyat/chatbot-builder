export type PricingPlan = {
  name: string;
  price: string;
  billing: string;
  sessions: number;
  description: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  isAvailableNow: boolean;
  highlighted?: boolean;
};

export const pricingPlans: PricingPlan[] = [
  {
    name: "Free",
    price: "$0",
    billing: "/month",
    sessions: 5,
    description: "Great for trying BotForge and launching your first bot quickly.",
    features: [
      "1 chatbot workspace",
      "5 chat sessions per month",
      "Basic knowledge uploads",
      "Community support",
    ],
    ctaLabel: "Start Free",
    ctaHref: "/signup",
    isAvailableNow: true,
  },
  {
    name: "Starter",
    price: "$10",
    billing: "/month",
    sessions: 50,
    description: "Best for teams running support on a consistent monthly cadence.",
    features: [
      "5 chatbot workspaces",
      "50 chat sessions per month",
      "Widget branding controls",
      "Email support",
    ],
    ctaLabel: "Choose Starter",
    ctaHref: "/signup",
    isAvailableNow: false,
  },
  {
    name: "Scale",
    price: "$100",
    billing: "/month",
    sessions: 1000,
    description: "Built for high-volume products that need reliable AI coverage.",
    features: [
      "Unlimited chatbot workspaces",
      "1000 chat sessions per month",
      "Team collaboration",
      "Priority support",
    ],
    ctaLabel: "Choose Scale",
    ctaHref: "/signup",
    isAvailableNow: false,
  },
];
