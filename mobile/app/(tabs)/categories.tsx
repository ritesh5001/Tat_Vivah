import * as React from "react";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, View, Pressable } from "react-native";
import { AppHeader } from "../../src/components/AppHeader";
import { AppText as Text, ScreenContainer as SafeAreaView } from "../../src/components";
import { getCategories, type Category } from "../../src/services/catalog";
import { colors, radius, spacing, typography, shadow } from "../../src/theme/tokens";

export default function CategoriesScreen() {
  const router = useRouter();
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const data = await getCategories();
        if (mounted) setCategories(data.categories ?? []);
      } catch {
        if (mounted) setCategories([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title="Categories" subtitle="Tatvivah Trends" showBack />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          Explore every collection by category and jump straight into curated results.
        </Text>

        <View style={styles.grid}>
          {loading ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Loading categories...</Text>
            </View>
          ) : categories.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No categories available right now.</Text>
            </View>
          ) : (
            categories.map((category) => (
              <Pressable
                key={category.id}
                style={styles.card}
                onPress={() =>
                  router.push({
                    pathname: "/search",
                    params: { categoryId: category.id, q: category.name },
                  })
                }
              >
                <Text style={styles.cardTitle}>{category.name}</Text>
                <Text style={styles.cardMeta}>Curated premium edits</Text>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  intro: {
    fontFamily: typography.sans,
    fontSize: 13,
    lineHeight: 20,
    color: colors.brownSoft,
  },
  grid: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 0,
    backgroundColor: colors.warmWhite,
    padding: spacing.lg,
    ...shadow.card,
  },
  cardTitle: {
    fontFamily: typography.serif,
    fontSize: 22,
    color: colors.charcoal,
  },
  cardMeta: {
    marginTop: spacing.xs,
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.brownSoft,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  emptyCard: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 0,
    padding: spacing.lg,
    backgroundColor: colors.warmWhite,
  },
  emptyText: {
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.brownSoft,
  },
});
