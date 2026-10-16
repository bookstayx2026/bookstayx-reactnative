import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  CheckSquare,
  KeyRound,
  Lock,
  Mail,
  Phone,
  ShieldAlert,
  Square,
  Trash2,
  User,
} from "lucide-react-native";
import { router } from "expo-router";
import { AppScreen } from "@/components/foundation";
import { useCustomerChrome } from "@/components/customer";
import { useAuth } from "@/components/auth";
import { colors, fontFamilies as themeFontFamilies, radii as themeRadii } from "@/theme";
import { useIsDesktop } from "@/hooks/use-window-class";

const fontFamilies = {
  regular: themeFontFamilies.sans,
  medium: themeFontFamilies.sansMedium,
  bold: themeFontFamilies.sansBold,
  serif: themeFontFamilies.display,
};

const radii = {
  ...themeRadii,
  xl: themeRadii.sheet,
  full: themeRadii.pill,
};
import {
  deleteCustomerAccountInApp,
  deleteCustomerAccountPublic,
  sendCustomerDeletionOtp,
  verifyCustomerDeletionOtp,
} from "@/services/api/auth";

export default function DeleteAccountScreen() {
  const { onScroll } = useCustomerChrome();
  const isDesktop = useIsDesktop();
  const { session, signOut } = useAuth();
  const isCustomer = session?.role === "customer";
  const customerIdentity = isCustomer
    ? (session.identity as { id?: number; name?: string; email?: string | null; mobile?: string })
    : null;

  // Verification method: "password" | "otp"
  const [method, setMethod] = useState<"password" | "otp">("password");

  // Form inputs
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");

  // OTP flow states
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);

  // General states
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [isDeleted, setIsDeleted] = useState(false);

  // Pre-fill identity for logged-in customer
  useEffect(() => {
    if (customerIdentity) {
      if (customerIdentity.email) setEmail(customerIdentity.email);
      if (customerIdentity.mobile) setMobile(customerIdentity.mobile);
    }
  }, [customerIdentity]);

  const cleanPhone = (v: string) => v.replace(/\D/g, "");
  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  const isValidMobile = (v: string) => /^[6-9]\d{9}$/.test(cleanPhone(v));

  // Send OTP for phone verification
  const handleSendOtp = async () => {
    setError("");
    setInfoMessage("");
    const cleanedMobile = cleanPhone(mobile);

    if (!isValidMobile(cleanedMobile)) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    setOtpSending(true);
    try {
      const res = await sendCustomerDeletionOtp(cleanedMobile);
      setOtpSent(true);
      setInfoMessage(
        res.demoMode
          ? "Verification code sent! (Demo Mode: Enter fixed OTP 0000)"
          : "Verification code sent to your mobile number via SMS."
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to send verification code.");
    } finally {
      setOtpSending(false);
    }
  };

  // Verify entered OTP
  const handleVerifyOtp = async () => {
    setError("");
    setInfoMessage("");
    const cleanedMobile = cleanPhone(mobile);
    const trimmedOtp = otp.trim();

    if (!trimmedOtp) {
      setError("Please enter the verification code.");
      return;
    }

    setOtpVerifying(true);
    try {
      const res = await verifyCustomerDeletionOtp(cleanedMobile, trimmedOtp);
      setOtpVerified(true);
      setVerificationToken(res.verificationToken);
      setInfoMessage("Phone ownership verified successfully. You can now confirm account deletion.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Invalid verification code.");
    } finally {
      setOtpVerifying(false);
    }
  };

  // Submit permanent account deletion
  const handleDeleteSubmit = async () => {
    setError("");
    setInfoMessage("");

    if (!agreed) {
      setError("Please check the confirmation box to authorize permanent deletion.");
      return;
    }

    // 1. Signed-in customer deletion flow
    if (isCustomer && session?.tokens?.accessToken) {
      if (method === "password") {
        if (!password) {
          setError("Please enter your account password to confirm deletion.");
          return;
        }

        setLoading(true);
        try {
          await deleteCustomerAccountInApp(password, session.tokens.accessToken);
          setIsDeleted(true);
          await signOut();
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Failed to delete account. Please try again.");
        } finally {
          setLoading(false);
        }
        return;
      }
    }

    // 2. Public / OTP-based deletion flow
    const cleanedMobile = cleanPhone(mobile);
    if (!isValidMobile(cleanedMobile)) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (method === "password") {
      const trimmedEmail = email.trim().toLowerCase();
      if (!isValidEmail(trimmedEmail)) {
        setError("Please enter the valid email address associated with your account.");
        return;
      }
      if (!password) {
        setError("Please enter your account password.");
        return;
      }

      setLoading(true);
      try {
        await deleteCustomerAccountPublic({
          email: trimmedEmail,
          mobileNumber: cleanedMobile,
          password,
        });
        setIsDeleted(true);
        if (session) await signOut();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Account deletion failed. Please try again.");
      } finally {
        setLoading(false);
      }
    } else {
      if (!otpVerified || !verificationToken) {
        setError("Please verify phone ownership using the OTP verification code first.");
        return;
      }

      setLoading(true);
      try {
        await deleteCustomerAccountPublic({
          mobileNumber: cleanedMobile,
          verificationToken,
        });
        setIsDeleted(true);
        if (session) await signOut();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Account deletion failed. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <AppScreen
      contentContainerStyle={[styles.screen, isDesktop && styles.screenDesktop]}
      scrollProps={{ onScroll, scrollEventThrottle: 16 }}
    >
      <View style={[styles.container, isDesktop && styles.containerDesktop]}>
        {/* Navigation back */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isCustomer ? "Back to Profile" : "Return to BookStayX"}
          onPress={() => (isCustomer ? router.push("/profile") : router.replace("/"))}
          style={styles.backButton}
        >
          <ArrowLeft size={16} color={colors.gold} />
          <Text style={styles.backButtonText}>
            {isCustomer ? "Return to My Account" : "Return to BookStayX"}
          </Text>
        </Pressable>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <ShieldAlert size={12} color="#EF4444" />
              <Text style={styles.badgeText}>DATA & PRIVACY COMPLIANCE</Text>
            </View>
          </View>
          <Text style={[styles.title, isDesktop && styles.titleDesktop]}>
            Delete BookStayX <Text style={styles.goldText}>Account</Text>
          </Text>
          <Text style={styles.subtitle}>
            In compliance with Google Play Store policies and privacy regulations, you can permanently delete your customer account and associated personal data.
          </Text>
        </View>

        {isDeleted ? (
          /* Success Screen */
          <View style={styles.successCard}>
            <View style={styles.successIconWrap}>
              <CheckCircle2 size={44} color="#34D399" strokeWidth={2.2} />
            </View>
            <Text style={styles.successTitle}>Account Successfully Deleted</Text>
            <Text style={styles.successBody}>
              Your BookStayX account, personal profile, authentication credentials, and active sessions have been permanently erased from our databases.
            </Text>
            <View style={styles.retentionNotice}>
              <Text style={styles.retentionNoticeTitle}>Statutory Legal & Tax Notice</Text>
              <Text style={styles.retentionNoticeText}>
                In compliance with Indian financial, taxation, and consumer protection laws, records of completed booking invoices and financial transaction ledgers are retained for statutory legal audit compliance, with all personal account links removed.
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Return to home page"
              onPress={() => router.replace("/")}
              style={styles.homeBtn}
            >
              <Text style={styles.homeBtnText}>Return to Home Page</Text>
            </Pressable>
          </View>
        ) : (
          /* Main Deletion Card */
          <View style={styles.mainCard}>
            {/* Warning Banner */}
            <View style={styles.infoBanner}>
              <AlertTriangle size={22} color="#EF4444" style={styles.infoBannerIcon} />
              <View style={styles.infoBannerContent}>
                <Text style={styles.infoBannerTitle}>Permanent Deletion Warning</Text>
                <Text style={styles.infoBannerText}>
                  This action cannot be undone. Once deleted, your account credentials, saved villas, and personal details cannot be recovered.
                </Text>
              </View>
            </View>

            {/* Signed-in Identity Badge (if customer is logged in) */}
            {isCustomer && customerIdentity ? (
              <View style={styles.accountIdentityCard}>
                <View style={styles.accountIdentityHeader}>
                  <User size={16} color={colors.gold} />
                  <Text style={styles.accountIdentityTitle}>Currently Signed-in Account</Text>
                </View>
                <View style={styles.accountIdentityRow}>
                  <Text style={styles.accountIdentityLabel}>Name:</Text>
                  <Text style={styles.accountIdentityValue}>{customerIdentity.name || "Customer"}</Text>
                </View>
                {customerIdentity.mobile ? (
                  <View style={styles.accountIdentityRow}>
                    <Text style={styles.accountIdentityLabel}>Mobile:</Text>
                    <Text style={styles.accountIdentityValue}>+91 {customerIdentity.mobile}</Text>
                  </View>
                ) : null}
                {customerIdentity.email ? (
                  <View style={styles.accountIdentityRow}>
                    <Text style={styles.accountIdentityLabel}>Email:</Text>
                    <Text style={styles.accountIdentityValue}>{customerIdentity.email}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {/* Disclosures Section */}
            <View style={styles.disclosureSection}>
              <Text style={styles.disclosureHeading}>What happens when you delete your account:</Text>
              <View style={styles.bulletItem}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>
                  <Text style={styles.bulletBold}>Personal Information Erased:</Text> Your full name, email address, mobile number, saved wishlist properties, push notification tokens, and login credentials will be permanently erased.
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>
                  <Text style={styles.bulletBold}>Active Sessions Terminated:</Text> All active login sessions and refresh tokens on all devices will be immediately revoked.
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>
                  <Text style={styles.bulletBold}>Statutory Data Retention:</Text> In accordance with Indian tax, financial reporting, and consumer regulations, records of past completed stays, tax invoices, and payment audit logs are retained for statutory legal compliance, completely unlinked from your erased customer profile.
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Verification Method Switcher */}
            <Text style={styles.sectionLabel}>Verify Account Ownership</Text>
            <Text style={styles.sectionSublabel}>
              {isCustomer
                ? "Confirm your account password or verify via phone OTP to authorize deletion:"
                : "Choose how you wish to confirm ownership of the account to be deleted:"}
            </Text>

            <View style={styles.tabSwitcher}>
              <Pressable
                accessibilityRole="tab"
                accessibilityLabel="Verify using password"
                onPress={() => {
                  setMethod("password");
                  setError("");
                }}
                style={[styles.tabButton, method === "password" && styles.tabButtonActive]}
              >
                <Lock size={14} color={method === "password" ? "#120e06" : colors.textMuted} />
                <Text style={[styles.tabButtonText, method === "password" && styles.tabButtonTextActive]}>
                  Verify with Password
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="tab"
                accessibilityLabel="Verify using phone OTP"
                onPress={() => {
                  setMethod("otp");
                  setError("");
                }}
                style={[styles.tabButton, method === "otp" && styles.tabButtonActive]}
              >
                <Phone size={14} color={method === "otp" ? "#120e06" : colors.textMuted} />
                <Text style={[styles.tabButtonText, method === "otp" && styles.tabButtonTextActive]}>
                  Verify with Phone OTP
                </Text>
              </Pressable>
            </View>

            {/* Form Fields */}
            <View style={styles.formFields}>
              {/* If not logged in, ask for Mobile Number */}
              {!isCustomer || method === "otp" ? (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Registered 10-Digit Mobile Number *</Text>
                  <View style={styles.inputRow}>
                    <Phone size={16} color={colors.gold} style={styles.inputIcon} />
                    <TextInput
                      value={mobile}
                      onChangeText={(val) => {
                        setMobile(val);
                        setError("");
                      }}
                      placeholder="e.g. 9876543210"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="phone-pad"
                      maxLength={10}
                      style={styles.textInput}
                      editable={!loading && !otpVerified}
                    />
                  </View>
                </View>
              ) : null}

              {method === "password" ? (
                <>
                  {/* Email Address (for public non-logged in flow) */}
                  {!isCustomer ? (
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Registered Email Address *</Text>
                      <View style={styles.inputRow}>
                        <Mail size={16} color={colors.gold} style={styles.inputIcon} />
                        <TextInput
                          value={email}
                          onChangeText={(val) => {
                            setEmail(val);
                            setError("");
                          }}
                          placeholder="you@example.com"
                          placeholderTextColor={colors.textMuted}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          style={styles.textInput}
                          editable={!loading}
                        />
                      </View>
                    </View>
                  ) : null}

                  {/* Password Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>
                      {isCustomer ? "Confirm Your Account Password *" : "Account Password *"}
                    </Text>
                    <View style={styles.inputRow}>
                      <Lock size={16} color={colors.gold} style={styles.inputIcon} />
                      <TextInput
                        secureTextEntry
                        value={password}
                        onChangeText={(val) => {
                          setPassword(val);
                          setError("");
                        }}
                        placeholder="Enter your account password"
                        placeholderTextColor={colors.textMuted}
                        style={styles.textInput}
                        editable={!loading}
                      />
                    </View>
                  </View>
                </>
              ) : (
                /* Phone OTP Verification Fields */
                <View style={styles.otpBlock}>
                  {!otpVerified ? (
                    <>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Send verification code"
                        onPress={handleSendOtp}
                        disabled={otpSending || !isValidMobile(cleanPhone(mobile))}
                        style={[
                          styles.verifyPhoneBtn,
                          (!isValidMobile(cleanPhone(mobile)) || otpSending) && styles.btnDisabled,
                        ]}
                      >
                        {otpSending ? (
                          <ActivityIndicator size="small" color="#120e06" />
                        ) : (
                          <>
                            <KeyRound size={15} color="#120e06" />
                            <Text style={styles.verifyPhoneBtnText}>
                              {otpSent ? "Resend Verification Code" : "Send Verification Code"}
                            </Text>
                          </>
                        )}
                      </Pressable>

                      {otpSent ? (
                        <View style={styles.otpInputGroup}>
                          <Text style={styles.inputLabel}>Enter 4-Digit Verification Code *</Text>
                          <View style={styles.otpActionRow}>
                            <TextInput
                              value={otp}
                              onChangeText={(val) => {
                                setOtp(val);
                                setError("");
                              }}
                              placeholder="0000"
                              placeholderTextColor={colors.textMuted}
                              keyboardType="number-pad"
                              maxLength={6}
                              style={[styles.textInput, styles.otpInput]}
                            />
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel="Confirm verification code"
                              onPress={handleVerifyOtp}
                              disabled={otpVerifying || !otp.trim()}
                              style={[styles.confirmOtpBtn, (!otp.trim() || otpVerifying) && styles.btnDisabled]}
                            >
                              {otpVerifying ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                              ) : (
                                <Text style={styles.confirmOtpBtnText}>Confirm Code</Text>
                              )}
                            </Pressable>
                          </View>
                        </View>
                      ) : null}
                    </>
                  ) : (
                    <View style={styles.verifiedBadge}>
                      <CheckCircle2 size={16} color="#34D399" />
                      <Text style={styles.verifiedBadgeText}>Phone Ownership Verified</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Mandatory Confirmation Checkbox */}
              <Pressable
                accessibilityRole="checkbox"
                accessibilityLabel="Confirm permanent account deletion"
                style={styles.checkboxRow}
                onPress={() => setAgreed(!agreed)}
              >
                {agreed ? (
                  <CheckSquare size={18} color="#EF4444" />
                ) : (
                  <Square size={18} color={colors.textMuted} />
                )}
                <Text style={styles.checkboxLabel}>
                  I confirm that I want to permanently delete my BookStayX account and understand this action cannot be reversed.
                </Text>
              </Pressable>

              {/* Informational Message */}
              {infoMessage ? (
                <View style={styles.infoCallout}>
                  <Text style={styles.infoCalloutText}>{infoMessage}</Text>
                </View>
              ) : null}

              {/* Error Message */}
              {error ? (
                <View style={styles.errorCallout}>
                  <Text style={styles.errorCalloutText}>{error}</Text>
                </View>
              ) : null}

              {/* Action Buttons Row */}
              <View style={styles.actionRow}>
                {isCustomer ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Keep my account"
                    onPress={() => router.push("/profile")}
                    disabled={loading}
                    style={styles.keepBtn}
                  >
                    <Text style={styles.keepBtnText}>Keep My Account</Text>
                  </Pressable>
                ) : null}

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Permanently delete account"
                  onPress={handleDeleteSubmit}
                  disabled={loading || !agreed}
                  style={[
                    styles.deleteButton,
                    isCustomer && styles.deleteButtonFlex,
                    (!agreed || loading) && styles.btnDisabled,
                  ]}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Trash2 size={16} color="#FFFFFF" />
                      <Text style={styles.deleteButtonText}>Permanently Delete</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: 60,
  },
  screenDesktop: {
    paddingBottom: 80,
  },
  container: {
    maxWidth: 680,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  containerDesktop: {
    paddingTop: 24,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radii.sm,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  backButtonText: {
    color: colors.gold,
    fontSize: 13,
    fontFamily: fontFamilies.medium,
  },
  header: {
    marginBottom: 24,
  },
  badgeRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.25)",
  },
  badgeText: {
    color: "#EF4444",
    fontSize: 10,
    fontFamily: fontFamilies.bold,
    letterSpacing: 0.8,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontFamily: fontFamilies.serif,
    lineHeight: 34,
    marginBottom: 8,
  },
  titleDesktop: {
    fontSize: 32,
    lineHeight: 40,
  },
  goldText: {
    color: colors.gold,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fontFamilies.regular,
    lineHeight: 22,
  },
  mainCard: {
    backgroundColor: "#16130d",
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: "rgba(212, 168, 83, 0.2)",
    padding: 24,
    ...Platform.select({
      web: {
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
      },
      default: {},
    }),
  },
  infoBanner: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderRadius: radii.md,
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
    marginBottom: 20,
  },
  infoBannerIcon: {
    marginTop: 2,
  },
  infoBannerContent: {
    flex: 1,
  },
  infoBannerTitle: {
    color: "#EF4444",
    fontSize: 14,
    fontFamily: fontFamilies.bold,
    marginBottom: 4,
  },
  infoBannerText: {
    color: colors.textSecondary,
    fontSize: 12.5,
    fontFamily: fontFamilies.regular,
    lineHeight: 18,
  },
  accountIdentityCard: {
    padding: 14,
    borderRadius: radii.md,
    backgroundColor: "rgba(212, 168, 83, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(212, 168, 83, 0.18)",
    marginBottom: 20,
  },
  accountIdentityHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  accountIdentityTitle: {
    color: colors.gold,
    fontSize: 12,
    fontFamily: fontFamilies.bold,
    letterSpacing: 0.5,
  },
  accountIdentityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  accountIdentityLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fontFamilies.regular,
  },
  accountIdentityValue: {
    color: colors.text,
    fontSize: 12.5,
    fontFamily: fontFamilies.medium,
  },
  disclosureSection: {
    marginBottom: 20,
  },
  disclosureHeading: {
    color: colors.text,
    fontSize: 13,
    fontFamily: fontFamilies.bold,
    marginBottom: 12,
  },
  bulletItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.gold,
    marginTop: 8,
  },
  bulletText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 12.5,
    fontFamily: fontFamilies.regular,
    lineHeight: 19,
  },
  bulletBold: {
    color: colors.text,
    fontFamily: fontFamilies.medium,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    marginVertical: 18,
  },
  sectionLabel: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fontFamilies.bold,
    marginBottom: 4,
  },
  sectionSublabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fontFamilies.regular,
    lineHeight: 18,
    marginBottom: 16,
  },
  tabSwitcher: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: radii.md,
    padding: 3,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: radii.sm,
  },
  tabButtonActive: {
    backgroundColor: colors.gold,
  },
  tabButtonText: {
    color: colors.textMuted,
    fontSize: 12.5,
    fontFamily: fontFamilies.medium,
  },
  tabButtonTextActive: {
    color: "#120e06",
    fontFamily: fontFamilies.bold,
  },
  formFields: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fontFamilies.medium,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1f1b13",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "rgba(212, 168, 83, 0.2)",
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    height: 44,
    color: colors.text,
    fontSize: 13.5,
    fontFamily: fontFamilies.regular,
  },
  otpBlock: {
    gap: 12,
  },
  verifyPhoneBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.gold,
    borderRadius: radii.md,
    height: 44,
    paddingHorizontal: 16,
  },
  verifyPhoneBtnText: {
    color: "#120e06",
    fontSize: 13,
    fontFamily: fontFamilies.bold,
  },
  otpInputGroup: {
    gap: 6,
    marginTop: 6,
  },
  otpActionRow: {
    flexDirection: "row",
    gap: 10,
  },
  otpInput: {
    backgroundColor: "#1f1b13",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "rgba(212, 168, 83, 0.2)",
    paddingHorizontal: 14,
    textAlign: "center",
    letterSpacing: 4,
    fontSize: 16,
    fontFamily: fontFamilies.bold,
    maxWidth: 140,
  },
  confirmOtpBtn: {
    flex: 1,
    backgroundColor: "#34D399",
    borderRadius: radii.md,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmOtpBtnText: {
    color: "#120e06",
    fontSize: 13,
    fontFamily: fontFamilies.bold,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: radii.md,
    backgroundColor: "rgba(52, 211, 153, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.25)",
  },
  verifiedBadgeText: {
    color: "#34D399",
    fontSize: 12.5,
    fontFamily: fontFamilies.bold,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingTop: 4,
  },
  checkboxLabel: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fontFamilies.regular,
    lineHeight: 18,
  },
  infoCallout: {
    padding: 12,
    borderRadius: radii.sm,
    backgroundColor: "rgba(212, 168, 83, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(212, 168, 83, 0.2)",
  },
  infoCalloutText: {
    color: colors.gold,
    fontSize: 12,
    fontFamily: fontFamilies.regular,
    lineHeight: 17,
  },
  errorCallout: {
    padding: 12,
    borderRadius: radii.sm,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  errorCalloutText: {
    color: "#FCA5A5",
    fontSize: 12,
    fontFamily: fontFamilies.regular,
    lineHeight: 17,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  keepBtn: {
    flex: 1,
    height: 48,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  keepBtnText: {
    color: colors.text,
    fontSize: 13.5,
    fontFamily: fontFamilies.medium,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#EF4444",
    borderRadius: radii.md,
    height: 48,
    paddingHorizontal: 20,
    width: "100%",
  },
  deleteButtonFlex: {
    flex: 1,
    width: "auto",
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontFamily: fontFamilies.bold,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  successCard: {
    backgroundColor: "#16130d",
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.3)",
    padding: 32,
    alignItems: "center",
    textAlign: "center",
  },
  successIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(52, 211, 153, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  successTitle: {
    color: colors.text,
    fontSize: 22,
    fontFamily: fontFamilies.serif,
    marginBottom: 10,
    textAlign: "center",
  },
  successBody: {
    color: colors.textSecondary,
    fontSize: 13.5,
    fontFamily: fontFamilies.regular,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 20,
  },
  retentionNotice: {
    padding: 16,
    borderRadius: radii.md,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    marginBottom: 24,
    width: "100%",
  },
  retentionNoticeTitle: {
    color: colors.gold,
    fontSize: 12,
    fontFamily: fontFamilies.bold,
    marginBottom: 6,
  },
  retentionNoticeText: {
    color: colors.textMuted,
    fontSize: 11.5,
    fontFamily: fontFamilies.regular,
    lineHeight: 18,
  },
  homeBtn: {
    backgroundColor: colors.gold,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: radii.md,
  },
  homeBtnText: {
    color: "#120e06",
    fontSize: 13.5,
    fontFamily: fontFamilies.bold,
  },
});
