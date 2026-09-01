import { createFileRoute } from "@tanstack/react-router";
import { ReferralDashboard } from "@/components/ReferralDashboard";

export const Route = createFileRoute("/referrals/dashboard")({
  head: () => ({
    meta: [
      { title: "Check Earning — Referral Dashboard | BookStayX" },
      {
        name: "description",
        content: "Track your referral earnings and manage payouts.",
      },
    ],
  }),
  component: ReferralDashboard,
});
