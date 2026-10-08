import { useWindowDimensions } from "react-native";
import { layout } from "@/theme";

export type WindowClass = "compact" | "medium" | "expanded";

export function useWindowClass(): WindowClass {
  const { width } = useWindowDimensions();

  if (width <= layout.compactMaxWidth) return "compact";
  if (width <= layout.mediumMaxWidth) return "medium";
  return "expanded";
}

export function useIsMobile(): boolean {
  const { width } = useWindowDimensions();
  return width <= layout.compactMaxWidth;
}

export function useIsTablet(): boolean {
  const { width } = useWindowDimensions();
  return width > layout.compactMaxWidth && width <= layout.mediumMaxWidth;
}

export function useIsDesktop(): boolean {
  const { width } = useWindowDimensions();
  return width > layout.mediumMaxWidth;
}

export function useIsWideScreen(): boolean {
  const { width } = useWindowDimensions();
  return width >= 768;
}

export function useContentMaxWidth(): number {
  const windowClass = useWindowClass();

  if (windowClass === "compact") return layout.sourceMaxWidth;
  if (windowClass === "medium") return layout.tabletContentMaxWidth;
  return layout.expandedContentMaxWidth;
}

export type ResponsiveConfig<T> = {
  mobile?: T;
  tablet?: T;
  desktop?: T;
  compact?: T;
  medium?: T;
  expanded?: T;
};

export function useResponsiveValue<T>(values: ResponsiveConfig<T>): T {
  const windowClass = useWindowClass();

  if (windowClass === "expanded") {
    if (values.expanded !== undefined) return values.expanded;
    if (values.desktop !== undefined) return values.desktop;
  }
  if (windowClass === "medium") {
    if (values.medium !== undefined) return values.medium;
    if (values.tablet !== undefined) return values.tablet;
  }
  return (values.compact !== undefined ? values.compact : values.mobile) as T;
}
