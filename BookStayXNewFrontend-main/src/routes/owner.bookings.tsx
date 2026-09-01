import { createFileRoute } from "@tanstack/react-router";
import { OwnerBookingsPage } from "@/components/owner/OwnerBookingsPage";

export const Route = createFileRoute("/owner/bookings")({
  head: () => ({
    meta: [{ title: "Bookings — Owners Dashboard | BookStayX" }],
  }),
  component: OwnerBookingsPage,
});
