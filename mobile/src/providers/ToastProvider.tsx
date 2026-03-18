import * as React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
} from "react-native";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type ToastType = "error" | "success" | "info";

interface ToastEntry {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
export const ToastContext = React.createContext<ToastContextValue>({
  showToast: () => {},
});

export function useToast() {
  return React.useContext(ToastContext);
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
const TOAST_DURATION_MS = 4000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastEntry[]>([]);

  const showToast = React.useCallback(
    (message: string, type: ToastType = "error") => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, type, message }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, TOAST_DURATION_MS);
    },
    []
  );

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = React.useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View style={styles.overlay} pointerEvents="box-none">
        {toasts.map((toast) => (
          <Toast key={toast.id} entry={toast} onDismiss={dismiss} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Single toast component
// ---------------------------------------------------------------------------
const BG: Record<ToastType, string> = {
  error: "#A65D57",
  success: "#5D8A66",
  info: "#5C524A",
};

function Toast({
  entry,
  onDismiss,
}: {
  entry: ToastEntry;
  onDismiss: (id: string) => void;
}) {
  const opacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(TOAST_DURATION_MS - 600),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[styles.toast, { opacity, backgroundColor: BG[entry.type] }]}
    >
      <Text style={styles.toastText}>{entry.message}</Text>
      <Pressable onPress={() => onDismiss(entry.id)} hitSlop={8}>
        <Text style={styles.toastDismiss}>✕</Text>
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
    zIndex: 9999,
    gap: 8,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: "#2C2825",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  toastText: {
    flex: 1,
    color: "#FFFCF8",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  toastDismiss: {
    color: "#FFFCF8",
    fontSize: 14,
    marginLeft: 12,
    opacity: 0.7,
  },
});
