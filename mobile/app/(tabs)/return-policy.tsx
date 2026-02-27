import * as React from "react";
import { LegalScreen } from "../../src/components/LegalScreen";

export default function ReturnPolicyScreen() {
  return (
    <LegalScreen
      title="Return Policy"
      intro="Tatvivah Trends offers a streamlined return process for eligible items to ensure confidence with every premium purchase."
      updatedAt="February 27, 2026"
      sections={[
        {
          title: "Eligibility",
          body: "Returns are accepted for eligible products in original condition with tags intact, subject to product category and return window.",
        },
        {
          title: "Return Window",
          body: "Return requests should be raised within the eligible timeframe from delivery. Requests raised beyond this period may not be approved.",
        },
        {
          title: "Quality Check",
          body: "All returned items undergo quality verification before approval. Items showing signs of wear or damage may be rejected.",
        },
      ]}
    />
  );
}
