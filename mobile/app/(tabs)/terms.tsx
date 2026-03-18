import * as React from "react";
import { LegalScreen } from "../../src/components/LegalScreen";
import { companyInfo } from "../../src/data/company";

export default function TermsScreen() {
  return (
    <LegalScreen
      title="Terms & Conditions"
      intro="By using Tatvivah Trends, you agree to these commerce and account terms that apply to browsing, ordering, and post-order support."
      updatedAt="March 14, 2026"
      sections={[
        {
          title: "Account Responsibility",
          body: "You are responsible for keeping account credentials secure and ensuring your profile, delivery, and contact details remain accurate.",
        },
        {
          title: "Orders & Pricing",
          body: "Orders are confirmed after payment authorization and stock validation. Final payable amount includes applicable taxes, shipping, and promotional adjustments shown at checkout.",
        },
        {
          title: "Cancellations & Abuse",
          body: "Tatvivah Trends may cancel suspicious, duplicate, or policy-violating orders. Misuse of coupons, fraudulent activity, or repeated delivery abuse can result in account restrictions.",
        },
        {
          title: "Support",
          body: `For term-related queries, contact ${companyInfo.supportEmail} or call ${companyInfo.supportPhoneDisplay} during support hours.`,
        },
      ]}
    />
  );
}
