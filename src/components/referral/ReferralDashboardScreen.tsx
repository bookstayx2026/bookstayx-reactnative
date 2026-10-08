import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import * as Clipboard from "expo-clipboard";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CircleAlert,
  Copy,
  Download,
  History,
  Info,
  LogOut,
  Phone,
  QrCode,
  Share2,
  Trash2,
  UserRound,
  Wallet,
  WalletCards,
} from "lucide-react-native";
import { useAuth } from "@/components/auth";
import { images } from "@/data/discovery";
import {
  addReferralUpi,
  deleteReferralUpi,
  developmentLogin,
  getPendingReferralWithdrawals,
  getReferralDashboard,
  getReferralHistory,
  getReferralShare,
  getReferralUpis,
  loginReferral,
  requestReferralOtp,
  setDefaultReferralUpi,
  verifyReferralOtp,
  withdrawReferral,
  type ReferralDashboard,
  type ReferralUpi,
  type ShareInfo,
} from "@/services/api";
import { colors, fontFamilies, layout, radii } from "@/theme";
import { useIsDesktop } from "@/hooks/use-window-class";

type DashTab = "payouts" | "history" | "stats" | "share";

type HistoryItem = {
  type: string;
  message: string;
  amount: number;
  date: string;
  property_name?: string;
};

const TABS: Array<{ id: DashTab; label: string; Icon: typeof Wallet }> = [
  { id: "payouts", label: "Payouts", Icon: Wallet },
  { id: "history", label: "History", Icon: History },
  { id: "stats", label: "Stats", Icon: CircleAlert },
  { id: "share", label: "Share", Icon: Share2 },
];

function WalletArt() {
  return (
    <View style={styles.walletArt}>
      <View style={styles.walletGlow} />
      {/* Coin 1 */}
      <View style={styles.coin1}>
        <Text style={styles.coinText}>₹</Text>
      </View>
      {/* Coin 2 */}
      <View style={styles.coin2}>
        <Text style={styles.coinText}>₹</Text>
      </View>
      {/* Wallet Card Base */}
      <View style={styles.walletCard}>
        <View style={styles.walletCardTopShine} />
        <View style={styles.walletCardEmboss} />
        <View style={styles.walletCardStripe} />
      </View>
    </View>
  );
}

export function ReferralDashboardScreen() {
  const { session, signIn, signOut } = useAuth();
  const token = session?.role === "referral" ? session.tokens.accessToken : "";
  const isDesktop = useIsDesktop();

  const [tab, setTab] = useState<DashTab>("payouts");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [dashboard, setDashboard] = useState<ReferralDashboard | null>(null);
  const [share, setShare] = useState<ShareInfo | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [upis, setUpis] = useState<ReferralUpi[]>([]);
  const [pending, setPending] = useState<
    { id: number; amount: number; upi_id: string; status: string; created_at: string }[]
  >([]);

  // Payout Form States
  const [payoutMobile, setPayoutMobile] = useState("");
  const [payoutMobile2, setPayoutMobile2] = useState("");
  const [beneficiary, setBeneficiary] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [amount, setAmount] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setError("");
    try {
      const [d, s, h, u, p] = await Promise.all([
        getReferralDashboard(token),
        getReferralShare(token),
        getReferralHistory(token),
        getReferralUpis(token),
        getPendingReferralWithdrawals(token),
      ]);
      setDashboard(d);
      setShare(s);
      setHistory(h.history || []);
      setUpis(u.upi_ids || []);
      setPending(p.pending_withdrawals || []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load referral dashboard.");
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const login = async () => {
    setBusy(true);
    setError("");
    try {
      const clean = mobile.replace(/\D/g, "");
      if (!otpSent) {
        await requestReferralOtp(clean, "referral_login");
        setOtpSent(true);
      } else {
        const verified = await verifyReferralOtp(clean, otp, "referral_login");
        const result = await loginReferral(verified.token);
        await signIn({
          role: "referral",
          tokens: { accessToken: result.token, refreshToken: result.refreshToken },
          identity: { id: result.user.id, email: result.user.username },
        });
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Referral login failed.");
    } finally {
      setBusy(false);
    }
  };

  const devLogin = async () => {
    setBusy(true);
    setError("");
    try {
      await signIn(await developmentLogin("referral"));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Development login failed.");
    } finally {
      setBusy(false);
    }
  };

  const addUpi = async () => {
    if (payoutMobile !== payoutMobile2) {
      setError("Mobile numbers do not match.");
      return;
    }
    if (!confirmed) {
      setError("Please confirm that the beneficiary name is correct.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await addReferralUpi(token, payoutMobile.trim(), beneficiary.trim());
      setPayoutMobile("");
      setPayoutMobile2("");
      setBeneficiary("");
      setConfirmed(false);
      setNotice("Payout destination saved successfully.");
      setTimeout(() => setNotice(""), 3000);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save payout destination.");
    } finally {
      setBusy(false);
    }
  };

  const withdraw = async () => {
    const selected = upis.find((item) => item.is_default) || upis[0];
    setBusy(true);
    setError("");
    try {
      if (!selected) throw new Error("Save a payout mobile number first.");
      await withdrawReferral(token, Number(amount), selected.upi_id);
      setAmount("");
      setNotice("Withdrawal request submitted successfully.");
      setTimeout(() => setNotice(""), 3000);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to request withdrawal.");
    } finally {
      setBusy(false);
    }
  };

  const copyText = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    setNotice(`${label} copied!`);
    setTimeout(() => setNotice(""), 2000);
  };

  const shareWhatsApp = () => {
    const code = share?.referralCode || "AISH777";
    const link = share?.referralLink || "https://bookstayx.com";
    const msg = `Join BookStayX with my referral code ${code}: ${link}`;
    void Linking.openURL(`https://wa.me/?text=${encodeURIComponent(msg)}`);
  };

  // Auth Screen
  if (!token) {
    return (
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scroll, isDesktop && styles.scrollDesktop]}
      >
        <View style={[styles.loginContainer, isDesktop && styles.loginContainerDesktop]}>
          <View style={styles.loginIconCircle}>
            <WalletCards size={34} color={colors.gold} />
          </View>
          <Text style={styles.loginTitle}>Referral Login</Text>
          <Text style={styles.loginSubtitle}>
            Use the mobile number linked with your referral account.
          </Text>

          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>Mobile number</Text>
            <TextInput
              value={mobile}
              onChangeText={setMobile}
              placeholder="e.g. 9876543210"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              style={styles.fieldInput}
            />
          </View>

          {otpSent ? (
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Enter OTP</Text>
              <TextInput
                value={otp}
                onChangeText={setOtp}
                placeholder="6-digit OTP"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                style={styles.fieldInput}
              />
            </View>
          ) : null}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            disabled={busy}
            onPress={() => void login()}
            style={({ pressed }) => [styles.submitBtn, pressed && styles.pressed]}
          >
            {busy ? (
              <ActivityIndicator color="#120e06" />
            ) : (
              <Text style={styles.submitBtnText}>{otpSent ? "Verify & Login" : "Send OTP"}</Text>
            )}
          </Pressable>

          {__DEV__ && process.env.EXPO_PUBLIC_ENABLE_DEV_LOGIN === "true" ? (
            <Pressable onPress={() => void devLogin()} style={styles.devBtn}>
              <Text style={styles.devBtnText}>One-click development login</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    );
  }

  const referralCode = share?.referralCode || dashboard?.username || "AISH777";
  const referralLink = share?.referralLink || `https://bookstayx.com/r/${referralCode}`;
  const qrUri =
    share?.referralQrCode ||
    `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=12&data=${encodeURIComponent(referralLink)}`;

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.scroll, isDesktop && styles.scrollDesktop]}
    >
      {/* Background Hero Accent */}
      <View style={styles.topBackdrop}>
        <Image source={images.villa2} contentFit="cover" style={styles.backdropImg} />
        <View style={styles.backdropOverlay} />
      </View>

      <View style={[styles.mainWrapper, isDesktop && styles.mainWrapperDesktop]}>
        
        {/* Header Title */}
        <View style={styles.headerBar}>
          <View>
            <Text style={styles.pageTitle}>
              Check <Text style={styles.goldText}>Earning</Text>
            </Text>
            <Text style={styles.pageSubtitle}>
              Track your referral earnings and manage payouts.
            </Text>
          </View>
          <Pressable
            accessibilityLabel="Sign out"
            onPress={() => void signOut()}
            style={({ pressed }) => [styles.logoutBtn, pressed && styles.pressed]}
          >
            <LogOut size={16} color={colors.danger} />
          </Pressable>
        </View>

        {/* Welcome & Earnings Gold Highlight Card */}
        <View style={styles.earningsHeroCard}>
          <View style={styles.heroShineLine} />
          <View style={styles.earningsCardContent}>
            
            {/* Left Side: Avatar & Earnings */}
            <View style={styles.earningsLeft}>
              <View style={styles.userRow}>
                <View style={styles.userAvatar}>
                  <UserRound size={22} color={colors.gold} />
                </View>
                <View style={styles.userCopy}>
                  <Text style={styles.welcomeText}>Welcome back</Text>
                  <Text numberOfLines={1} style={styles.userName}>
                    {dashboard?.username || "Partner"}{" "}
                    <Text style={styles.userCodeText}>({referralCode})</Text>
                  </Text>
                </View>
              </View>

              <View style={styles.tagBadgeRow}>
                <View style={styles.ownerBadge}>
                  <Text style={styles.ownerBadgeIcon}>♛</Text>
                  <Text style={styles.ownerBadgeText}>OWNER REFERRAL</Text>
                </View>
                <View style={styles.badgeDivider} />
                <Text style={styles.commissionText}>25% of advance</Text>
              </View>

              <View style={styles.earningsAmountBlock}>
                <Text style={styles.earningsLabel}>Referral Earnings</Text>
                <Text style={styles.earningsValue}>
                  ₹ {Number(dashboard?.total_earnings || 0).toLocaleString("en-IN")}
                </Text>
              </View>
            </View>

            {/* Right Side: 3D Wallet Art */}
            <WalletArt />

          </View>
        </View>

        {/* 4 Segmented Tabs */}
        <View style={styles.tabsCard}>
          <View style={styles.tabsGrid}>
            {TABS.map(({ id, label, Icon }, i) => {
              const active = tab === id;
              return (
                <Pressable
                  key={id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  onPress={() => setTab(id)}
                  style={[
                    styles.tabItem,
                    active && styles.tabItemActive,
                    !active && i > 0 && styles.tabItemBorder,
                  ]}
                >
                  <Icon
                    size={16}
                    color={active ? "#141007" : colors.textMuted}
                    strokeWidth={1.8}
                  />
                  <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {notice ? <Text style={styles.noticeText}>{notice}</Text> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* TAB 1: PAYOUTS */}
        {tab === "payouts" ? (
          <View style={styles.tabContent}>
            
            {/* Section 1: Saved Mobile Numbers */}
            <View style={styles.cardSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconCircle}>
                  <Phone size={17} color={colors.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>Saved Mobile Numbers</Text>
                  <Text style={styles.sectionSubtitle}>
                    Add a mobile number to start receiving payouts.
                  </Text>
                </View>
              </View>

              {/* Saved UPI List */}
              {upis.map((item) => (
                <View key={item.id} style={styles.savedUpiItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.savedUpiName}>{item.beneficiary_name}</Text>
                    <Text style={styles.savedUpiMeta}>
                      {item.upi_id}
                      {item.is_default ? " • Default" : ""}
                    </Text>
                  </View>
                  {!item.is_default ? (
                    <Pressable
                      accessibilityLabel="Set as default"
                      onPress={() => void setDefaultReferralUpi(token, item.id).then(load)}
                      style={styles.actionIconBtn}
                    >
                      <Check size={14} color={colors.gold} />
                    </Pressable>
                  ) : null}
                  {upis.length > 1 ? (
                    <Pressable
                      accessibilityLabel="Delete UPI"
                      onPress={() => void deleteReferralUpi(token, item.id).then(load)}
                      style={styles.actionIconBtn}
                    >
                      <Trash2 size={14} color={colors.danger} />
                    </Pressable>
                  ) : null}
                </View>
              ))}

              {/* Form & Important Note Side-by-Side on Desktop */}
              <View style={[styles.formRow, isDesktop && styles.formRowDesktop]}>
                <View style={styles.formFieldsCol}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Enter Mobile Number</Text>
                    <TextInput
                      value={payoutMobile}
                      onChangeText={setPayoutMobile}
                      placeholder="e.g. 9876543210"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="phone-pad"
                      style={styles.textInput}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Re-Enter Mobile Number</Text>
                    <TextInput
                      value={payoutMobile2}
                      onChangeText={setPayoutMobile2}
                      placeholder="e.g. 9876543210"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="phone-pad"
                      style={styles.textInput}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Beneficiary Name</Text>
                    <TextInput
                      value={beneficiary}
                      onChangeText={setBeneficiary}
                      placeholder="e.g. Aish More"
                      placeholderTextColor={colors.textMuted}
                      style={styles.textInput}
                    />
                  </View>
                </View>

                {/* Important Side Card */}
                <View style={[styles.importantCard, isDesktop && styles.importantCardDesktop]}>
                  <Text style={styles.importantTitle}>Important</Text>
                  <Text style={styles.importantDesc}>
                    Ensure this mobile number is linked to your bank account / UPI. You are
                    responsible for incorrect details.
                  </Text>
                </View>
              </View>

              {/* Alert Warning */}
              <View style={styles.warningBox}>
                <AlertTriangle size={16} color={colors.gold} style={{ marginTop: 2 }} />
                <Text style={styles.warningText}>
                  Double-check the Beneficiary Name matches your bank / UPI profile before
                  confirming.
                </Text>
              </View>

              {/* Confirmation Checkbox */}
              <Pressable
                onPress={() => setConfirmed(!confirmed)}
                style={styles.checkboxRow}
              >
                <View style={[styles.checkbox, confirmed && styles.checkboxActive]}>
                  {confirmed ? <Check size={12} color="#141007" strokeWidth={3} /> : null}
                </View>
                <Text style={styles.checkboxText}>
                  I confirm the beneficiary name is correct
                </Text>
              </Pressable>

              <Pressable
                disabled={busy}
                onPress={() => void addUpi()}
                style={({ pressed }) => [styles.saveUpiBtn, pressed && styles.pressed]}
              >
                {busy ? (
                  <ActivityIndicator color="#120e06" />
                ) : (
                  <Text style={styles.saveUpiBtnText}>Save Destination</Text>
                )}
              </Pressable>
            </View>

            {/* Section 2: Payout Amount */}
            <View style={styles.cardSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconCircle}>
                  <Wallet size={17} color={colors.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>
                    Payout Amount <Text style={styles.minAmountText}>(Min ₹500)</Text>
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    Add a mobile number above to request a payout.
                  </Text>
                </View>
              </View>

              <View style={styles.payoutInputRow}>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="e.g. 500"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  style={styles.payoutAmountInput}
                />
                <Pressable
                  disabled={busy}
                  onPress={() => void withdraw()}
                  style={({ pressed }) => [
                    styles.payoutActionBtn,
                    pressed && styles.pressed,
                    Platform.select({
                      web: { cursor: "pointer", outlineStyle: "none" } as any,
                      default: {},
                    }),
                  ]}
                >
                  <Text style={styles.payoutActionBtnText}>Payout Amount</Text>
                  <ArrowRight size={15} color="#141007" strokeWidth={2.4} />
                </Pressable>
              </View>

              <View style={styles.infoRow}>
                <Info size={14} color="#60A5FA" />
                <Text style={styles.infoText}>Minimum ₹500 balance required for Payout!</Text>
              </View>

              {pending.map((item) => (
                <View key={item.id} style={styles.pendingItem}>
                  <Text style={styles.pendingText}>
                    ₹{Number(item.amount).toLocaleString("en-IN")} to {item.upi_id} • {item.status}
                  </Text>
                </View>
              ))}
            </View>

          </View>
        ) : null}

        {/* TAB 2: HISTORY */}
        {tab === "history" ? (
          <View style={styles.cardSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconCircle}>
                <History size={17} color={colors.gold} />
              </View>
              <Text style={styles.sectionTitle}>Referral & Payout History</Text>
            </View>

            {history.length ? (
              history.map((item, index) => (
                <View key={`${item.date}-${index}`} style={styles.historyRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyMessage}>{item.message}</Text>
                    <Text style={styles.historyDate}>
                      {item.property_name || new Date(item.date).toLocaleDateString("en-IN")}
                    </Text>
                  </View>
                  <Text style={styles.historyAmount}>
                    ₹{Number(item.amount).toLocaleString("en-IN")}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>Completed referrals and payouts will appear here.</Text>
            )}
          </View>
        ) : null}

        {/* TAB 3: STATS */}
        {tab === "stats" ? (
          <View style={[styles.statsGrid, isDesktop && styles.statsGridDesktop]}>
            <View style={styles.statBox}>
              <Text style={styles.statBoxLabel}>TOTAL EARNED</Text>
              <Text style={[styles.statBoxValue, { color: colors.gold }]}>
                ₹ {Number(dashboard?.total_earnings || 0).toLocaleString("en-IN")}
              </Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statBoxLabel}>TOTAL REFERRALS</Text>
              <Text style={[styles.statBoxValue, { color: colors.gold }]}>
                {dashboard?.total_referrals || 0}
              </Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statBoxLabel}>TOTAL PAYOUT</Text>
              <Text style={[styles.statBoxValue, { color: "#E56B5F" }]}>
                ₹ {Number(dashboard?.pending_withdrawal_amount || 0).toLocaleString("en-IN")}
              </Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statBoxLabel}>IN-PROCESS</Text>
              <Text style={[styles.statBoxValue, { color: colors.gold }]}>
                ₹ {Number(dashboard?.available_balance || 0).toLocaleString("en-IN")}
              </Text>
              <Text style={styles.statBoxSub}>Available to withdraw</Text>
            </View>
          </View>
        ) : null}

        {/* TAB 4: SHARE */}
        {tab === "share" ? (
          <View style={styles.tabContent}>
            
            {/* QR Card */}
            <View style={styles.cardSection}>
              <Text style={styles.qrTitle}>Your QR Code</Text>
              <View style={styles.qrContainer}>
                <Image source={{ uri: qrUri }} contentFit="contain" style={styles.qrImage} />
              </View>
              <Pressable
                onPress={() => void copyText(referralLink, "QR link")}
                style={styles.downloadQrBtn}
              >
                <Download size={15} color={colors.text} />
                <Text style={styles.downloadQrBtnText}>Download QR</Text>
              </Pressable>
            </View>

            {/* Referral Link */}
            <View style={styles.cardSection}>
              <Text style={styles.linkHeader}>Referral Link</Text>
              <View style={styles.copyBox}>
                <Text numberOfLines={1} style={styles.linkText}>
                  {referralLink}
                </Text>
                <Pressable
                  accessibilityLabel="Copy referral link"
                  onPress={() => void copyText(referralLink, "Referral link")}
                  style={styles.copyIconBtn}
                >
                  <Copy size={15} color={colors.gold} />
                </Pressable>
              </View>
            </View>

            {/* Referral Code */}
            <View style={styles.cardSection}>
              <Text style={styles.linkHeader}>Referral Code</Text>
              <View style={styles.copyBox}>
                <Text style={styles.codeLargeText}>{referralCode}</Text>
                <Pressable
                  accessibilityLabel="Copy referral code"
                  onPress={() => void copyText(referralCode, "Referral code")}
                  style={styles.copyIconBtn}
                >
                  <Copy size={15} color={colors.gold} />
                </Pressable>
              </View>
            </View>

            {/* WhatsApp Share Button */}
            <Pressable
              onPress={shareWhatsApp}
              style={({ pressed }) => [styles.whatsAppBtn, pressed && styles.pressed]}
            >
              <Share2 size={17} color="#fff" />
              <Text style={styles.whatsAppBtnText}>Share on WhatsApp</Text>
            </Pressable>

          </View>
        ) : null}

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  scroll: {
    flexGrow: 1,
    alignItems: "center",
    backgroundColor: "#050709",
    paddingTop: 72,
    paddingBottom: layout.bottomChromeReserve + 30,
  },
  scrollDesktop: {
    paddingTop: 88,
    paddingBottom: layout.desktopBottomReserve + 32,
  },
  topBackdrop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 220,
    overflow: "hidden",
  },
  backdropImg: {
    ...StyleSheet.absoluteFill,
    opacity: 0.35,
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(5, 7, 9, 0.85)",
  },
  mainWrapper: {
    width: "100%",
    paddingHorizontal: 16,
    gap: 16,
  },
  mainWrapperDesktop: {
    maxWidth: 720,
    paddingHorizontal: 0,
  },

  // Header Bar
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
  },
  pageTitle: {
    color: colors.text,
    fontFamily: fontFamilies.displayMedium,
    fontSize: 30,
    lineHeight: 34,
  },
  goldText: {
    color: colors.gold,
  },
  pageSubtitle: {
    marginTop: 4,
    color: "#9AA1AB",
    fontFamily: fontFamilies.sans,
    fontSize: 13,
  },
  logoutBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Earnings Hero Card
  earningsHeroCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.35)",
    backgroundColor: "rgba(12, 16, 22, 0.96)",
    position: "relative",
    overflow: "hidden",
    ...Platform.select({
      web: {
        boxShadow: "0 0 28px rgba(224, 184, 74, 0.08)",
      } as any,
      default: {},
    }),
  },
  heroShineLine: {
    position: "absolute",
    left: 24,
    right: 24,
    top: 0,
    height: 1,
    backgroundColor: "rgba(224, 184, 74, 0.8)",
  },
  earningsCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    gap: 12,
  },
  earningsLeft: {
    flex: 1,
    minWidth: 0,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.gold,
    backgroundColor: "#141007",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      web: { boxShadow: "0 0 16px rgba(224, 184, 74, 0.35)" } as any,
      default: {},
    }),
  },
  userCopy: {
    flex: 1,
  },
  welcomeText: {
    color: "#C9CDD4",
    fontFamily: fontFamilies.sans,
    fontSize: 12,
  },
  userName: {
    marginTop: 2,
    color: colors.text,
    fontFamily: fontFamilies.sansBold,
    fontSize: 16,
  },
  userCodeText: {
    color: "#E8ECF2",
    fontFamily: fontFamilies.sansSemiBold,
  },
  tagBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  ownerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.55)",
  },
  ownerBadgeIcon: {
    color: colors.gold,
    fontSize: 11,
  },
  ownerBadgeText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 10,
    letterSpacing: 0.6,
  },
  badgeDivider: {
    width: 1,
    height: 12,
    backgroundColor: "rgba(224, 184, 74, 0.35)",
  },
  commissionText: {
    color: "#C9A24A",
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
  },
  earningsAmountBlock: {
    marginTop: 14,
  },
  earningsLabel: {
    color: colors.text,
    fontFamily: fontFamilies.sans,
    fontSize: 12.5,
  },
  earningsValue: {
    marginTop: 2,
    color: colors.gold,
    fontFamily: fontFamilies.displayMedium,
    fontSize: 32,
    lineHeight: 36,
  },

  // Wallet Art
  walletArt: {
    position: "relative",
    width: 110,
    height: 115,
    alignItems: "center",
    justifyContent: "center",
  },
  walletGlow: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(224, 184, 74, 0.18)",
  },
  coin1: {
    position: "absolute",
    left: 8,
    top: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "rgba(224, 184, 74, 0.8)",
    backgroundColor: "#F0D078",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
    ...Platform.select({
      web: { boxShadow: "0 0 14px rgba(224, 184, 74, 0.55)" } as any,
      default: {},
    }),
  },
  coin2: {
    position: "absolute",
    right: 12,
    top: 18,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(224, 184, 74, 0.7)",
    backgroundColor: "#E8C45C",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    ...Platform.select({
      web: { boxShadow: "0 0 12px rgba(224, 184, 74, 0.45)" } as any,
      default: {},
    }),
  },
  coinText: {
    color: "#3A2A08",
    fontFamily: fontFamilies.sansBold,
    fontSize: 13,
  },
  walletCard: {
    position: "absolute",
    bottom: 6,
    left: 4,
    right: 4,
    height: 60,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.4)",
    backgroundColor: "#20180D",
    overflow: "hidden",
  },
  walletCardTopShine: {
    height: 14,
    backgroundColor: "rgba(224, 184, 74, 0.2)",
  },
  walletCardEmboss: {
    position: "absolute",
    right: 8,
    top: 18,
    width: 32,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.35)",
    backgroundColor: "rgba(224, 184, 74, 0.15)",
  },
  walletCardStripe: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 8,
    height: 1,
    backgroundColor: "rgba(224, 184, 74, 0.25)",
  },

  // 4 Tabs Card
  tabsCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "#0B0E12",
    overflow: "hidden",
  },
  tabsGrid: {
    flexDirection: "row",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 4,
  },
  tabItemActive: {
    backgroundColor: colors.gold,
  },
  tabItemBorder: {
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255, 255, 255, 0.1)",
  },
  tabLabel: {
    color: "#9AA1AB",
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 10.5,
  },
  tabLabelActive: {
    color: "#141007",
    fontFamily: fontFamilies.sansBold,
  },

  // Sections
  tabContent: {
    gap: 16,
  },
  cardSection: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "#0C1016",
    padding: 16,
    gap: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  sectionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(224, 184, 74, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      web: { boxShadow: "0 0 12px rgba(224, 184, 74, 0.25)" } as any,
      default: {},
    }),
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: fontFamilies.sansBold,
    fontSize: 15,
  },
  minAmountText: {
    color: "#C9CDD4",
    fontFamily: fontFamilies.sansMedium,
  },
  sectionSubtitle: {
    marginTop: 2,
    color: "#8B93A0",
    fontFamily: fontFamilies.sans,
    fontSize: 11.5,
  },

  // Form Fields & Important Card
  formRow: {
    gap: 12,
  },
  formRowDesktop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  formFieldsCol: {
    flex: 1,
    gap: 12,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    color: "#C9CDD4",
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
  },
  textInput: {
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    backgroundColor: "#0A0D12",
    paddingHorizontal: 12,
    color: colors.text,
    fontFamily: fontFamilies.sans,
    fontSize: 13,
    outlineStyle: "none" as never,
  },
  importantCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.45)",
    backgroundColor: "rgba(20, 16, 7, 0.6)",
    padding: 12,
    gap: 6,
  },
  importantCardDesktop: {
    width: 140,
  },
  importantTitle: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 11,
  },
  importantDesc: {
    color: "#C9A24A",
    fontFamily: fontFamilies.sans,
    fontSize: 9.5,
    lineHeight: 14,
  },

  // Warning & Checkbox
  warningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.35)",
    backgroundColor: "rgba(224, 184, 74, 0.08)",
    padding: 10,
  },
  warningText: {
    flex: 1,
    color: colors.gold,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
    lineHeight: 15,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "rgba(224, 184, 74, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  checkboxText: {
    color: "#C9CDD4",
    fontFamily: fontFamilies.sans,
    fontSize: 12,
  },
  saveUpiBtn: {
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  saveUpiBtnText: {
    color: "#141007",
    fontFamily: fontFamilies.sansBold,
    fontSize: 13,
  },

  // Saved UPI List Item
  savedUpiItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    gap: 8,
  },
  savedUpiName: {
    color: colors.text,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 12.5,
  },
  savedUpiMeta: {
    marginTop: 2,
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 10.5,
  },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Payout Amount Row
  payoutInputRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  payoutAmountInput: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    backgroundColor: "#0A0D12",
    paddingHorizontal: 14,
    color: colors.text,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 14,
    outlineStyle: "none" as never,
  },
  payoutActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.gold,
    ...Platform.select({
      web: { boxShadow: "0 10px 24px -10px rgba(217, 165, 42, 0.75)" } as any,
      default: {},
    }),
  },
  payoutActionBtnText: {
    color: "#141007",
    fontFamily: fontFamilies.sansBold,
    fontSize: 13,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoText: {
    color: "#60A5FA",
    fontFamily: fontFamilies.sans,
    fontSize: 11.5,
  },
  pendingItem: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#0A0D12",
  },
  pendingText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
  },

  // Stats Tab
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statsGridDesktop: {
    gap: 14,
  },
  statBox: {
    width: "48.5%",
    minHeight: 108,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    backgroundColor: "#12100C",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    textAlign: "center",
  },
  statBoxLabel: {
    color: "#A89E94",
    fontFamily: fontFamilies.sansBold,
    fontSize: 10.5,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  statBoxValue: {
    marginTop: 8,
    fontFamily: fontFamilies.sansBold,
    fontSize: 26,
  },
  statBoxSub: {
    marginTop: 4,
    color: "#8B93A0",
    fontFamily: fontFamilies.sans,
    fontSize: 11,
  },

  // Share Tab
  qrTitle: {
    textAlign: "center",
    color: "#C9A24A",
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12,
  },
  qrContainer: {
    alignSelf: "center",
    width: 200,
    height: 200,
    borderRadius: 16,
    backgroundColor: "#fff",
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  qrImage: {
    width: 176,
    height: 176,
  },
  downloadQrBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "#0A0D12",
    marginTop: 6,
  },
  downloadQrBtnText: {
    color: colors.text,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 13,
  },
  linkHeader: {
    color: "#C9A24A",
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12,
  },
  copyBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "#0A0D12",
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
    marginTop: 8,
  },
  linkText: {
    flex: 1,
    color: "#C9CDD4",
    fontFamily: fontFamilies.sans,
    fontSize: 12,
  },
  codeLargeText: {
    flex: 1,
    color: colors.gold,
    fontFamily: fontFamilies.displayMedium,
    fontSize: 24,
    letterSpacing: 1,
  },
  copyIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  whatsAppBtn: {
    height: 50,
    borderRadius: 16,
    backgroundColor: "#00D95A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    ...Platform.select({
      web: { boxShadow: "0 10px 28px -10px rgba(0, 217, 90, 0.55)" } as any,
      default: {},
    }),
  },
  whatsAppBtnText: {
    color: "#fff",
    fontFamily: fontFamilies.sansBold,
    fontSize: 14,
  },

  // History Tab
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  historyMessage: {
    color: colors.text,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 13,
  },
  historyDate: {
    marginTop: 2,
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 11,
  },
  historyAmount: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 14,
  },
  emptyText: {
    textAlign: "center",
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    paddingVertical: 24,
  },

  // Notice & Error
  noticeText: {
    color: "#86EFAC",
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    padding: 10,
    borderRadius: 10,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12,
    textAlign: "center",
  },
  errorText: {
    color: "#FCA5A5",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    padding: 10,
    borderRadius: 10,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12,
    textAlign: "center",
  },

  // Login Form
  loginContainer: {
    marginTop: 60,
    padding: 24,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.surfaceRaised,
    gap: 14,
    width: "100%",
  },
  loginContainerDesktop: {
    maxWidth: 420,
  },
  loginIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(224, 184, 74, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 6,
  },
  loginTitle: {
    color: colors.text,
    fontFamily: fontFamilies.displayMedium,
    fontSize: 26,
    textAlign: "center",
  },
  loginSubtitle: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 12.5,
    textAlign: "center",
    marginBottom: 8,
  },
  formGroup: {
    gap: 6,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 11.5,
  },
  fieldInput: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    backgroundColor: colors.background,
    paddingHorizontal: 14,
    color: colors.text,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 13.5,
    outlineStyle: "none" as never,
  },
  submitBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  submitBtnText: {
    color: "#120e06",
    fontFamily: fontFamilies.sansBold,
    fontSize: 13.5,
  },
  devBtn: {
    paddingVertical: 8,
    alignItems: "center",
  },
  devBtnText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 12,
  },
});
