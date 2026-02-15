import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  colors,
  radius,
  spacing,
  typography,
  shadow,
} from "../../../../src/theme/tokens";
import { useAuth } from "../../../../src/hooks/useAuth";
import { useAddresses } from "../../../../src/providers/AddressProvider";
import { AnimatedPressable } from "../../../../src/components/AnimatedPressable";
import { notifySuccess, notifyError } from "../../../../src/utils/haptics";
import type {
  AddressLabel,
  CreateAddressPayload,
  UpdateAddressPayload,
} from "../../../../src/services/addresses";

// ---------------------------------------------------------------------------
// Label options
// ---------------------------------------------------------------------------

const LABEL_OPTIONS: AddressLabel[] = ["HOME", "OFFICE", "OTHER"];

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function AddressFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = Boolean(id);

  const { session, isLoading: authLoading } = useAuth();
  const token = session?.accessToken ?? null;
  const { addresses, addAddress, editAddress } = useAddresses();

  // Find existing address for edit mode
  const existing = React.useMemo(
    () => (id ? addresses.find((a) => a.id === id) : undefined),
    [id, addresses],
  );

  // ---- Form state ----
  const [label, setLabel] = React.useState<AddressLabel>(
    existing?.label ?? "HOME",
  );
  const [addressLine1, setAddressLine1] = React.useState(
    existing?.addressLine1 ?? "",
  );
  const [addressLine2, setAddressLine2] = React.useState(
    existing?.addressLine2 ?? "",
  );
  const [city, setCity] = React.useState(existing?.city ?? "");
  const [state, setState] = React.useState(existing?.state ?? "");
  const [pincode, setPincode] = React.useState(existing?.pincode ?? "");

  const [isSaving, setIsSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const mountedRef = React.useRef(true);
  const submitLockRef = React.useRef(false);

  React.useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Pre-fill when `existing` resolves (navigated with id before data loaded)
  React.useEffect(() => {
    if (existing && isEdit) {
      setLabel(existing.label);
      setAddressLine1(existing.addressLine1);
      setAddressLine2(existing.addressLine2 ?? "");
      setCity(existing.city);
      setState(existing.state);
      setPincode(existing.pincode);
    }
  }, [existing, isEdit]);

  // ---- Auth redirect ----
  React.useEffect(() => {
    if (!authLoading && !token) {
      router.replace("/login");
    }
  }, [authLoading, token, router]);

  // ---- Validation ----

  const validate = React.useCallback((): boolean => {
    const next: Record<string, string> = {};

    if (!addressLine1.trim()) next.addressLine1 = "Address line 1 is required";
    if (!city.trim()) next.city = "City is required";
    if (!state.trim()) next.state = "State is required";
    if (!pincode.trim()) next.pincode = "Pincode is required";
    else if (!/^\d{6}$/.test(pincode.trim()))
      next.pincode = "Enter a valid 6-digit pincode";

    setErrors(next);
    return Object.keys(next).length === 0;
  }, [addressLine1, city, state, pincode]);

  // ---- Submit ----

  const handleSubmit = React.useCallback(async () => {
    // Synchronous double-submit guard
    if (submitLockRef.current) return;
    if (!validate()) return;

    submitLockRef.current = true;
    setIsSaving(true);

    try {
      if (isEdit && id) {
        const data: UpdateAddressPayload = {
          label,
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2.trim() || undefined,
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
        };
        const result = await editAddress(id, data);
        if (result && mountedRef.current) {
          notifySuccess();
          router.back();
        }
      } else {
        const data: CreateAddressPayload = {
          label,
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2.trim() || undefined,
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
        };
        const result = await addAddress(data);
        if (result && mountedRef.current) {
          notifySuccess();
          router.back();
        }
      }
    } catch {
      notifyError();
    } finally {
      submitLockRef.current = false;
      if (mountedRef.current) setIsSaving(false);
    }
  }, [
    isEdit,
    id,
    label,
    addressLine1,
    addressLine2,
    city,
    state,
    pincode,
    validate,
    addAddress,
    editAddress,
    router,
  ]);

  const handleGoBack = React.useCallback(() => {
    router.back();
  }, [router]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <AnimatedPressable
              onPress={handleGoBack}
              style={styles.backButton}
            >
              <Text style={styles.backArrow}>←</Text>
            </AnimatedPressable>
            <View>
              <Text style={styles.headerTitle}>
                {isEdit ? "Edit Address" : "New Address"}
              </Text>
              <Text style={styles.headerCopy}>
                {isEdit
                  ? "Update your delivery details."
                  : "Add a new delivery address."}
              </Text>
            </View>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {/* Label selector */}
            <Text style={styles.fieldLabel}>Label</Text>
            <View style={styles.labelRow}>
              {LABEL_OPTIONS.map((opt) => (
                <AnimatedPressable
                  key={opt}
                  style={[
                    styles.labelChip,
                    label === opt && styles.labelChipActive,
                  ]}
                  onPress={() => setLabel(opt)}
                  disabled={isSaving}
                >
                  <Text
                    style={[
                      styles.labelChipText,
                      label === opt && styles.labelChipTextActive,
                    ]}
                  >
                    {opt}
                  </Text>
                </AnimatedPressable>
              ))}
            </View>

            {/* Address Line 1 */}
            <Text style={styles.fieldLabel}>Address Line 1 *</Text>
            <TextInput
              style={[styles.input, errors.addressLine1 && styles.inputError]}
              placeholder="House, street, area"
              placeholderTextColor={colors.brownSoft}
              value={addressLine1}
              onChangeText={setAddressLine1}
              editable={!isSaving}
            />
            {errors.addressLine1 ? (
              <Text style={styles.errorText}>{errors.addressLine1}</Text>
            ) : null}

            {/* Address Line 2 */}
            <Text style={styles.fieldLabel}>Address Line 2</Text>
            <TextInput
              style={styles.input}
              placeholder="Apartment, floor"
              placeholderTextColor={colors.brownSoft}
              value={addressLine2}
              onChangeText={setAddressLine2}
              editable={!isSaving}
            />

            {/* City */}
            <Text style={styles.fieldLabel}>City *</Text>
            <TextInput
              style={[styles.input, errors.city && styles.inputError]}
              placeholder="Mumbai"
              placeholderTextColor={colors.brownSoft}
              value={city}
              onChangeText={setCity}
              editable={!isSaving}
            />
            {errors.city ? (
              <Text style={styles.errorText}>{errors.city}</Text>
            ) : null}

            {/* State */}
            <Text style={styles.fieldLabel}>State *</Text>
            <TextInput
              style={[styles.input, errors.state && styles.inputError]}
              placeholder="Maharashtra"
              placeholderTextColor={colors.brownSoft}
              value={state}
              onChangeText={setState}
              editable={!isSaving}
            />
            {errors.state ? (
              <Text style={styles.errorText}>{errors.state}</Text>
            ) : null}

            {/* Pincode */}
            <Text style={styles.fieldLabel}>Pincode *</Text>
            <TextInput
              style={[styles.input, errors.pincode && styles.inputError]}
              placeholder="400001"
              placeholderTextColor={colors.brownSoft}
              keyboardType="number-pad"
              maxLength={6}
              value={pincode}
              onChangeText={setPincode}
              editable={!isSaving}
            />
            {errors.pincode ? (
              <Text style={styles.errorText}>{errors.pincode}</Text>
            ) : null}

            {/* Submit */}
            <AnimatedPressable
              style={[
                styles.primaryButton,
                isSaving && styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color={colors.background} size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {isEdit ? "Update address" : "Save address"}
                </Text>
              )}
            </AnimatedPressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  container: {
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.warmWhite,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow: {
    fontSize: 18,
    color: colors.charcoal,
  },
  headerTitle: {
    fontFamily: typography.serif,
    fontSize: 22,
    color: colors.charcoal,
  },
  headerCopy: {
    marginTop: 2,
    fontFamily: typography.sans,
    fontSize: 11,
    color: colors.brownSoft,
  },
  card: {
    marginTop: spacing.md,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.warmWhite,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadow.card,
  },
  fieldLabel: {
    fontFamily: typography.sans,
    fontSize: 11,
    color: colors.brownSoft,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: spacing.md,
    fontFamily: typography.sans,
    color: colors.charcoal,
    backgroundColor: colors.background,
  },
  inputError: {
    borderColor: "#A65D57",
  },
  errorText: {
    fontFamily: typography.sans,
    fontSize: 11,
    color: "#A65D57",
    marginTop: 3,
  },
  labelRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  labelChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.background,
  },
  labelChipActive: {
    borderColor: colors.gold,
    backgroundColor: "#F5EFE4",
  },
  labelChipText: {
    fontFamily: typography.sansMedium,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.brownSoft,
  },
  labelChipTextActive: {
    color: colors.gold,
  },
  primaryButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.charcoal,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
    minHeight: 48,
    justifyContent: "center",
  },
  primaryButtonText: {
    fontFamily: typography.sansMedium,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.background,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
