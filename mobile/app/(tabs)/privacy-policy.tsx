import * as React from "react";
import { LegalScreen } from "../../src/components/LegalScreen";

export default function PrivacyPolicyScreen() {
  return (
    <LegalScreen
      title="Privacy Policy"
      intro="Tatvivah Trends is committed to protecting your personal data and honoring your preferences across every interaction."
      updatedAt="February 27, 2026"
      sections={[
        {
          title: "Information we collect",
          body: "Account details, order history, saved addresses, and support interactions that help us fulfill your orders and personalize recommendations.",
        },
        {
          title: "How we use it",
          body: "To process transactions, improve styling recommendations, and keep you informed with order and service updates.",
        },
        {
          title: "Your choices",
          body: "You can review, update, or request deletion of your details from your profile and support channels as permitted.",
        },
      ]}
    />
  );
}
