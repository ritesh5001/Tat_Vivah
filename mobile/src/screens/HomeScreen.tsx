import * as React from "react";
import { ScrollView, StyleSheet, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useNavigation } from "@react-navigation/native";
import { type NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, spacing } from "../theme/tokens";
import { getBestsellers, type BestsellerProduct } from "../services/bestsellers";
import { Header } from "../components/Header";
import { HeroSection } from "../components/HeroSection";
import { SearchBar } from "../components/SearchBar";
import { CategorySection } from "../components/CategorySection";
import { BestsellerSection } from "../components/BestsellerSection";
import { MarketplaceSection } from "../components/MarketplaceSection";
import { Footer } from "../components/Footer";
import { MenuSheet } from "../components/MenuSheet";
import { images } from "../data/images";
import { type RootStackParamList } from "../navigation/types";

const { width } = Dimensions.get("window");
const bestsellerCardWidth = width - spacing.lg * 2;

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [bestsellers, setBestsellers] = React.useState<BestsellerProduct[]>([]);
  const [loadingBestsellers, setLoadingBestsellers] = React.useState(true);
  const [showBestsellerLoading, setShowBestsellerLoading] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    const loadingTimer = setTimeout(() => {
      if (active) {
        setShowBestsellerLoading(true);
      }
    }, 300);
    const load = async () => {
      try {
        const response = await getBestsellers(4);
        if (active) {
          setBestsellers(response.products ?? []);
        }
      } catch {
        if (active) {
          setBestsellers([]);
        }
      } finally {
        if (active) {
          setLoadingBestsellers(false);
          setShowBestsellerLoading(false);
        }
        clearTimeout(loadingTimer);
      }
    };

    load();

    return () => {
      active = false;
      clearTimeout(loadingTimer);
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Header onMenuPress={() => setMenuOpen(true)} logoSource={images.logo} />
        <HeroSection />
        <SearchBar />
        <CategorySection />
        <BestsellerSection
          loading={showBestsellerLoading && loadingBestsellers}
          items={bestsellers}
          cardWidth={bestsellerCardWidth}
          onPressShopAll={() => navigation.navigate("Bestsellers")}
        />
        <MarketplaceSection
          onMarketplacePress={() => navigation.navigate("Marketplace")}
          onNewArrivalsPress={() => navigation.navigate("NewArrivals")}
        />
        <Footer />
      </ScrollView>
      <MenuSheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={(route) => {
          setMenuOpen(false);
          navigation.navigate(route);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingBottom: spacing.xxl,
  },
});
