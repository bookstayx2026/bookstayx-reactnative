// @ts-nocheck -- Expo Router emits /owner/index while web resolves the canonical /owner URL.
import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { ArrowLeft, LockKeyhole, ShieldCheck, Smartphone } from "lucide-react-native";
import { adminLogin, ApiError, developmentLogin, verifyAdminTotp, verifyOwnerOtp, sendOwnerOtp } from "@/services/api";
import { useAuth } from "./AuthContext";
import { colors, fontFamilies, layout, radii } from "@/theme";

export function AuthScreen({ mode }: { mode: "owner" | "admin" }) {
  const { signIn } = useAuth();
  const [step, setStep] = useState<"credentials" | "code">("credentials");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [tempToken, setTempToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const isOwner = mode === "owner";
  const devLoginEnabled = __DEV__ && process.env.EXPO_PUBLIC_ENABLE_DEV_LOGIN === "true";

  const enterDevelopmentSession = async () => {
    setError("");
    setBusy(true);
    try {
      const result = await developmentLogin(mode);
      await signIn({ role: mode, tokens: result.tokens, identity: result.identity });
      router.replace(isOwner ? "/owner" : "/admin");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Development login failed.");
    } finally { setBusy(false); }
  };

  const goBack = () => {
    if (step === "code") {
      setStep("credentials");
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(isOwner ? "/login" : "/");
  };

  const submit = async () => {
    setError("");
    setBusy(true);
    try {
      if (mode === "owner") {
        const clean = mobile.replace(/\D/g, "");
        if (step === "credentials") {
          if (clean.length !== 10) throw new Error("Enter a valid 10-digit mobile number.");
          await sendOwnerOtp(clean);
          setStep("code");
        } else {
          if (code.length < 4) throw new Error("Enter the OTP sent to your mobile.");
          const result = await verifyOwnerOtp(clean, code);
          await signIn({ role: "owner", tokens: result.tokens, identity: result.identity });
          router.replace("/owner");
        }
      } else if (step === "credentials") {
        if (!email.includes("@") || !password) throw new Error("Enter your admin email and password.");
        const result = await adminLogin(email.trim(), password);
        if (result.requiresTOTP && result.tempToken) {
          setTempToken(result.tempToken);
          setStep("code");
        } else if (result.data) {
          await signIn({ role: "admin", tokens: { accessToken: result.data.token, refreshToken: result.data.refreshToken }, identity: result.data.admin });
          router.replace("/admin");
        }
      } else {
        if (code.length !== 6) throw new Error("Enter the 6-digit authenticator code.");
        const result = await verifyAdminTotp(tempToken, code);
        await signIn({ role: "admin", tokens: { accessToken: result.data.token, refreshToken: result.data.refreshToken }, identity: result.data.admin });
        router.replace("/admin");
      }
    } catch (caught) {
      setError(caught instanceof ApiError || caught instanceof Error ? caught.message : "Sign-in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const copy = step === "credentials"
    ? isOwner ? "Use the mobile number registered with your property." : "Sign in with your protected BookStayX administrator account."
    : isOwner ? `Enter the OTP sent to +91 ${mobile}.` : "Enter the current code from your authenticator app.";

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={s.root}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.scroll}>
        <View style={s.page}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={goBack} style={s.back}><ArrowLeft color={colors.text}/></Pressable>
          <View style={s.mark}>{isOwner ? <Smartphone color={colors.gold} size={27}/> : <ShieldCheck color={colors.gold} size={27}/>}</View>
          <Text style={s.title}>{isOwner ? "Owner access" : "Admin access"}</Text>
          <Text style={s.copy}>{copy}</Text>
          <View style={s.form}>
            {step === "credentials"
              ? isOwner
                ? <Field label="Registered mobile number" value={mobile} onChangeText={setMobile} placeholder="9876543210" keyboardType="phone-pad" prefix="+91"/>
                : <><Field label="Admin email" value={email} onChangeText={setEmail} placeholder="admin@bookstayx.com" keyboardType="email-address"/><Field label="Password" value={password} onChangeText={setPassword} placeholder="Enter password" secureTextEntry/></>
              : <Field label={isOwner ? "One-time password" : "Authenticator code"} value={code} onChangeText={value=>setCode(value.replace(/\D/g,"").slice(0,6))} placeholder="••••••" keyboardType="number-pad"/>}
            {error ? <View accessibilityRole="alert" style={s.error}><Text style={s.errorText}>{error}</Text></View> : null}
            <Pressable disabled={busy} onPress={submit} style={({ pressed })=>[s.button,(pressed||busy)&&s.buttonPressed]}>
              {busy ? <ActivityIndicator color={colors.actionInk}/> : <><LockKeyhole size={17} color={colors.actionInk}/><Text style={s.buttonText}>{step === "credentials" ? isOwner ? "Send secure OTP" : "Continue securely" : "Verify and continue"}</Text></>}
            </Pressable>
            {devLoginEnabled && step === "credentials" ? <Pressable disabled={busy} onPress={enterDevelopmentSession} style={({pressed})=>[s.devButton,pressed&&s.buttonPressed]}><Text style={s.devButtonText}>One-click {isOwner ? "Owner" : "Admin"} Login</Text><Text style={s.devCaption}>Development only</Text></Pressable> : null}
            {step === "code" && isOwner ? <Pressable disabled={busy} onPress={()=>{setStep("credentials");setCode("");setError("");}} style={s.secondary}><Text style={s.secondaryText}>Change mobile number</Text></Pressable> : null}
          </View>
          <Text style={s.security}>Credentials are sent only to the configured BookStayX API and session tokens are encrypted on this device.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, prefix, ...props }: { label: string; prefix?: string } & React.ComponentProps<typeof TextInput>) {
  return <View><Text style={s.label}>{label}</Text><View style={s.inputWrap}>{prefix ? <Text style={s.prefix}>{prefix}</Text> : null}<TextInput {...props} autoCapitalize="none" autoCorrect={false} placeholderTextColor={colors.textMuted} style={s.input}/></View></View>;
}

const s = StyleSheet.create({
  root:{flex:1,backgroundColor:colors.background},scroll:{flexGrow:1,alignItems:"center",justifyContent:"center",padding:20},page:{width:"100%",maxWidth:layout.sourceMaxWidth},
  back:{width:48,height:48,alignItems:"center",justifyContent:"center",marginLeft:-12},mark:{width:58,height:58,borderRadius:29,alignItems:"center",justifyContent:"center",marginTop:28,borderWidth:1,borderColor:colors.hairline,backgroundColor:"rgba(224,184,74,.08)"},
  title:{marginTop:22,fontFamily:fontFamilies.displaySemiBold,fontSize:34,lineHeight:38,color:colors.text},copy:{maxWidth:360,marginTop:8,fontFamily:fontFamilies.sans,fontSize:14,lineHeight:22,color:colors.textSecondary},form:{gap:18,marginTop:32},
  label:{marginBottom:7,fontFamily:fontFamilies.sansMedium,fontSize:12,color:colors.textSecondary},inputWrap:{minHeight:52,flexDirection:"row",alignItems:"center",borderWidth:1,borderColor:colors.hairline,borderRadius:radii.card,backgroundColor:colors.surfaceRaised},
  prefix:{paddingLeft:14,fontFamily:fontFamilies.sansSemiBold,fontSize:15,color:colors.gold},input:{flex:1,minHeight:52,paddingHorizontal:14,fontFamily:fontFamilies.sans,fontSize:16,color:colors.text,outlineStyle:"none" as never},
  error:{padding:12,borderRadius:12,backgroundColor:"rgba(239,68,68,.12)",borderWidth:1,borderColor:"rgba(239,68,68,.35)"},errorText:{fontFamily:fontFamilies.sansMedium,fontSize:12,lineHeight:18,color:"#FCA5A5"},
  button:{minHeight:52,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:8,borderRadius:14,backgroundColor:colors.goldAction},buttonPressed:{opacity:.72},buttonText:{fontFamily:fontFamilies.sansBold,fontSize:14,color:colors.actionInk},
  secondary:{minHeight:48,alignItems:"center",justifyContent:"center"},secondaryText:{fontFamily:fontFamilies.sansSemiBold,fontSize:12,color:colors.gold},security:{marginTop:30,fontFamily:fontFamilies.sans,fontSize:11,lineHeight:17,color:colors.textMuted},
  devButton:{minHeight:54,alignItems:"center",justifyContent:"center",borderRadius:14,borderWidth:1,borderColor:"rgba(224,184,74,.5)",backgroundColor:"rgba(224,184,74,.08)"},devButtonText:{fontFamily:fontFamilies.sansBold,fontSize:13,color:colors.gold},devCaption:{marginTop:2,fontFamily:fontFamilies.sans,fontSize:9,color:colors.textMuted},
});
