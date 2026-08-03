import SupportChat from "@/components/support/support-chat";

export const metadata = {
  title: "Support | Tatvivah",
  description: "Chat with the Tatvivah support team about your orders and account.",
};

export default function CustomerSupportPage() {
  return (
    <SupportChat
      audience="requester"
      title="Customer Support"
      description="Raise a request and chat directly with our team. Replies appear here in real time."
    />
  );
}
