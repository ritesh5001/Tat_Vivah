import * as React from "react";
import {
  StyleSheet,
  TextInput,
  type TextInputProps,
  type TextInput as NativeTextInput,
} from "react-native";
import { colors, radius, spacing, typography } from "../theme/tokens";

export const AppInput = React.forwardRef<NativeTextInput, TextInputProps>(
  ({ style, placeholderTextColor, ...props }, ref) => {
    return (
      <TextInput
        ref={ref}
        {...props}
        style={[styles.input, style]}
        placeholderTextColor={placeholderTextColor ?? colors.brownSoft}
        selectionColor={colors.gold}
      />
    );
  }
);

AppInput.displayName = "AppInput";

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 0,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontFamily: typography.sans,
    fontSize: 14,
    color: colors.charcoal,
  },
});
