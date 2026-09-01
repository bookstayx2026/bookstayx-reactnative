import { createFileRoute } from "@tanstack/react-router";
import { NotificationsPage } from "@/components/NotificationsPage";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [{ title: "Notifications | BookStayX" }],
  }),
  component: NotificationsPage,
});
