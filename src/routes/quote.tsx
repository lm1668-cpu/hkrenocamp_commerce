import { createFileRoute } from "@tanstack/react-router";
import { QuoteDesk } from "@/components/quote-desk";

export const Route = createFileRoute("/quote")({
  head: () => ({
    meta: [
      { title: "大本營報價" },
      { name: "description", content: "香港裝修師傅大本營報價。為業主開水喉、電力、木工、油漆和冷氣報價單。" },
    ],
  }),
  component: QuoteDesk,
});
