"use client";

import * as React from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * Premium Toast System
 * 
 * Philosophy: Toasts should feel like "a quiet concierge whisper"
 * - Soft cream background
 * - Subtle shadow  
 * - Rounded, elegant shape
 * - No harsh icons
 * - Calm, human, respectful tone
 * 
 * Motion:
 * - Enter: fade + slight rise (300-400ms)
 * - Exit: gentle fade
 * - No bounce, no spring
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const [theme, setTheme] = React.useState<ToasterProps["theme"]>("light");

  React.useEffect(() => {
    const updateTheme = () => {
      setTheme(
        document.documentElement.classList.contains("dark") ? "dark" : "light"
      );
    };

    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <Sonner
      theme={theme}
      position="top-center"
      closeButton
      gap={12}
      className="toaster group"
      toastOptions={{
        duration: 3000,
        classNames: {
          toast:
            "border border-border-soft bg-ivory text-charcoal shadow-[0_4px_24px_rgba(44,40,37,0.08)] rounded-none dark:border-border-warm dark:bg-brown dark:text-ivory",
          title: "text-sm font-medium tracking-tight",
          description: "text-xs text-brown-soft dark:text-cream/80",
          actionButton:
            "bg-charcoal text-ivory text-xs font-medium uppercase tracking-wider px-4 py-2 rounded-none hover:bg-brown transition-colors dark:bg-gold dark:text-charcoal",
          cancelButton:
            "text-xs text-muted-foreground hover:text-foreground",
          closeButton:
            "border-0 bg-transparent text-brown-soft/60 hover:text-charcoal dark:text-cream/40 dark:hover:text-ivory",
          success:
            "border-l-2 border-l-[#7B9971] bg-ivory dark:bg-brown dark:border-l-[#8BAA7F]",
          error:
            "border-l-2 border-l-[#A67575] bg-ivory dark:bg-brown dark:border-l-[#B88888]",
          warning:
            "border-l-2 border-l-[#B7956C] bg-ivory dark:bg-brown dark:border-l-gold",
          info:
            "border-l-2 border-l-[#8B9CB8] bg-ivory dark:bg-brown dark:border-l-[#9EACC4]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
