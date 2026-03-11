import * as React from "react";
import { LegalScreen } from "../../src/components/LegalScreen";

export default function RefundPolicyScreen() {
  return (
    <LegalScreen
      title="Refund Policy"
      intro="Refunds at Tatvivah Trends are processed transparently through the original payment method after successful verification."
      updatedAt="February 27, 2026"
      sections={[
        {
          title: "Approval Process",
          body: "Refunds are initiated after cancellation or approved return validation and may vary based on payment provider timelines.",
        },
        {
          title: "Processing Time",
          body: "Once approved, refunds are typically reflected within standard banking timelines, depending on your payment channel.",
        },
        {
          title: "Partial Refunds",
          body: "Where applicable, partial refunds may be issued based on returned quantity, condition checks, and policy eligibility.",
        },
      ]}
    />
  );
}
