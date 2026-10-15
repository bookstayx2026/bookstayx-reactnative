import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ArrowLeft, Building2, CheckCircle2, ChevronRight, LockKeyhole, ShieldCheck, UserRound } from "lucide-react-native";
import { Redirect, router } from "expo-router";
import { useAuth, type AuthRole } from "@/components/auth";
import { AppScreen, PressableScale } from "@/components/foundation";
import { useCustomerChrome } from "@/components/customer";
import { colors, fontFamilies, layout, radii } from "@/theme";
import {
  customerPasswordLogin,
  customerSignup,
  developmentLogin,
  sendCustomerSignupOtp,
  verifyCustomerSignupPhone,
} from "@/services/api";

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
        <View style={styles.iconCircle}>
          <Icon size={29} color={colors.textSecondary} strokeWidth={1.65} />
        </View>
        <View style={styles.choiceCopy}>
          <Text style={styles.choiceTitle}>{title}</Text>
          <Text style={styles.choiceDescription}>{description}</Text>
        </View>
        {loading ? (
          <ActivityIndicator color={colors.gold} />
        ) : (
          <ChevronRight size={25} color={colors.textMuted} strokeWidth={1.7} />
        )}
      </View>
    </PressableScale>
  );
}

export default function LoginScreen() {
  const { onScroll } = useCustomerChrome();
  const { ready, session, signIn } = useAuth();
  const [pendingRole, setPendingRole] = useState<AuthRole | null>(null);
  const [step, setStep] = useState<"choices" | "customer">("choices");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  // Common fields
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");

  // Signup fields & verification
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");

  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const demoOwnerLoginEnabled = process.env.EXPO_PUBLIC_ENABLE_DEV_LOGIN === "true";
  const localCustomerDevLoginEnabled = __DEV__ && demoOwnerLoginEnabled;

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }
  if (session?.role === "customer") return <Redirect href="/profile" />;
  if (session?.role === "owner") return <Redirect href="/owner" />;

  const enterCustomer = () => {
    setError("");
    setInfoMessage("");
    setStep("customer");
  };

  const enterVendor = () => {
    if (!demoOwnerLoginEnabled) {
      router.push("/owner-login");
      return;
    }
    router.push("/vendor-property-selector");
  };

  const handleDevLogin = async () => {
    setPendingRole("customer");
    setError("");
    try {
      const result = await developmentLogin("customer");
      await signIn({ role: "customer", tokens: result.tokens, identity: result.identity });
      router.replace("/profile");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Development login failed.");
    } finally {
      setPendingRole(null);
    }
  };

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  const cleanPhone = (v: string) => v.replace(/\D/g, "");
  const isValidMobile = (v: string) => /^[6-9]\d{9}$/.test(cleanPhone(v));

  // ── Login Submit Handler ──────────────────────────────────────────────────
  const handleLoginSubmit = async () => {
    setError("");
    setInfoMessage("");

    const trimmedEmail = email.trim().toLowerCase();
    const cleanedMobile = cleanPhone(mobile);

    if (!isValidEmail(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!isValidMobile(cleanedMobile)) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const result = await customerPasswordLogin({
        email: trimmedEmail,
        mobileNumber: cleanedMobile,
        password,
      });
      await signIn({ role: "customer", tokens: result.tokens, identity: result.identity });
      router.replace("/profile");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  // ── Signup: Step 1 (Send OTP for Phone Verification) ──────────────────────
  const handleSendOtp = async () => {
    setError("");
    setInfoMessage("");

    const trimmedEmail = email.trim().toLowerCase();
    const cleanedMobile = cleanPhone(mobile);

    if (!isValidEmail(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!isValidMobile(cleanedMobile)) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    setLoading(true);
    try {
      const res = await sendCustomerSignupOtp(trimmedEmail, cleanedMobile);
      setOtpSent(true);
      setInfoMessage(
        res.demoMode
          ? "Verification code sent! (Demo Mode: Enter fixed OTP 0000)"
          : "Verification code sent to your phone via SMS."
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to send verification code.");
    } finally {
      setLoading(false);
    }
  };

  // ── Signup: Step 2 (Verify OTP) ───────────────────────────────────────────
  const handleVerifyOtp = async () => {
    setError("");
    setInfoMessage("");

    const cleanedMobile = cleanPhone(mobile);
    const trimmedOtp = otp.trim();

    if (!trimmedOtp) {
      setError("Please enter the verification code.");
      return;
    }

    setLoading(true);
    try {
      const res = await verifyCustomerSignupPhone(cleanedMobile, trimmedOtp);
      setPhoneVerified(true);
      setVerificationToken(res.verificationToken);
      setInfoMessage("Phone verified successfully! Now set your password to complete registration.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Invalid verification code.");
    } finally {
      setLoading(false);
    }
  };

  // ── Signup: Step 3 (Create Account) ───────────────────────────────────────
  const handleCompleteSignup = async () => {
    setError("");
    setInfoMessage("");

    const trimmedEmail = email.trim().toLowerCase();
    const cleanedMobile = cleanPhone(mobile);

    if (!phoneVerified || !verificationToken) {
      setError("Please verify your phone number first.");
      return;
    }
    if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError("Password must be at least 8 characters long and contain both letters and numbers.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);
    try {
      const result = await customerSignup({
        email: trimmedEmail,
        mobileNumber: cleanedMobile,
        fullName: fullName.trim() || undefined,
        password,
        confirmPassword,
        verificationToken,
      });
      await signIn({ role: "customer", tokens: result.tokens, identity: result.identity });
      router.replace("/profile");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Account creation failed.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setError("");
    setInfoMessage("");
    setOtpSent(false);
    setPhoneVerified(false);
    setVerificationToken("");
    setOtp("");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <AppScreen contentContainerStyle={styles.screen} scrollProps={{ onScroll, scrollEventThrottle: 16 }}>
      {step !== "choices" ? (
        <Pressable
          accessibilityLabel="Back to choices"
          onPress={() => {
            setStep("choices");
            resetForm();
          }}
          style={styles.back}
        >
          <ArrowLeft color={colors.text} />
        </Pressable>
      ) : null}

      <View style={styles.intro}>
        <Text style={styles.welcome}>WELCOME</Text>
        <Text style={styles.title}>{step === "choices" ? "Login" : "Guest Portal"}</Text>
        <Text style={styles.subtitle}>
          {step === "choices"
            ? "Choose how you want to continue with BookStayX."
            : authMode === "login"
            ? "Log in with your email, mobile number, and password."
            : "Create your BookStayX guest account."}
        </Text>
      </View>

      {step === "choices" ? (
        <View style={styles.choices}>
          <LoginChoice
            icon={UserRound}
            title="Login As Customer/User"
            description="Book stays, manage bookings and saved properties."
            onPress={enterCustomer}
            loading={pendingRole === "customer"}
          />
          <LoginChoice
            icon={Building2}
            title="Login As Vendor"
            description="Manage your properties, listings and guest stays."
            onPress={enterVendor}
            loading={pendingRole === "owner"}
          />
          {localCustomerDevLoginEnabled ? (
            <Pressable onPress={handleDevLogin} style={styles.devButton}>
              <Text style={styles.devNotice}>⚡ Development one-click login</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <View style={styles.formContainer}>
          {/* Segmented Tab Switcher */}
          <View style={styles.tabContainer}>
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: authMode === "login" }}
              onPress={() => {
                setAuthMode("login");
                resetForm();
              }}
              style={[styles.tabButton, authMode === "login" && styles.tabButtonActive]}
            >
              <Text style={[styles.tabText, authMode === "login" && styles.tabTextActive]}>
                Sign In
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: authMode === "signup" }}
              onPress={() => {
                setAuthMode("signup");
                resetForm();
              }}
              style={[styles.tabButton, authMode === "signup" && styles.tabButtonActive]}
            >
              <Text style={[styles.tabText, authMode === "signup" && styles.tabTextActive]}>
                Create Account
              </Text>
            </Pressable>
          </View>

          {/* Form Fields */}
          <View style={styles.form}>
            {authMode === "signup" && (
              <Field
                label="Full name (optional)"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Your full name"
                editable={!loading}
              />
            )}

            <Field
              label="Email address"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              editable={!loading && !phoneVerified}
            />

            <Field
              label="Mobile number"
              value={mobile}
              onChangeText={(v) => setMobile(v.replace(/\D/g, "").slice(0, 10))}
              placeholder="9876543210 (10 digits)"
              keyboardType="phone-pad"
              editable={!loading && !phoneVerified}
            />

            {/* ── Sign-Up: Verification Section ── */}
            {authMode === "signup" && !phoneVerified && (
              <>
                {!otpSent ? (
                  <Pressable
                    disabled={loading}
                    onPress={handleSendOtp}
                    style={[styles.verifyPhoneBtn, loading && styles.btnDisabled]}
                  >
                    {loading ? (
                      <ActivityIndicator color={colors.gold} />
                    ) : (
                      <>
                        <ShieldCheck size={16} color={colors.gold} />
                        <Text style={styles.verifyPhoneBtnText}>Verify Phone</Text>
                      </>
                    )}
                  </Pressable>
                ) : (
                  <View style={styles.otpBlock}>
                    <Field
                      label="Verification Code (OTP)"
                      value={otp}
                      onChangeText={(v) => setOtp(v.replace(/\D/g, "").slice(0, 6))}
                      placeholder="Enter 0000"
                      keyboardType="number-pad"
                      editable={!loading}
                    />
                    <Pressable
                      disabled={loading}
                      onPress={handleVerifyOtp}
                      style={[styles.confirmOtpBtn, loading && styles.btnDisabled]}
                    >
                      {loading ? (
                        <ActivityIndicator color={colors.actionInk} />
                      ) : (
                        <Text style={styles.confirmOtpBtnText}>Confirm Code</Text>
                      )}
                    </Pressable>
                  </View>
                )}
              </>
            )}

            {/* ── Sign-Up: Verified Badge & Password Section ── */}
            {authMode === "signup" && phoneVerified && (
              <>
                <View style={styles.verifiedBadge}>
                  <CheckCircle2 size={16} color="#4ADE80" />
                  <Text style={styles.verifiedBadgeText}>Phone Number Verified (+91 {mobile})</Text>
                </View>

                <Field
                  label="Create password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Min 8 characters (letters & numbers)"
                  secureTextEntry
                  editable={!loading}
                />

                <Field
                  label="Confirm password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter your password"
                  secureTextEntry
                  editable={!loading}
                />

                <Pressable
                  disabled={loading}
                  onPress={handleCompleteSignup}
                  style={[styles.submit, loading && styles.btnDisabled]}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.actionInk} />
                  ) : (
                    <>
                      <LockKeyhole size={17} color={colors.actionInk} />
                      <Text style={styles.submitText}>Complete Registration</Text>
                    </>
                  )}
                </Pressable>
              </>
            )}

            {/* ── Login: Password & Submit ── */}
            {authMode === "login" && (
              <>
                <Field
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  secureTextEntry
                  editable={!loading}
                />

                <Pressable
                  disabled={loading}
                  onPress={handleLoginSubmit}
                  style={[styles.submit, loading && styles.btnDisabled]}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.actionInk} />
                  ) : (
                    <>
                      <LockKeyhole size={17} color={colors.actionInk} />
                      <Text style={styles.submitText}>Sign In</Text>
                    </>
                  )}
                </Pressable>
              </>
            )}

            {/* Feedback Messages */}
            {infoMessage ? (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>{infoMessage}</Text>
              </View>
            ) : null}

            {error ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {error}
              </Text>
            ) : null}

            {/* Switch Mode Footer Link */}
            <Pressable
              onPress={() => {
                setAuthMode(authMode === "login" ? "signup" : "login");
                resetForm();
              }}
              style={styles.switchModeBtn}
            >
              <Text style={styles.switchModeText}>
                {authMode === "login"
                  ? "Don't have an account? "
                  : "Already have an account? "}
                <Text style={styles.switchModeHighlight}>
                  {authMode === "login" ? "Create one here" : "Sign In"}
                </Text>
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  screen: {
    minHeight: "100%",
    paddingTop: 152,
    paddingHorizontal: layout.screenInset,
    paddingBottom: layout.bottomChromeReserve + 24,
    backgroundColor: colors.background,
  },
  intro: { alignItems: "center", paddingHorizontal: 20 },
  welcome: { color: colors.goldPale, fontFamily: fontFamilies.sansSemiBold, fontSize: 13, lineHeight: 18, letterSpacing: 4.2 },
  title: { marginTop: 20, color: colors.text, fontFamily: fontFamilies.sansBold, fontSize: 36, lineHeight: 42 },
  subtitle: { maxWidth: 310, marginTop: 13, color: colors.textMuted, fontFamily: fontFamilies.sans, fontSize: 16, lineHeight: 23, textAlign: "center" },
  choices: { marginTop: 68, gap: 17 },
  back: { position: "absolute", top: 94, left: layout.screenInset, width: 44, height: 44, alignItems: "center", justifyContent: "center", zIndex: 2 },
  choice: { minHeight: 142, borderRadius: radii.largePanel, borderWidth: 1, borderColor: "rgba(201, 205, 212, 0.18)", backgroundColor: colors.surfaceRaised, overflow: "hidden" },
  choiceContent: { flex: 1, minHeight: 142, flexDirection: "row", alignItems: "center", gap: 18, paddingHorizontal: 22, paddingVertical: 22 },
  iconCircle: { width: 68, height: 68, flexShrink: 0, borderRadius: 34, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(201, 205, 212, 0.18)", backgroundColor: colors.surfaceStrong },
  choiceCopy: { flex: 1, minWidth: 0 },
  choiceTitle: { color: colors.text, fontFamily: fontFamilies.sansSemiBold, fontSize: 17, lineHeight: 23 },
  choiceDescription: { marginTop: 7, color: colors.textMuted, fontFamily: fontFamilies.sans, fontSize: 14, lineHeight: 21 },
  devButton: { marginTop: 8, padding: 8, alignItems: "center" },
  devNotice: { textAlign: "center", color: colors.gold, fontFamily: fontFamilies.sansMedium, fontSize: 12 },

  formContainer: { marginTop: 32 },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: colors.surfaceRaised,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(201, 205, 212, 0.15)",
    padding: 4,
    marginBottom: 24,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.3)",
  },
  tabText: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 14,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
  },
  form: { gap: 16 },
  label: { marginBottom: 7, color: colors.textSecondary, fontFamily: fontFamilies.sansMedium, fontSize: 12 },
  input: {
    minHeight: 52,
    paddingHorizontal: 15,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(201,205,212,.18)",
    backgroundColor: colors.surfaceRaised,
    color: colors.text,
    fontFamily: fontFamilies.sans,
    fontSize: 15,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  verifyPhoneBtn: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.4)",
    backgroundColor: "rgba(224, 184, 74, 0.08)",
  },
  verifyPhoneBtnText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 14,
  },
  otpBlock: {
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "rgba(224, 184, 74, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.2)",
  },
  confirmOtpBtn: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.goldAction,
  },
  confirmOtpBtnText: {
    color: colors.actionInk,
    fontFamily: fontFamilies.sansBold,
    fontSize: 14,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(74, 222, 128, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(74, 222, 128, 0.3)",
  },
  verifiedBadgeText: {
    color: "#4ADE80",
    fontFamily: fontFamilies.sansMedium,
    fontSize: 13,
  },
  submit: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    backgroundColor: colors.goldAction,
    marginTop: 8,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  submitText: { color: colors.actionInk, fontFamily: fontFamilies.sansBold, fontSize: 14 },
  infoBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.3)",
    backgroundColor: "rgba(224, 184, 74, 0.1)",
  },
  infoText: {
    color: colors.goldPale,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  error: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,.35)",
    backgroundColor: "rgba(239,68,68,.12)",
    color: "#FCA5A5",
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12,
    lineHeight: 18,
  },
  switchModeBtn: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  switchModeText: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 14,
  },
  switchModeHighlight: {
    color: colors.gold,
    fontFamily: fontFamilies.sansSemiBold,
  },
});

function Field(props: { label: string } & React.ComponentProps<typeof TextInput>) {
  const { label, editable = true, ...input } = props;
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...input}
        editable={editable}
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, !editable && styles.inputDisabled]}
      />
    </View>
  );
}
