import type { Metadata } from "next";
import { FeedbackForm } from "./FeedbackForm";

export const metadata: Metadata = {
  title: "App Feedback — LotusMart",
  description:
    "Help us improve the LotusMart app — your feedback takes 1 minute. Tell us about bugs, what was confusing, and what to improve.",
  robots: { index: false, follow: false },
};

export default function FeedbackAppPage() {
  return <FeedbackForm />;
}
