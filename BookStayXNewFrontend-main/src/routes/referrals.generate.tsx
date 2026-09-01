import { createFileRoute } from "@tanstack/react-router";
import { GenerateNewCodePage } from "@/components/GenerateNewCodePage";

export const Route = createFileRoute("/referrals/generate")({
  head: () => ({
    meta: [
      { title: "Generate Code — Referral | BookStayX" },
      {
        name: "description",
        content: "Create a new unique referral code for BookStayX.",
      },
    ],
  }),
  component: GenerateNewCodePage,
});
