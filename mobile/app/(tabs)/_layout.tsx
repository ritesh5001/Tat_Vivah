import * as React from "react";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { colors, typography } from "../../src/theme/tokens";
import { impactLight } from "../../src/utils/haptics";

const TabIconScale = React.memo(function TabIconScale({
  focused,
  children,
}: {
  focused: boolean;
  children: React.ReactNode;
}) {
  const scale = useSharedValue(focused ? 1.08 : 1);

  React.useEffect(() => {
    scale.value = withSpring(focused ? 1.1 : 1, {
      damping: 16,
      stiffness: 220,
      mass: 0.8,
    });
  }, [focused, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
});

export default function TabsLayout() {
  const tabListeners = React.useMemo(
    () => ({
      tabPress: () => {
        impactLight();
      },
    }),
    []
  );

  return (
    <Tabs
      initialRouteName="home/index"
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.brownSoft,
        tabBarActiveBackgroundColor: "rgba(196, 167, 108, 0.12)",
        tabBarLabelStyle: {
          fontFamily: typography.sans,
          fontSize: 10,
          letterSpacing: 0.6,
          textTransform: "uppercase",
        },
        tabBarItemStyle: {
          marginHorizontal: 4,
          marginVertical: 4,
        },
        tabBarStyle: {
          height: 64,
          paddingTop: 4,
          backgroundColor: colors.surfaceElevated,
          borderTopWidth: 1,
          borderTopColor: "rgba(196, 167, 108, 0.35)",
          borderRadius: 0,
          ...(Platform.OS === "web"
            ? { boxShadow: "0 -2px 6px rgba(44, 40, 37, 0.06)" }
            : {
                shadowColor: colors.charcoal,
                shadowOpacity: 0.06,
                shadowOffset: { width: 0, height: -2 },
                shadowRadius: 6,
                elevation: 8,
              }),
        },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="home/index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIconScale focused={focused}>
              <Ionicons name="home-outline" color={color} size={size} />
            </TabIconScale>
          ),
        }}
        listeners={tabListeners}
      />
      <Tabs.Screen
        name="marketplace/index"
        options={{
          title: "Shop",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIconScale focused={focused}>
              <MaterialIcons name="grid-view" color={color} size={size} />
            </TabIconScale>
          ),
        }}
        listeners={tabListeners}
      />
      <Tabs.Screen
        name="reels/index"
        options={{
          title: "Reels",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIconScale focused={focused}>
              <Ionicons name="play-circle-outline" color={color} size={size} />
            </TabIconScale>
          ),
        }}
        listeners={tabListeners}
      />
      <Tabs.Screen
        name="search/index"
        options={{
          title: "Search",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIconScale focused={focused}>
              <Ionicons name="search-outline" color={color} size={size} />
            </TabIconScale>
          ),
        }}
        listeners={tabListeners}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIconScale focused={focused}>
              <Ionicons name="person-outline" color={color} size={size} />
            </TabIconScale>
          ),
        }}
        listeners={tabListeners}
      />

      <Tabs.Screen
        name="cart/index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="wishlist/index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="orders/index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="notifications/index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="privacy-policy"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="return-policy"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="refund-policy"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="terms"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="contact"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
