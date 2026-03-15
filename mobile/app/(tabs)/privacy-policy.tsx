import * as React from "react";
import { LegalScreen } from "../../src/components/LegalScreen";
import { companyInfo } from "../../src/data/company";

export default function PrivacyPolicyScreen() {
  return (
    <LegalScreen
      title="Privacy Policy"
      intro="Tatvivah Trends handles your personal data responsibly to deliver orders, improve recommendations, and provide responsive support."
      updatedAt="March 14, 2026"
      sections={[
        {
          title: "Information we collect",
          body: "We collect account details, saved addresses, order history, payment status metadata, and support conversations needed for commerce operations.",
        },
        {
          title: "How we use it",
          body: "Data is used to fulfill orders, process refunds, personalize discovery, detect fraud, and send service-critical notifications.",
        },
        {
          title: "Retention & Control",
          body: "You can request profile updates or data deletion as allowed by law. Some billing and transaction records may be retained for compliance and audit requirements.",
        },
        {
          title: "Privacy Requests",
          body: `Email privacy requests to ${companyInfo.supportEmail} and include your registered phone number for faster verification.`,
        },
      ]}
    />
  );
}
