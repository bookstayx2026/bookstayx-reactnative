import { Redirect } from "expo-router";
import { Platform } from "react-native";
import { AuthScreen } from "@/components/auth";

export default function AdminWebLogin() {
  if (Platform.OS !== "web") return <Redirect href="/" />;
  return <AuthScreen mode="admin" />;
}
