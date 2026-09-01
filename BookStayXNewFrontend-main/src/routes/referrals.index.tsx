import { createFileRoute } from "@tanstack/react-router";
import { ReferralMainListing } from "@/components/ReferralMainListing";

export const Route = createFileRoute("/referrals/")({
  head: () => ({
    meta: [
      { title: "Referral Earning | BookStayX" },
      {
        name: "description",
        content: "Check referral earnings, generate codes, and invite friends to earn rewards.",
      },
      { property: "og:title", content: "Referral Earning" },
    ],
  }),
  component: ReferralMainListing,
});
