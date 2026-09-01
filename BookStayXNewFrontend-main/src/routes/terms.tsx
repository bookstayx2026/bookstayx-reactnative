import { createFileRoute } from "@tanstack/react-router";
import { Scale } from "lucide-react";
import { LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [{ title: "Terms & Privacy | BookStayX" }],
  }),
  component: () => (
    <LegalPage
      title="Terms"
      accent="& Privacy"
      subtitle="Rules for using BookStayX"
      Icon={Scale}
      sections={[
        {
          heading: "1. Acceptance of Terms",
          body: "By accessing or booking through BookStayX, you agree to these Terms & Privacy guidelines. If you do not agree, please do not use our services.",
        },
        {
          heading: "2. Bookings & Payments",
          body: "All bookings are subject to availability and confirmation. Prices shown are for the selected stay dates and guest count. Advance payments may be required to secure a reservation.",
        },
        {
          heading: "3. Guest Responsibilities",
          body: "Guests must follow property rules, respect local regulations, and provide accurate contact and ID details when requested for check-in.",
        },
        {
          heading: "4. Privacy Overview",
          body: "We collect only information needed to process bookings, support, and referrals. For full details on how data is stored and used, see our Privacy Policy.",
        },
        {
          heading: "5. Changes",
          body: "We may update these terms from time to time. Continued use of the app after updates means you accept the revised terms.",
        },
      ]}
    />
  ),
});
