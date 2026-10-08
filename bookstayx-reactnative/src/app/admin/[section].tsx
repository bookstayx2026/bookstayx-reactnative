import { Redirect, useLocalSearchParams, type Href } from "expo-router";
import { AdminFinanceScreen, AdminModulePlaceholder, AdminPropertiesScreen, AdminReferralsScreen, getAdminSection } from "@/components/admin";

export default function AdminModuleRoute() {
  const { section: rawSection } = useLocalSearchParams<{ section?: string | string[] }>();
  const slug = Array.isArray(rawSection) ? rawSection[0] : rawSection;
  const section = getAdminSection(slug);
  if (!section || section.slug === "overview") return <Redirect href={"/admin" as Href} />;
  if (section.slug === "properties") return <AdminPropertiesScreen />;
  if (section.slug === "referrals") return <AdminReferralsScreen />;
  if (section.slug === "b2b") return <AdminReferralsScreen b2bOnly />;
  if (section.slug === "transactions") return <AdminFinanceScreen mode="transactions" />;
  if (section.slug === "requests") return <AdminFinanceScreen mode="requests" />;
  if (section.slug === "revenue") return <AdminFinanceScreen mode="revenue" />;
  return <AdminModulePlaceholder section={section} />;
}
