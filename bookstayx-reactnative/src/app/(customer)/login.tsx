import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ArrowLeft, Building2, ChevronRight, LockKeyhole, UserRound } from "lucide-react-native";
import { Redirect, router } from "expo-router";
import { useAuth, type AuthRole } from "@/components/auth";
import { AppScreen, PressableScale } from "@/components/foundation";
import { useCustomerChrome } from "@/components/customer";
import { colors, fontFamilies, layout, radii } from "@/theme";
import { developmentLogin, sendCustomerOtp, verifyCustomerOtp } from "@/services/api";

type LoginChoiceProps = {
  icon: typeof UserRound;
  title: string;
  description: string;
  onPress: () => void;
  loading: boolean;
};

function LoginChoice({ icon: Icon, title, description, onPress, loading }: LoginChoiceProps) {
  return (
    <PressableScale
      accessibilityLabel={title}
      accessibilityRole="button"
      disabled={loading}
      onPress={onPress}
      style={styles.choice}
    >
      <View style={styles.choiceContent}>
        <View style={styles.iconCircle}><Icon size={29} color={colors.textSecondary} strokeWidth={1.65} /></View>
        <View style={styles.choiceCopy}>
          <Text style={styles.choiceTitle}>{title}</Text>
          <Text style={styles.choiceDescription}>{description}</Text>
        </View>
        {loading ? <ActivityIndicator color={colors.gold} /> : <ChevronRight size={25} color={colors.textMuted} strokeWidth={1.7} />}
      </View>
    </PressableScale>
  );
}

export default function LoginScreen() {
  const { onScroll } = useCustomerChrome();
  const { ready, session, signIn } = useAuth();
  const [pendingRole, setPendingRole] = useState<AuthRole | null>(null);
  const [step,setStep]=useState<"choices"|"customer-mobile"|"customer-otp">("choices");
  const [mobile,setMobile]=useState("");
  const [otp,setOtp]=useState("");
  const [fullName,setFullName]=useState("");
  const [email,setEmail]=useState("");
  const [error,setError]=useState("");
  const devLoginEnabled=__DEV__&&process.env.EXPO_PUBLIC_ENABLE_DEV_LOGIN==="true";

  if (!ready) return <View style={styles.loading}><ActivityIndicator color={colors.gold} /></View>;
  if (session?.role === "customer") return <Redirect href="/profile" />;
  if (session?.role === "owner") return <Redirect href="/owner" />;

  const enterCustomer = async () => {
    if(!devLoginEnabled){setStep("customer-mobile");return;}
    setPendingRole("customer");
    try {
      const result=await developmentLogin("customer");
      await signIn({role:"customer",tokens:result.tokens,identity:result.identity});
      router.replace("/profile");
    } catch(caught){setError(caught instanceof Error?caught.message:"Development login failed.")} finally { setPendingRole(null); }
  };

  const enterVendor = async () => {
    if (!devLoginEnabled) { router.push("/owner-login"); return; }
    router.push("/vendor-property-selector");
  };

  const customerSubmit=async()=>{setError("");setPendingRole("customer");try{const clean=mobile.replace(/\D/g,"");if(clean.length!==10)throw new Error("Enter a valid 10-digit mobile number.");if(step==="customer-mobile"){await sendCustomerOtp(clean);setStep("customer-otp")}else{if(otp.length!==6)throw new Error("Enter the 6-digit OTP.");const result=await verifyCustomerOtp(clean,otp,fullName.trim(),email.trim());await signIn({role:"customer",tokens:result.tokens,identity:result.identity});router.replace("/profile")}}catch(caught){setError(caught instanceof Error?caught.message:"Login failed.")}finally{setPendingRole(null)}};

  return (
    <AppScreen contentContainerStyle={styles.screen} scrollProps={{ onScroll, scrollEventThrottle: 16 }}>
      {step!=="choices"?<Pressable accessibilityLabel="Back to login choices" onPress={()=>{setStep("choices");setError("")}} style={styles.back}><ArrowLeft color={colors.text}/></Pressable>:null}
      <View style={styles.intro}>
        <Text style={styles.welcome}>WELCOME</Text>
        <Text style={styles.title}>{step==="choices"?"Login":"Customer Login"}</Text>
        <Text style={styles.subtitle}>{step==="choices"?"Choose how you want to continue with BookStayX.":step==="customer-mobile"?"Enter your details and mobile number. New customers are registered automatically.":`Enter the OTP sent to +91 ${mobile}.`}</Text>
      </View>
      {step==="choices"?<View style={styles.choices}>
        <LoginChoice icon={UserRound} title="Login As Customer/User" description="Book stays, manage bookings and saved properties." onPress={enterCustomer} loading={pendingRole === "customer"} />
        <LoginChoice icon={Building2} title="Login As Vendor" description="Manage your properties, listings and guest stays." onPress={enterVendor} loading={pendingRole === "owner"} />
        {devLoginEnabled?<Text style={styles.devNotice}>Development one-click login is active</Text>:null}
      </View>:<View style={styles.form}>
        {step==="customer-mobile"?<><Field label="Full name (optional)" value={fullName} onChangeText={setFullName} placeholder="Your full name"/><Field label="Email (optional)" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address"/><Field label="Mobile number" value={mobile} onChangeText={v=>setMobile(v.replace(/\D/g,"").slice(0,10))} placeholder="9876543210" keyboardType="phone-pad"/></>:<Field label="One-time password" value={otp} onChangeText={v=>setOtp(v.replace(/\D/g,"").slice(0,6))} placeholder="••••••" keyboardType="number-pad"/>}
        {error?<Text accessibilityRole="alert" style={styles.error}>{error}</Text>:null}
        <Pressable disabled={pendingRole==="customer"} onPress={customerSubmit} style={styles.submit}>{pendingRole==="customer"?<ActivityIndicator color={colors.actionInk}/>:<><LockKeyhole size={17} color={colors.actionInk}/><Text style={styles.submitText}>{step==="customer-mobile"?"Send secure OTP":"Verify & Login"}</Text></>}</Pressable>
      </View>}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  screen: { minHeight: "100%", paddingTop: 152, paddingHorizontal: layout.screenInset, paddingBottom: layout.bottomChromeReserve + 24, backgroundColor: colors.background },
  intro: { alignItems: "center", paddingHorizontal: 20 },
  welcome: { color: colors.goldPale, fontFamily: fontFamilies.sansSemiBold, fontSize: 13, lineHeight: 18, letterSpacing: 4.2 },
  title: { marginTop: 20, color: colors.text, fontFamily: fontFamilies.sansBold, fontSize: 36, lineHeight: 42 },
  subtitle: { maxWidth: 310, marginTop: 13, color: colors.textMuted, fontFamily: fontFamilies.sans, fontSize: 16, lineHeight: 23, textAlign: "center" },
  choices: { marginTop: 68, gap: 17 },
  back:{position:"absolute",top:94,left:layout.screenInset,width:44,height:44,alignItems:"center",justifyContent:"center",zIndex:2},form:{marginTop:42,gap:17},label:{marginBottom:7,color:colors.textSecondary,fontFamily:fontFamilies.sansMedium,fontSize:12},input:{minHeight:54,paddingHorizontal:15,borderRadius:14,borderWidth:1,borderColor:"rgba(201,205,212,.18)",backgroundColor:colors.surfaceRaised,color:colors.text,fontFamily:fontFamilies.sans,fontSize:15},submit:{minHeight:54,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:8,borderRadius:14,backgroundColor:colors.goldAction},submitText:{color:colors.actionInk,fontFamily:fontFamilies.sansBold,fontSize:14},error:{padding:12,borderRadius:12,borderWidth:1,borderColor:"rgba(239,68,68,.35)",backgroundColor:"rgba(239,68,68,.12)",color:"#FCA5A5",fontFamily:fontFamilies.sansMedium,fontSize:12},devNotice:{textAlign:"center",color:colors.gold,fontFamily:fontFamilies.sansMedium,fontSize:10},
  choice: { minHeight: 142, borderRadius: radii.largePanel, borderWidth: 1, borderColor: "rgba(201, 205, 212, 0.18)", backgroundColor: colors.surfaceRaised, overflow: "hidden" },
  choiceContent: { flex: 1, minHeight: 142, flexDirection: "row", alignItems: "center", gap: 18, paddingHorizontal: 22, paddingVertical: 22 },
  iconCircle: { width: 68, height: 68, flexShrink: 0, borderRadius: 34, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(201, 205, 212, 0.18)", backgroundColor: colors.surfaceStrong },
  choiceCopy: { flex: 1, minWidth: 0 },
  choiceTitle: { color: colors.text, fontFamily: fontFamilies.sansSemiBold, fontSize: 17, lineHeight: 23 },
  choiceDescription: { marginTop: 7, color: colors.textMuted, fontFamily: fontFamilies.sans, fontSize: 14, lineHeight: 21 },
});

function Field(props:{label:string}&React.ComponentProps<typeof TextInput>){const{label,...input}=props;return <View><Text style={styles.label}>{label}</Text><TextInput {...input} autoCapitalize="none" autoCorrect={false} placeholderTextColor={colors.textMuted} style={styles.input}/></View>}
