import type { NavigatorScreenParams } from "@react-navigation/native";

export type HomeDrawerParamList = {
  Home: {
    category?: string;
  } | undefined;
};

export type RootStackParamList = {
  Main: undefined;
  Login: undefined;
  Cart: undefined;
  Wishlist: undefined;
  Profile: undefined;
};
