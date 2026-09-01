import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Slot, usePathname } from "expo-router";
import { colors } from "@/theme";
import { CustomerBottomNav } from "./CustomerBottomNav";
import { CustomerChromeProvider, useCustomerChrome } from "./CustomerChromeContext";
import { CustomerSideMenu } from "./CustomerSideMenu";
import { CustomerTopNav } from "./CustomerTopNav";
import { CustomerDataProvider } from "./CustomerDataContext";

function CustomerShellContent() {
  const pathname = usePathname();
  const { closeMenu, setScrolled } = useCustomerChrome();
  const isPropertyDetail = /^\/properties\/[^/]+/.test(pathname) || pathname === "/booking-review" || pathname.startsWith("/referrals");

  useEffect(() => {
    closeMenu();
    setScrolled(false);
  }, [closeMenu, pathname, setScrolled]);

  return (
    <View style={styles.root}>
      <Slot />
      {isPropertyDetail ? null : <CustomerTopNav />}
      {isPropertyDetail ? null : <CustomerBottomNav />}
      {isPropertyDetail ? null : <CustomerSideMenu />}
    </View>
  );
}

export function CustomerShell() {
  return (
    <CustomerDataProvider>
      <CustomerChromeProvider>
        <CustomerShellContent />
      </CustomerChromeProvider>
    </CustomerDataProvider>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.background } });
