import SupportChat from "@/components/support/support-chat";

export const metadata = {
  title: "Support | Tatvivah Seller",
  description: "Chat with the Tatvivah admin team about listings, orders, and settlements.",
};

export default function SellerSupportPage() {
  return (
    <SupportChat
      audience="requester"
      title="Seller Support"
      description="Raise a request with the admin team about listings, orders, payouts, or your account."
    />
  );
}
