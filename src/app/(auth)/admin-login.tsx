import { Redirect } from "expo-router";
import { Platform } from "react-native";

export default function LegacyAdminLoginRoute() {
  return <Redirect href={Platform.OS === "web" ? "/admin/login" : "/"} />;
}
