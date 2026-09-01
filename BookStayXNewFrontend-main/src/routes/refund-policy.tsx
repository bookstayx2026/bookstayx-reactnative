import { createFileRoute } from "@tanstack/react-router";
import { RefreshCcw } from "lucide-react";
import { LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/refund-policy")({
  head: () => ({
    meta: [{ title: "Refund Policy | BookStayX" }],
  }),
  component: () => (
    <LegalPage
      title="Refund"
      accent="Policy"
      subtitle="Cancellations, refunds & credits"
      Icon={RefreshCcw}
      sections={[
        {
          heading: "Cancellation Window",
          body: "Refund eligibility depends on the property’s cancellation rules and how far in advance you cancel. Always review the stay’s policy before booking.",
        },
        {
          heading: "Full / Partial Refunds",
          body: "Eligible cancellations may receive a full or partial refund of the paid amount. Service fees or non-refundable advances may be retained as stated at checkout.",
        },
        {
          heading: "Processing Time",
          body: "Approved refunds are typically processed within 5–10 business days, depending on your bank or payment provider.",
        },
        {
          heading: "No-Shows",
          body: "Failure to check in without prior cancellation may be treated as a no-show and may not qualify for a refund.",
        },
        {
          heading: "Need Help?",
          body: "For refund status or special circumstances, contact support with your booking ID. We’ll review and guide you through the next steps.",
        },
      ]}
    />
  ),
});
