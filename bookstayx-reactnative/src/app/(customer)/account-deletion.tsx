import { useState } from "react";
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
  Sparkles,
  Square,
} from "lucide-react-native";
import { router } from "expo-router";
import { AppScreen } from "@/components/foundation";
import { useCustomerChrome } from "@/components/customer";
import { colors, fontFamilies } from "@/theme";
import { useIsDesktop } from "@/hooks/use-window-class";
import {
  deleteCustomerAccountPublic,
  sendCustomerDeletionOtp,
  verifyCustomerDeletionOtp,
} from "@/services/api/auth";

export default function AccountDeletionScreen() {
  const { onScroll } = useCustomerChrome();
  const isDesktop = useIsDesktop();

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

    const cleanedMobile = cleanPhone(mobile);
    if (!isValidMobile(cleanedMobile)) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (!agreed) {
      setError("Please check the confirmation box to authorize permanent deletion.");
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
    } else {
      if (!otpVerified || !verificationToken) {
        setError("Please verify phone ownership using the OTP verification code first.");
        return;
      }
    }

    setLoading(true);
    try {
      if (method === "password") {
        await deleteCustomerAccountPublic({
          email: email.trim().toLowerCase(),
          mobileNumber: cleanedMobile,
          password,
        });
      } else {
        await deleteCustomerAccountPublic({
          mobileNumber: cleanedMobile,
          verificationToken,
        });
      }
      setIsDeleted(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Account deletion failed. Please try again.");
    } finally {
      setLoading(false);
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
          accessibilityLabel="Back to Home"
          onPress={() => router.replace("/")}
          style={styles.backButton}
        >
          <ArrowLeft size={16} color={colors.gold} />
          <Text style={styles.backButtonText}>Return to BookStayX</Text>
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
            BookStayX <Text style={styles.goldText}>Account Deletion</Text>
          </Text>
          <Text style={styles.subtitle}>
            In compliance with Google Play Store policies and global privacy regulations, guests can permanently delete their BookStayX customer account and associated personal data.
          </Text>
        </View>

        {isDeleted ? (
          /* Success Screen */
          <View style={styles.successCard}>
            <View style={styles.successIconWrap}>
              <CheckCircle2 size={40} color="#34D399" strokeWidth={2} />
            </View>
            <Text style={styles.successTitle}>Account Successfully Deleted</Text>
            <Text style={styles.successBody}>
              Your BookStayX account, personal profile, authentication credentials, and active sessions have been permanently erased from our databases.
            </Text>
            <View style={styles.retentionNotice}>
              <Text style={styles.retentionNoticeTitle}>Legal & Accounting Notice</Text>
              <Text style={styles.retentionNoticeText}>
                As required under applicable Indian financial, taxation, and consumer protection laws, completed booking invoices and financial ledger records are retained for statutory accounting and audit purposes with all personal account links removed.
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
          /* Deletion Request Card */
          <View style={styles.mainCard}>
            {/* Policy & Data Disclosure */}
            <View style={styles.infoBanner}>
              <AlertTriangle size={20} color="#EF4444" style={styles.infoBannerIcon} />
              <View style={styles.infoBannerContent}>
                <Text style={styles.infoBannerTitle}>Permanent Deletion Policy</Text>
                <Text style={styles.infoBannerText}>
                  Account deletion is immediate and cannot be reversed. To safeguard your account, we require ownership verification before processing deletion requests.
                </Text>
              </View>
            </View>

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
                  <Text style={styles.bulletBold}>Active Sessions Terminated:</Text> All active JWT login sessions and refresh tokens on all devices will be immediately revoked.
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
              Choose how you wish to confirm ownership of the account to be deleted:
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
              {/* Mobile Number (both methods) */}
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

              {method === "password" ? (
                <>
                  {/* Email Address */}
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

                  {/* Password */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Account Password *</Text>
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

              {/* Explicit Confirmation Checkbox */}
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
                  I confirm that I am the owner of this BookStayX account and authorize permanent deletion of my personal information.
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

              {/* Permanently Delete Button */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Permanently delete account"
                onPress={handleDeleteSubmit}
                disabled={loading || !agreed}
                style={[styles.deleteButton, (!agreed || loading) && styles.btnDisabled]}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <ShieldAlert size={16} color="#FFFFFF" />
                    <Text style={styles.deleteButtonText}>Permanently Delete My Account</Text>
                  </>
                )}
              </Pressable>
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
    alignItems: "center",
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 24,
    maxWidth: 680,
    width: "100%",
  },
  containerDesktop: {
    paddingTop: 36,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
    alignSelf: "flex-start",
  },
  backButtonText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 13,
  },
  header: {
    marginBottom: 24,
  },
  badgeRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderColor: "rgba(239, 68, 68, 0.3)",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: "#F87171",
    fontFamily: fontFamilies.sansBold,
    fontSize: 10.5,
    letterSpacing: 0.8,
  },
  title: {
    color: colors.text,
    fontFamily: fontFamilies.displaySemiBold,
    fontSize: 26,
    lineHeight: 32,
    marginBottom: 8,
  },
  titleDesktop: {
    fontSize: 32,
    lineHeight: 38,
  },
  goldText: {
    color: colors.gold,
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 13.5,
    lineHeight: 20,
  },
  mainCard: {
    backgroundColor: "rgba(14, 18, 24, 0.95)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 24,
    gap: 20,
  },
  infoBanner: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.25)",
    borderRadius: 14,
    padding: 14,
  },
  infoBannerIcon: {
    marginTop: 2,
  },
  infoBannerContent: {
    flex: 1,
  },
  infoBannerTitle: {
    color: "#F87171",
    fontFamily: fontFamilies.sansBold,
    fontSize: 13.5,
    marginBottom: 4,
  },
  infoBannerText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    lineHeight: 17,
  },
  disclosureSection: {
    gap: 10,
  },
  disclosureHeading: {
    color: colors.text,
    fontFamily: fontFamilies.sansBold,
    fontSize: 13.5,
    marginBottom: 2,
  },
  bulletItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
    marginTop: 6,
  },
  bulletText: {
    flex: 1,
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    lineHeight: 17,
  },
  bulletBold: {
    color: colors.text,
    fontFamily: fontFamilies.sansSemiBold,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  sectionLabel: {
    color: colors.text,
    fontFamily: fontFamilies.sansBold,
    fontSize: 15,
  },
  sectionSublabel: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 12.5,
    marginTop: -14,
  },
  tabSwitcher: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 12,
    padding: 4,
    gap: 6,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: colors.gold,
  },
  tabButtonText: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 12.5,
  },
  tabButtonTextActive: {
    color: "#120e06",
  },
  formFields: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    height: 44,
    color: colors.text,
    fontFamily: fontFamilies.sans,
    fontSize: 13.5,
    outlineStyle: "none" as never,
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
    paddingVertical: 12,
    borderRadius: 12,
  },
  verifyPhoneBtnText: {
    color: "#120e06",
    fontFamily: fontFamilies.sansBold,
    fontSize: 13,
  },
  otpInputGroup: {
    gap: 6,
  },
  otpActionRow: {
    flexDirection: "row",
    gap: 10,
  },
  otpInput: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    letterSpacing: 4,
    fontSize: 16,
    textAlign: "center",
  },
  confirmOtpBtn: {
    paddingHorizontal: 18,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmOtpBtnText: {
    color: colors.text,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 13,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(52, 211, 153, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.25)",
  },
  verifiedBadgeText: {
    color: "#34D399",
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 13,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 4,
  },
  checkboxLabel: {
    flex: 1,
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    lineHeight: 17,
  },
  infoCallout: {
    backgroundColor: "rgba(212, 175, 55, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.25)",
    borderRadius: 10,
    padding: 12,
  },
  infoCalloutText: {
    color: colors.gold,
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    lineHeight: 16,
  },
  errorCallout: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    borderRadius: 10,
    padding: 12,
  },
  errorCalloutText: {
    color: "#F87171",
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    lineHeight: 16,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#DC2626",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 6,
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.sansBold,
    fontSize: 14,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  successCard: {
    backgroundColor: "rgba(14, 18, 24, 0.95)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.3)",
    padding: 28,
    alignItems: "center",
    gap: 16,
  },
  successIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(52, 211, 153, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: {
    color: colors.text,
    fontFamily: fontFamilies.displaySemiBold,
    fontSize: 22,
    textAlign: "center",
  },
  successBody: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: "center",
  },
  retentionNotice: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 14,
    width: "100%",
    gap: 6,
  },
  retentionNoticeTitle: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 12,
  },
  retentionNoticeText: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 11.5,
    lineHeight: 16,
  },
  homeBtn: {
    backgroundColor: colors.gold,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 8,
  },
  homeBtnText: {
    color: "#120e06",
    fontFamily: fontFamilies.sansBold,
    fontSize: 13,
  },
});
