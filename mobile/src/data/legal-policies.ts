export type PolicySection = {
  title: string;
  body: string;
};

export type PolicyDocument = {
  title: string;
  intro: string;
  updatedAt: string;
  sections: PolicySection[];
};

export const termsPolicy: PolicyDocument = {
  title: "Terms & Conditions",
  intro:
    "Welcome to Tatvivah Trends. These Terms & Conditions govern your use of our marketplace. By accessing or using the Platform, you agree to comply with and be bound by these Terms.",
  updatedAt: "01 April 2026",
  sections: [
    {
      title: "About Tatvivah Trends",
      body:
        "Tatvivah Trends is a multi-vendor e-commerce marketplace that connects customers with independent sellers offering ethical, sustainable, and culturally inspired fashion and lifestyle products. Tatvivah Trends does not take ownership of inventory and acts solely as a facilitator between buyers and sellers.",
    },
    {
      title: "Eligibility",
      body:
        "Users must be at least 18 years of age to register or make purchases and must have the legal capacity to enter into a binding contract under applicable Indian laws.",
    },
    {
      title: "User Account",
      body:
        "You are responsible for maintaining the confidentiality of your account credentials, and all activities conducted through your account are your responsibility. Tatvivah Trends may suspend or terminate accounts for suspicious, fraudulent, or abusive activity.",
    },
    {
      title: "Vendor Participation",
      body:
        "Vendors must provide accurate product information, comply with applicable laws, uphold ethical sourcing and fair labor practices, fulfill orders promptly, and handle returns, refunds, and customer service according to platform policies. Counterfeit, illegal, hazardous, restricted, or rights-infringing items are prohibited. Tatvivah Trends may charge a commission or service fee as outlined in a separate Vendor Agreement.",
    },
    {
      title: "Product Listings and Pricing",
      body:
        "Product descriptions, pricing, and availability are the responsibility of vendors. Prices are listed in INR and may include or exclude taxes as specified. Product color, texture, and appearance may vary slightly because of lighting, photography, or screen settings. Handmade products may have slight variations and are not considered defects. Customers should refer to vendor size charts.",
    },
    {
      title: "Orders and Payments",
      body:
        "By placing an order, you agree to purchase the selected products subject to availability. Payments are processed through secure third-party gateways. Tatvivah Trends is not liable for failed transactions, gateway errors, unauthorized transactions, duplicate charges, or chargebacks caused by third-party providers. Orders may be cancelled for pricing or listing errors.",
    },
    {
      title: "Shipping and Delivery",
      body:
        "Shipping timelines and charges are determined by individual vendors. Delivery timelines are estimates, not guarantees, and risk of loss or damage passes to the customer upon successful delivery confirmation.",
    },
    {
      title: "Returns, Refunds, and Cancellations",
      body:
        "Return and refund policies may vary by vendor but must meet Tatvivah Trends' minimum standards. Refunds are processed to the original payment method within 7-10 business days after approval. Orders may be cancelled before shipment; post-shipment cancellations are treated as returns.",
    },
    {
      title: "Intellectual Property",
      body:
        "All platform content is owned by Tatvivah Trends or its licensors. Unauthorized use, reproduction, or distribution is prohibited. Vendors retain ownership of their product images and descriptions but grant Tatvivah Trends a non-exclusive license to use them for promotional purposes.",
    },
    {
      title: "Ethical and Sustainability Commitment",
      body:
        "Tatvivah Trends promotes fair trade, ethical sourcing, environmentally sustainable materials, and respect for traditional artisans and craftsmanship. Vendors who violate these principles may be removed from the Platform.",
    },
    {
      title: "Prohibited Activities",
      body:
        "Users and vendors must not engage in fraudulent or deceptive practices, upload harmful content, attempt unauthorized access, or violate any applicable laws.",
    },
    {
      title: "Limitation of Liability",
      body:
        "Tatvivah Trends acts as a marketplace intermediary and is not liable for the quality, safety, or legality of products sold by vendors. To the maximum extent permitted by law, Tatvivah Trends shall not be liable for indirect, incidental, or consequential damages arising from platform use.",
    },
    {
      title: "Indemnification",
      body:
        "Users and vendors agree to indemnify and hold harmless Tatvivah Trends, its directors, employees, and affiliates from claims, damages, or expenses arising from a breach of these Terms or any law.",
    },
    {
      title: "Disclaimer of Warranties",
      body:
        "All products and services are provided on an as is and as available basis without warranties of any kind, including merchantability, fitness for a particular purpose, or non-infringement.",
    },
    {
      title: "Privacy",
      body:
        "Your use of the Platform is also governed by our Privacy Policy, and we may use third-party analytics or advertising tools for marketing and performance tracking.",
    },
    {
      title: "Third-Party Links",
      body:
        "The Platform may contain links to third-party websites. Tatvivah Trends is not responsible for the content or practices of external sites.",
    },
    {
      title: "Termination",
      body:
        "Tatvivah Trends may suspend or terminate access for any user or vendor who violates these Terms, without prior notice.",
    },
    {
      title: "Governing Law and Jurisdiction",
      body:
        "These Terms are governed by the laws of India. Any unresolved dispute will be referred to arbitration under the Arbitration and Conciliation Act, 1996, with the seat of arbitration in Mumbai, Maharashtra.",
    },
    {
      title: "Amendments",
      body:
        "Tatvivah Trends may update or modify these Terms at any time. Continued use of the Platform after changes constitutes acceptance of the revised Terms.",
    },
    {
      title: "Force Majeure",
      body:
        "Tatvivah Trends is not liable for failure or delay caused by events beyond reasonable control, including natural disasters, pandemics, strikes, governmental actions, internet failures, platform downtime, or cyber incidents.",
    },
    {
      title: "Contact Information",
      body:
        "For grievance matters, contact Shivam Gupta at grievance@tatvivahtrends.com. For general support, email support@tatvivahtrends.com, call 9769659709, or write to C-13 Plot 144, Ashok Silk Mill Compound, Sant Rohidas Marg, Dharavi, Sion, Mumbai, Maharashtra, India 400017.",
    },
  ],
};

export const privacyPolicy: PolicyDocument = {
  title: "Privacy Policy",
  intro:
    "Tatvivah Trends is committed to protecting your privacy and ensuring your personal information is handled safely and responsibly.",
  updatedAt: "01 April 2026",
  sections: [
    { title: "Introduction", body: "This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit or use the Platform." },
    { title: "Information We Collect", body: "We collect personal information such as name, email, phone number, addresses, payment information processed by third-party gateways, login details, non-personal information such as IP address, browser and device details, and vendor information such as business details, GSTIN, PAN, bank details, listings, and transaction history." },
    { title: "How We Use Your Information", body: "We use collected information to process and fulfill orders, facilitate vendor onboarding and payments, provide support, improve the platform, send transactional and promotional communications, prevent fraud, and comply with legal obligations." },
    { title: "Sharing of Information", body: "We may share information with vendors to fulfill orders, payment gateways, logistics partners, legal authorities when required by law, and service providers that help operate the Platform. We do not sell or rent personal information to third parties." },
    { title: "Cookies Policy", body: "We use cookies to enhance user experience and analyze traffic. You can disable cookies in your browser, but some features may not function properly." },
    { title: "Data Security", body: "We use reasonable administrative, technical, and physical safeguards to protect data, but no online transmission is fully secure. We will notify affected users in accordance with applicable laws if a breach occurs." },
    { title: "Data Retention", body: "Personal data is retained only as long as necessary for the purposes described in this policy or as required by law." },
    { title: "User Rights", body: "Under applicable Indian laws, users may access, review, correct, update, withdraw consent for marketing, or request deletion of their data, subject to legal obligations." },
    { title: "Children’s Privacy", body: "Our services are not intended for individuals under 18, and we do not knowingly collect personal information from minors." },
    { title: "Changes to This Policy", body: "We may update this Privacy Policy at any time and changes will be posted with an updated effective date." },
    { title: "Contact Us", body: "Contact support@tatvivahtrends.com or grievance@tatvivahtrends.com for privacy or grievance matters. Address: C-13 Plot 144, Ashok Silk Mill Compound, Sant Rohidas Marg, Dharavi, Sion, Mumbai, Maharashtra, India 400017." },
  ],
};

export const returnPolicy: PolicyDocument = {
  title: "Return & Refund Policy",
  intro:
    "Tatvivah Trends manages returns and refunds with individual vendors while maintaining a consistent customer experience.",
  updatedAt: "01 April 2026",
  sections: [
    { title: "Eligibility for Returns", body: "Customers may request a return if the product is damaged, defective, incorrect, or significantly different from its description, and the request is raised within 7 days of delivery." },
    { title: "Return Process", body: "Log in to your account, open My Orders, select the item, click Request Return, provide the reason and supporting images, and wait for pickup approval." },
    { title: "Refunds", body: "Refunds are initiated after the returned product passes quality inspection and are credited to the original payment method within 7-10 business days. COD refunds are processed to the customer’s bank account." },
    { title: "Contact Us", body: "For return assistance, contact support@tatvivahtrends.com or call 9769659709." },
  ],
};

export const refundPolicy: PolicyDocument = {
  title: "Refund Policy",
  intro: "Refunds are issued to the original payment source after cancellation or approved return verification.",
  updatedAt: "01 April 2026",
  sections: [
    { title: "Approval Process", body: "Refund initiation starts after return quality check approval or seller-side cancellation confirmation." },
    { title: "Credited Time", body: "UPI and wallet refunds are usually credited within 2-4 business days, and card or net-banking refunds within 5-7 business days." },
    { title: "Partial Refunds", body: "Partial refunds may be issued for partial returns, promotional adjustments, or policy-based deductions where applicable." },
    { title: "Refund Escalation", body: "If your refund is delayed beyond the SLA, contact support@tatvivahtrends.com with your order ID and payment reference." },
  ],
};

export const shippingPolicy: PolicyDocument = {
  title: "Shipping & Delivery Policy",
  intro: "Tatvivah Trends collaborates with trusted logistics partners to deliver products across India. Shipping timelines may vary by vendor.",
  updatedAt: "01 April 2026",
  sections: [
    { title: "Order Processing", body: "Orders are typically processed within 1-3 business days after confirmation, and vendors are responsible for packaging and dispatching products." },
    { title: "Delivery Timelines", body: "Metro cities usually take 3-5 business days, non-metro cities 5-7 business days, and remote areas 7-10 business days." },
    { title: "Shipping Charges", body: "Shipping charges, if applicable, are displayed at checkout. Free shipping may be offered during promotional campaigns." },
    { title: "Order Tracking", body: "Customers receive tracking details via SMS and email once the order is shipped." },
    { title: "Cash on Delivery", body: "COD is available for selected pin codes. Tatvivah Trends may limit or cancel COD orders for high-value or suspected fraudulent transactions." },
    { title: "Delivery Delays", body: "Delays may occur because of natural disasters, government restrictions, logistics partner issues, or incorrect shipping information provided by the customer." },
    { title: "Damaged Packages", body: "Customers should inspect packages at delivery and report damage within 24 hours with photographic evidence." },
  ],
};

export const vendorAgreementPolicy: PolicyDocument = {
  title: "Vendor Agreement",
  intro: "This summary version covers the main vendor obligations, compliance requirements, and settlement terms that apply to sellers on Tatvivah Trends.",
  updatedAt: "01 April 2026",
  sections: [
    { title: "Eligibility", body: "Vendors must be legally registered businesses in India and comply with applicable laws, including GST regulations." },
    { title: "Vendor Obligations", body: "Vendors must provide accurate product information and pricing, ensure ethical sourcing and fair labor practices, maintain inventory levels, dispatch within timelines, and handle returns and customer service efficiently." },
    { title: "Commission and Fees", body: "Tatvivah Trends charges commission on each successful sale, and settlements are made within 7-15 business days after order completion, subject to deductions for returns or cancellations." },
    { title: "Intellectual Property", body: "Vendors retain ownership of trademarks and product images but grant Tatvivah Trends a non-exclusive, royalty-free license to use them for promotional purposes." },
    { title: "Prohibited Activities", body: "Vendors must not sell counterfeit or illegal products, violate intellectual property rights, or engage in misleading or deceptive practices." },
    { title: "Compliance with Ethical Standards", body: "Tatvivah Trends promotes sustainability and ethical sourcing, and vendors found violating these principles may face suspension or termination." },
    { title: "Termination", body: "Either party may terminate the agreement with 30 days’ written notice. Immediate termination may occur in cases of legal violations or policy breaches." },
    { title: "Indemnification", body: "Vendors agree to indemnify and hold Tatvivah Trends harmless from any claims arising from their products or actions." },
    { title: "Legal and Compliance", body: "GST invoicing responsibility lies with the vendor, and product prices must include GST as applicable." },
    { title: "Governing Law", body: "This Agreement is governed by the laws of India, with jurisdiction in Mumbai, Maharashtra." },
    { title: "Contact Information", body: "For vendor inquiries, contact support@tatvivahtrends.com or call 9769659709. Address: C-13 Plot 144, Ashok Silk Mill Compound, Sant Rohidas Marg, Dharavi, Sion, Mumbai, Maharashtra, India 400017." },
  ],
};
