import * as React from "react";
import { LegalScreen } from "../../src/components/LegalScreen";
import { companyInfo } from "../../src/data/company";

export default function RefundPolicyScreen() {
  return (
    <LegalScreen
      title="Refund Policy"
      intro="Refunds are issued transparently to the original payment source after cancellation or approved return verification."
      updatedAt="March 14, 2026"
      sections={[
        {
          title: "Approval Process",
          body: "Refund initiation starts after return quality check approval or seller-side cancellation confirmation.",
        },
        {
          title: "Processing Time",
          body: "After initiation, UPI and wallet refunds usually reflect within 2-4 business days, and card/net-banking refunds within 5-7 business days.",
        },
        {
          title: "Partial Refunds",
          body: "Partial refunds may be issued for partial returns, promotional adjustments, or policy-based deductions where applicable.",
        },
        {
          title: "Refund Escalation",
          body: `If your refund is delayed beyond the SLA, contact ${companyInfo.supportEmail} with your order ID and payment reference.`,
        },
      ]}
    />
  );
}
