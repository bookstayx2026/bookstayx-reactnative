import { createFileRoute } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import { LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [{ title: "Privacy Policy | BookStayX" }],
  }),
  component: () => (
    <LegalPage
      title="Privacy"
      accent="Policy"
      subtitle="How we collect and protect your data"
      Icon={Shield}
      sections={[
        {
          heading: "Information We Collect",
          body: "We collect account details (name, email, phone), booking preferences, payment status metadata, and referral activity needed to run stays and rewards.",
        },
        {
          heading: "How We Use Data",
          body: "Data is used to confirm bookings, send notifications, process referrals/payouts, improve recommendations, and provide customer support.",
        },
        {
          heading: "Sharing",
          body: "We do not sell personal data. Information may be shared with property partners or payment providers only as required to complete your stay or payout.",
        },
        {
          heading: "Security",
          body: "We use industry-standard safeguards to protect your information. You are responsible for keeping login credentials confidential.",
        },
        {
          heading: "Your Choices",
          body: "You may request updates or deletion of account information by contacting support, subject to legal and booking record requirements.",
        },
      ]}
    />
  ),
});
