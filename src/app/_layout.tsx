import "react-native-reanimated";
import { useEffect } from "react";
import { Stack, type ErrorBoundaryProps } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  CormorantGaramond_400Regular,
  CormorantGaramond_500Medium,
  CormorantGaramond_500Medium_Italic,
  CormorantGaramond_600SemiBold,
  CormorantGaramond_700Bold,
  useFonts as useCormorantFonts,
} from "@expo-google-fonts/cormorant-garamond";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts as useInterFonts,
} from "@expo-google-fonts/inter";
import { colors, fontFamilies } from "@/theme";
import { AuthProvider } from "@/components/auth";
import { ReferralAttributionTracker } from "@/components/referral/ReferralAttributionTracker";

void SplashScreen.preventAutoHideAsync();
void SystemUI.setBackgroundColorAsync(colors.background);

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View accessibilityRole="alert" style={errorStyles.screen}>
      <View style={errorStyles.icon}><Text style={errorStyles.iconText}>!</Text></View>
      <Text style={errorStyles.eyebrow}>SOMETHING WENT WRONG</Text>
      <Text style={errorStyles.title}>We could not open this screen.</Text>
      <Text style={errorStyles.copy} numberOfLines={4}>
        {__DEV__ ? error.message : "Please check your connection and try again."}
      </Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Try loading the screen again" onPress={retry} style={({ pressed }) => [errorStyles.button, pressed && errorStyles.pressed]}>
        <Text style={errorStyles.buttonText}>Try Again</Text>
      </Pressable>
    </View>
  );
}

export default function RootLayout() {
  const [interLoaded, interError] = useInterFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [cormorantLoaded, cormorantError] = useCormorantFonts({
    CormorantGaramond_400Regular,
    CormorantGaramond_500Medium,
    CormorantGaramond_500Medium_Italic,
    CormorantGaramond_600SemiBold,
    CormorantGaramond_700Bold,
  });
  const ready = (interLoaded || interError) && (cormorantLoaded || cormorantError);

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaProvider>
        <AuthProvider><ReferralAttributionTracker /><StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: "fade",
          }}
        /></AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const errorStyles = StyleSheet.create({
  screen: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28, backgroundColor: colors.background },
  icon: { width: 64, height: 64, alignItems: "center", justifyContent: "center", borderRadius: 32, borderWidth: 1, borderColor: "rgba(224,184,74,.45)", backgroundColor: "rgba(224,184,74,.08)" },
  iconText: { color: colors.gold, fontFamily: fontFamilies.displaySemiBold, fontSize: 34 },
  eyebrow: { marginTop: 20, color: colors.gold, fontFamily: fontFamilies.sansBold, fontSize: 10, letterSpacing: 1.7 },
  title: { marginTop: 8, color: colors.text, fontFamily: fontFamilies.displaySemiBold, fontSize: 29, lineHeight: 34, textAlign: "center" },
  copy: { maxWidth: 420, marginTop: 9, color: colors.textMuted, fontFamily: fontFamilies.sans, fontSize: 13, lineHeight: 20, textAlign: "center" },
  button: { minWidth: 180, minHeight: 50, marginTop: 24, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: colors.goldAction },
  pressed: { opacity: .8, transform: [{ scale: .98 }] },
  buttonText: { color: colors.actionInk, fontFamily: fontFamilies.sansBold, fontSize: 13 },
});
