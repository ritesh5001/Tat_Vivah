import * as React from "react";
import { LegalScreen } from "../../src/components/LegalScreen";

export default function TermsScreen() {
  return (
    <LegalScreen
      title="Terms & Conditions"
      intro="By using Tatvivah Trends, you agree to our platform terms governing purchases, account usage, and service interactions."
      updatedAt="February 27, 2026"
      sections={[
        {
          title: "Account Responsibility",
          body: "Users are responsible for maintaining account confidentiality and ensuring all shared details are accurate and current.",
        },
        {
          title: "Orders & Pricing",
          body: "Order confirmation, pricing, taxes, and shipping are subject to applicable policies and operational checks.",
        },
        {
          title: "Platform Use",
          body: "Any misuse, fraudulent activity, or policy violations may result in restricted access or account suspension.",
        },
      ]}
    />
  );
}
