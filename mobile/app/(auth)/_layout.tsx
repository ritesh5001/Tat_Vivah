import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // Login → OTP → reset is one task told across several screens, so it
        // slides laterally like a wizard rather than rising again — the rise
        // already happened once, arriving into this stack.
        animation: "simple_push",
        animationDuration: 220,
      }}
    />
  );
}
