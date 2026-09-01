import { createFileRoute } from "@tanstack/react-router";
import { OwnersDashboard } from "@/components/owner/OwnersDashboard";

export const Route = createFileRoute("/owner/")({
  head: () => ({
    meta: [
      { title: "Owners Dashboard — BookStayX" },
      {
        name: "description",
        content: "Manage villa availability, pricing and calendars for your BookStayX properties.",
      },
      { property: "og:title", content: "Owners Dashboard — BookStayX" },
    ],
  }),
  component: OwnersDashboard,
});
