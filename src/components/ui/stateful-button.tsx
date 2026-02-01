"use client";

import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Check, X } from "lucide-react";
import React, { useState } from "react";

type ButtonState = "idle" | "loading" | "success" | "error";

interface StatefulButtonProps {
  children?: React.ReactNode;
  className?: string;
  state?: ButtonState;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  onStateChange?: (state: ButtonState) => void;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

export const StatefulButton = React.forwardRef<
  HTMLButtonElement,
  StatefulButtonProps
>(
  (
    {
      children,
      className,
      state = "idle",
      loadingText = "Processing...",
      successText = "Done!",
      errorText = "Failed",
      variant = "default",
      size = "md",
      disabled,
      onClick,
      type = "button",
    },
    ref
  ) => {
    const isDisabled = disabled || state === "loading";

    const variants = {
      default:
        "bg-lime-500 hover:bg-lime-400 text-black font-semibold shadow-lg hover:shadow-xl",
      outline:
        "border-2 border-gray-300 dark:border-neutral-700 hover:border-lime-500 dark:hover:border-lime-500 bg-transparent text-gray-700 dark:text-gray-300",
      ghost:
        "bg-transparent hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-gray-300",
    };

    const sizes = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg",
    };

    const stateColors = {
      idle: "",
      loading: "bg-lime-500/80",
      success: "bg-green-500 hover:bg-green-500",
      error: "bg-red-500 hover:bg-red-500",
    };

    return (
      <motion.button
        ref={ref}
        type={type}
        onClick={onClick}
        className={cn(
          "relative rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden",
          variants[variant],
          sizes[size],
          state !== "idle" && stateColors[state],
          isDisabled && "opacity-70 cursor-not-allowed",
          className
        )}
        disabled={isDisabled}
        whileTap={{ scale: isDisabled ? 1 : 0.98 }}
      >
        <AnimatePresence mode="wait">
          {state === "idle" && (
            <motion.span
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2"
            >
              {children}
            </motion.span>
          )}

          {state === "loading" && (
            <motion.span
              key="loading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              {loadingText}
            </motion.span>
          )}

          {state === "success" && (
            <motion.span
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2 text-white"
            >
              <Check className="w-4 h-4" />
              {successText}
            </motion.span>
          )}

          {state === "error" && (
            <motion.span
              key="error"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2 text-white"
            >
              <X className="w-4 h-4" />
              {errorText}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    );
  }
);

StatefulButton.displayName = "StatefulButton";

// Hook for managing button state
export const useStatefulButton = (initialState: ButtonState = "idle") => {
  const [state, setState] = useState<ButtonState>(initialState);

  const setLoading = () => setState("loading");
  const setSuccess = () => setState("success");
  const setError = () => setState("error");
  const reset = () => setState("idle");

  const execute = async <T,>(
    asyncFn: () => Promise<T>,
    options?: {
      successDuration?: number;
      errorDuration?: number;
    }
  ): Promise<T | undefined> => {
    const { successDuration = 2000, errorDuration = 2000 } = options || {};

    setLoading();
    try {
      const result = await asyncFn();
      setSuccess();
      setTimeout(reset, successDuration);
      return result;
    } catch (error) {
      setError();
      setTimeout(reset, errorDuration);
      throw error;
    }
  };

  return { state, setLoading, setSuccess, setError, reset, execute };
};
