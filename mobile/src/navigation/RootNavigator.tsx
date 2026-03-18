import * as React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HomeScreen } from "../screens/HomeScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { CartScreen } from "../screens/CartScreen";
import { WishlistScreen } from "../screens/WishlistScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { colors, typography } from "../theme";
import { type RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: {
          fontFamily: typography.heading,
          fontSize: 18,
          color: colors.textPrimary,
        },
        headerTintColor: colors.textPrimary,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Main" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: "Sign In / Sign Up" }}
      />
      <Stack.Screen
        name="Cart"
        component={CartScreen}
        options={{ title: "My Cart" }}
      />
      <Stack.Screen
        name="Wishlist"
        component={WishlistScreen}
        options={{ title: "My Wishlist" }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "My Profile" }}
      />
    </Stack.Navigator>
  );
}
