import { createFileRoute } from "@tanstack/react-router";
import { OwnerProfilePageView } from "@/components/owner/OwnerProfilePage";

export const Route = createFileRoute("/owner/profile")({
  head: () => ({
    meta: [{ title: "Owner Profile — BookStayX" }],
  }),
  component: OwnerProfilePageView,
});
