import { createFileRoute } from "@tanstack/react-router";
import { OwnerUnitsPage } from "@/components/owner/OwnerUnitsPage";

export const Route = createFileRoute("/owner/units")({
  head: () => ({
    meta: [{ title: "Units — Owners Dashboard | BookStayX" }],
  }),
  component: OwnerUnitsPage,
});
