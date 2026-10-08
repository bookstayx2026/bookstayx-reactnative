import { useState, type PropsWithChildren } from "react";
import { usePathname, useRouter, type Href } from "expo-router";
import { Image } from "expo-image";
import { LogOut, Menu, PanelLeftClose, X } from "lucide-react-native";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useAuth } from "@/components/auth";
import { PressableScale } from "@/components/foundation";
import { colors, fontFamilies, radii, spacing } from "@/theme";
import { adminSections, type AdminSection } from "./admin-navigation";

function AdminNavItem({ item, active, onPress }: { item: AdminSection; active: boolean; onPress: () => void }) {
  const Icon = item.icon;
  return <PressableScale accessibilityRole="link" accessibilityLabel={`Open ${item.label}`} accessibilityState={{ selected: active }} onPress={onPress} style={[styles.navItem, active && styles.navItemActive]}>
    <View style={styles.navItemInner}><Icon size={18} strokeWidth={1.7} color={active ? colors.gold : colors.textMuted} /><View style={styles.navCopy}><Text numberOfLines={1} style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text><Text numberOfLines={1} style={styles.navDescription}>{item.description}</Text></View></View>
  </PressableScale>;
}

export function AdminShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { session, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const expanded = width >= 980;
  const navigate = (href: string) => { setMobileMenuOpen(false); router.push(href as Href); };
  const isActive = (item: AdminSection) => item.href === "/admin" ? pathname === "/admin" || pathname === "/admin/" : pathname.startsWith(item.href);
  const logout = () => void signOut().then(() => router.replace("/admin/login"));
  const navigation = <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.navList}>
    <Text style={styles.navGroup}>WORKSPACE</Text>
    {adminSections.slice(0, 6).map((item) => <AdminNavItem key={item.slug} item={item} active={isActive(item)} onPress={() => navigate(item.href)} />)}
    <Text style={[styles.navGroup, styles.operationsLabel]}>OPERATIONS</Text>
    {adminSections.slice(6).map((item) => <AdminNavItem key={item.slug} item={item} active={isActive(item)} onPress={() => navigate(item.href)} />)}
  </ScrollView>;

  return <View style={styles.root}>
    {expanded ? <View style={styles.sidebar}>
      <View style={styles.brand}><Image source={require("../../../assets/images/bookstayx-logo.png")} contentFit="contain" style={styles.logo} /><View style={styles.adminPill}><Text style={styles.adminPillText}>ADMIN</Text></View></View>
      {navigation}
      <View style={styles.account}><View style={styles.avatar}><Text style={styles.avatarText}>{String((session?.identity as { email?: string })?.email || "A").charAt(0).toUpperCase()}</Text></View><View style={styles.accountCopy}><Text numberOfLines={1} style={styles.accountName}>Administrator</Text><Text numberOfLines={1} style={styles.accountEmail}>{(session?.identity as { email?: string })?.email || "Protected session"}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Sign out" onPress={logout} style={styles.iconButton}><LogOut size={17} color={colors.textMuted} /></Pressable></View>
    </View> : null}
    <View style={[styles.stage, expanded && styles.stageExpanded]}>
      <View style={styles.topbar}><View style={styles.mobileBrand}>{expanded ? <PanelLeftClose size={20} color={colors.gold} /> : <Pressable accessibilityRole="button" accessibilityLabel="Open admin navigation" onPress={() => setMobileMenuOpen(true)} style={styles.menuButton}><Menu size={20} color={colors.text} /></Pressable>}<View><Text style={styles.workspaceTitle}>BookStayX Operations</Text><Text style={styles.workspaceSubtitle}>Web administration workspace</Text></View></View><View style={styles.live}><View style={styles.liveDot} /><Text style={styles.liveText}>SECURE SESSION</Text></View></View>
      <View style={styles.content}>{children}</View>
    </View>
    {!expanded && mobileMenuOpen ? <View style={styles.drawerLayer}><Pressable accessibilityLabel="Close admin navigation" onPress={() => setMobileMenuOpen(false)} style={styles.scrim} /><View style={styles.drawer}><View style={styles.drawerHead}><View style={styles.brand}><Image source={require("../../../assets/images/bookstayx-logo.png")} contentFit="contain" style={styles.logo} /><View style={styles.adminPill}><Text style={styles.adminPillText}>ADMIN</Text></View></View><Pressable accessibilityRole="button" accessibilityLabel="Close admin navigation" onPress={() => setMobileMenuOpen(false)} style={styles.menuButton}><X size={20} color={colors.text} /></Pressable></View>{navigation}<PressableScale accessibilityRole="button" onPress={logout} style={styles.mobileLogout}><View style={styles.logoutInner}><LogOut size={17} color={colors.danger} /><Text style={styles.logoutText}>Sign out</Text></View></PressableScale></View></View> : null}
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: "row", backgroundColor: colors.background },
  sidebar: { width: 280, borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: colors.hairline, backgroundColor: colors.surface, paddingHorizontal: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.md },
  brand: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.sm }, logo: { width: 150, height: 38 },
  adminPill: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: radii.xs, backgroundColor: "rgba(224,184,74,.13)", borderWidth: 1, borderColor: colors.hairline }, adminPillText: { color: colors.gold, fontFamily: fontFamilies.sansBold, fontSize: 8, letterSpacing: 1 },
  navList: { paddingTop: spacing.xxl, paddingBottom: spacing.lg }, navGroup: { marginBottom: spacing.sm, paddingHorizontal: spacing.md, color: colors.textMuted, fontFamily: fontFamilies.sansBold, fontSize: 9, letterSpacing: 1.4 }, operationsLabel: { marginTop: spacing.xxl },
  navItem: { minHeight: 56, marginBottom: spacing.xs, borderRadius: radii.compactCard, borderWidth: 1, borderColor: colors.transparent }, navItemActive: { borderColor: colors.hairline, backgroundColor: "rgba(224,184,74,.08)" },
  navItemInner: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.md }, navCopy: { flex: 1, minWidth: 0 }, navLabel: { color: colors.textSecondary, fontFamily: fontFamilies.sansSemiBold, fontSize: 12 }, navLabelActive: { color: colors.gold }, navDescription: { marginTop: 3, color: colors.textMuted, fontFamily: fontFamilies.sans, fontSize: 9 },
  account: { minHeight: 62, flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.sm, paddingTop: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(255,255,255,.08)" }, avatar: { width: 36, height: 36, borderRadius: radii.pill, alignItems: "center", justifyContent: "center", backgroundColor: colors.goldAction }, avatarText: { color: colors.actionInk, fontFamily: fontFamilies.sansBold, fontSize: 13 }, accountCopy: { flex: 1, minWidth: 0 }, accountName: { color: colors.text, fontFamily: fontFamilies.sansSemiBold, fontSize: 11 }, accountEmail: { marginTop: 2, color: colors.textMuted, fontFamily: fontFamilies.sans, fontSize: 9 }, iconButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: radii.md },
  stage: { flex: 1, minWidth: 0 }, stageExpanded: { maxWidth: 1680 }, topbar: { minHeight: 72, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.xl, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,255,255,.08)", backgroundColor: "rgba(11,14,17,.96)" }, mobileBrand: { flexDirection: "row", alignItems: "center", gap: spacing.md }, menuButton: { width: 48, height: 48, alignItems: "center", justifyContent: "center", borderRadius: radii.compactCard }, workspaceTitle: { color: colors.text, fontFamily: fontFamilies.sansSemiBold, fontSize: 13 }, workspaceSubtitle: { marginTop: 2, color: colors.textMuted, fontFamily: fontFamilies.sans, fontSize: 9.5 }, live: { minHeight: 32, flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 11, borderRadius: radii.pill, backgroundColor: "rgba(61,255,138,.06)" }, liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success }, liveText: { color: colors.success, fontFamily: fontFamilies.sansBold, fontSize: 8, letterSpacing: 1 }, content: { flex: 1, minHeight: 0 },
  drawerLayer: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, zIndex: 100, flexDirection: "row" }, scrim: { flex: 1, backgroundColor: "rgba(0,0,0,.68)" }, drawer: { position: "absolute", left: 0, top: 0, bottom: 0, width: "84%", maxWidth: 320, backgroundColor: colors.surface, borderRightWidth: 1, borderRightColor: colors.hairline, paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.lg, ...Platform.select({ web: { boxShadow: "16px 0 40px rgba(0,0,0,.48)" }, default: { elevation: 24 } }) }, drawerHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, mobileLogout: { minHeight: 48, borderRadius: radii.compactCard, borderWidth: 1, borderColor: "rgba(239,68,68,.24)", backgroundColor: "rgba(239,68,68,.06)" }, logoutInner: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm }, logoutText: { color: colors.danger, fontFamily: fontFamilies.sansSemiBold, fontSize: 12 },
});
