import { useEffect } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { Redirect, Slot, usePathname } from "expo-router";
import { colors } from "@/theme";
import { CustomerBottomNav } from "./CustomerBottomNav";
import { CustomerChromeProvider, useCustomerChrome } from "./CustomerChromeContext";
import { CustomerSideMenu } from "./CustomerSideMenu";
import { CustomerTopNav } from "./CustomerTopNav";
import { CustomerDataProvider } from "./CustomerDataContext";
import { useAuth } from "@/components/auth";
import { useIsDesktop, useIsMobile } from "@/hooks/use-window-class";

function CustomerShellContent() {
  const pathname = usePathname();
  const { ready, session } = useAuth();
  const { closeMenu, setScrolled } = useCustomerChrome();
  const isDesktop = useIsDesktop();
  const isMobile = useIsMobile();
  const isMobileTicket = pathname === "/ticket" && isMobile;
  const isPropertyDetail = /^\/properties\/[^/]+/.test(pathname) || pathname === "/booking-review" || pathname.startsWith("/referrals");
  const isLocationDetail = /^\/locations\/[^/]+/.test(pathname);
  const needsAuth = ["/profile", "/bookings", "/saved", "/booking-review", "/notifications"].some((route)=>pathname===route||pathname.startsWith(`${route}/`));

  useEffect(() => {
    closeMenu();
    setScrolled(false);
  }, [closeMenu, pathname, setScrolled]);

  if(!ready)return <View style={styles.loading}><ActivityIndicator color={colors.gold}/></View>;
  if(needsAuth && !session)return <Redirect href="/login"/>;
  return (
    <View style={styles.root}>
      <Slot />
      {isMobileTicket ? null : isPropertyDetail || isLocationDetail ? (isDesktop ? <CustomerTopNav /> : null) : <CustomerTopNav />}
      {isPropertyDetail || isMobileTicket ? null : <CustomerBottomNav />}
      {isPropertyDetail || isMobileTicket ? null : <CustomerSideMenu />}
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

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.background }, loading:{flex:1,alignItems:"center",justifyContent:"center",backgroundColor:colors.background} });
