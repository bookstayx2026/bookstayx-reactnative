import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

type CustomerChromeValue = {
  menuOpen: boolean;
  scrolled: boolean;
  closeMenu: () => void;
  openMenu: () => void;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  setScrolled: (scrolled: boolean) => void;
};

const CustomerChromeContext = createContext<CustomerChromeValue | null>(null);

export function CustomerChromeProvider({ children }: PropsWithChildren) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const openMenu = useCallback(() => setMenuOpen(true), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setScrolled(event.nativeEvent.contentOffset.y > 18);
  }, []);

  const value = useMemo(
    () => ({ menuOpen, scrolled, closeMenu, openMenu, onScroll, setScrolled }),
    [closeMenu, menuOpen, onScroll, openMenu, scrolled],
  );

  return <CustomerChromeContext.Provider value={value}>{children}</CustomerChromeContext.Provider>;
}

export function useCustomerChrome() {
  const context = useContext(CustomerChromeContext);
  if (!context) throw new Error("useCustomerChrome must be used inside CustomerChromeProvider");
  return context;
}
