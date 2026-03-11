import * as React from "react";
import { LegalScreen } from "../../src/components/LegalScreen";

export default function ContactScreen() {
  return (
    <LegalScreen
      title="Contact"
      intro="Our Tatvivah Trends support and concierge team is available to help with orders, styling assistance, and policy requests."
      updatedAt="February 27, 2026"
      sections={[
        {
          title: "Customer Support",
          body: "For order and account support, please reach out via the official contact channels listed on tatvivahtrends.com.",
        },
        {
          title: "Styling Concierge",
          body: "Need help selecting wedding looks? Our concierge can guide sizing, styling combinations, and event-ready edits.",
        },
        {
          title: "Business Queries",
          body: "Partnership, seller, and enterprise queries can be submitted through our official website contact form.",
        },
      ]}
    />
  );
}
