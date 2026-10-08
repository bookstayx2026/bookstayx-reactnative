import { Redirect, Slot, usePathname, type Href } from "expo-router";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import { AdminShell } from "@/components/admin";
import { useAuth } from "@/components/auth";
import { colors } from "@/theme";

export default function AdminLayout() {
  const pathname = usePathname();
  const { ready, session } = useAuth();
  const loginRoute = pathname === "/admin/login";
  if (Platform.OS !== "web") return <Redirect href="/" />;
  if (!ready) return <View style={styles.loading}><ActivityIndicator color={colors.gold} /></View>;
  if (loginRoute) return session?.role === "admin" ? <Redirect href={"/admin" as Href} /> : <Slot />;
  if (session?.role !== "admin") return <Redirect href="/admin/login" />;
  return <AdminShell><Slot /></AdminShell>;
}

const styles = StyleSheet.create({ loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background } });
