import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/referrals")({
  component: ReferralsLayout,
});

function ReferralsLayout() {
  return <Outlet />;
}
