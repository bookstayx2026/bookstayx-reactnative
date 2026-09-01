import { useWindowDimensions } from "react-native";
import { layout } from "@/theme";

export type WindowClass = "compact" | "medium" | "expanded";

export function useWindowClass(): WindowClass {
  const { width } = useWindowDimensions();

  if (width <= layout.compactMaxWidth) return "compact";
  if (width <= layout.mediumMaxWidth) return "medium";
  return "expanded";
}
