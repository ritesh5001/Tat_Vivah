import * as React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { Dimensions } from "react-native";
import { HomeScreen } from "../screens/HomeScreen";
import { colors, typography } from "../theme";
import { DrawerMenuContent } from "./MenuDrawerContent";
import type { HomeDrawerParamList } from "./types";

const Drawer = createDrawerNavigator<HomeDrawerParamList>();

const drawerWidth = Math.round(Dimensions.get("window").width * 0.8);

export function HomeDrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerMenuContent {...props} />}
      screenOptions={{
        headerTitle: "TatVivah",
        headerStyle: {
          backgroundColor: colors.navbarBackground,
        },
        headerTitleStyle: {
          fontFamily: typography.heading,
          fontSize: 20,
          color: colors.textPrimary,
        },
        headerTintColor: colors.textPrimary,
        drawerType: "slide",
        drawerStyle: {
          width: drawerWidth,
          backgroundColor: colors.background,
        },
      }}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Home",
        }}
      />
    </Drawer.Navigator>
  );
}
