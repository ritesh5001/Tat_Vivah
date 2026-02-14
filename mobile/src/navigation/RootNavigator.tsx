import * as React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HomeScreen } from "../screens/HomeScreen";
import { BestsellersScreen } from "../screens/BestsellersScreen";
import { MarketplaceScreen } from "../screens/MarketplaceScreen";
import { NewArrivalsScreen } from "../screens/NewArrivalsScreen";
import { SignInScreen } from "../screens/SignInScreen";
import { CreateAccountScreen } from "../screens/CreateAccountScreen";
import { colors, typography } from "../theme/tokens";
import { type RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: {
          fontFamily: typography.serif,
          fontSize: 18,
          color: colors.charcoal,
        },
        headerTintColor: colors.charcoal,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="Bestsellers"
        component={BestsellersScreen}
        options={{ title: "Bestsellers" }}
      />
      <Stack.Screen
        name="Marketplace"
        component={MarketplaceScreen}
        options={{ title: "Marketplace" }}
      />
      <Stack.Screen
        name="NewArrivals"
        component={NewArrivalsScreen}
        options={{ title: "New Arrivals" }}
      />
      <Stack.Screen
        name="SignIn"
        component={SignInScreen}
        options={{ title: "Sign in" }}
      />
      <Stack.Screen
        name="CreateAccount"
        component={CreateAccountScreen}
        options={{ title: "Create account" }}
      />
    </Stack.Navigator>
  );
}
