import { useState } from "react";
import { ActivityIndicator, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Image } from "expo-image";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CalendarCheck,
  Camera,
  Check,
  CheckSquare,
  ChevronRight,
  CircleHelp,
  Gift,
  Heart,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  Sparkles,
  Square,
  Trash2,
  UserCheck,
  UserRound,
  Users,
} from "lucide-react-native";
import { Redirect, router } from "expo-router";
import { AppScreen } from "@/components/foundation";
import { useCustomerChrome, useCustomerData } from "@/components/customer";
import { useAuth } from "@/components/auth";
import { colors, fontFamilies, layout, radii } from "@/theme";
import { useIsDesktop } from "@/hooks/use-window-class";
import { deleteCustomerAccountInApp } from "@/services/api/auth";

const AVATAR_URL =
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&h=240&fit=crop&crop=faces";
const PROFILE = {
  name: "BookStayX Developer",
  tags: "Adventure seeker • Nature lover • Explorer",
  email: "developer@bookstayx.local",
  phone: "+91 99999 99991",
  city: "Mumbai, Maharashtra",
};

export default function ProfileScreen() {
  const { onScroll } = useCustomerChrome();
  const { ready, session, signOut } = useAuth();
  const { bookings, savedIds } = useCustomerData();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const isDesktop = useIsDesktop();

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteAgreed, setDeleteAgreed] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError("Please enter your password to confirm account deletion.");
      return;
    }
    if (!deleteAgreed) {
      setDeleteError("Please confirm that you understand account deletion is permanent.");
      return;
    }
    if (!session?.tokens?.accessToken) {
      setDeleteError("Session expired. Please log in again.");
      return;
    }

    setDeleteLoading(true);
    setDeleteError("");
    try {
      await deleteCustomerAccountInApp(deletePassword, session.tokens.accessToken);
      setDeleteModalVisible(false);
      await signOut();
      router.replace("/login");
    } catch (caught) {
      setDeleteError(caught instanceof Error ? caught.message : "Failed to delete account. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  if (!session) return <Redirect href="/login" />;

  const identity = session.identity as { name?: string; email?: string | null; mobile?: string };
  const shownName = name || identity.name || PROFILE.name;
  const shownEmail = email || identity.email || PROFILE.email;
  const shownPhone =
    phone ||
    (identity.mobile
      ? `+91 ${identity.mobile.slice(0, 5)} ${identity.mobile.slice(5)}`
      : PROFILE.phone);
  const shownCity = city || PROFILE.city;

  const handleToggleEdit = () => {
    if (editing) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
    setEditing(!editing);
  };

  const leftColumn = (
    <View style={[styles.leftCol, isDesktop && styles.leftColDesktop]}>
      {/* Overview Card */}
      <View style={styles.overviewCard}>
        <View style={styles.overviewTop}>
          <View style={styles.avatarWrap}>
            <Image
              source={{ uri: AVATAR_URL }}
              contentFit="cover"
              accessibilityLabel={shownName}
              style={styles.avatar}
            />
            <Pressable accessibilityLabel="Change photo" style={styles.cameraBtn}>
              <Camera size={13} color="#120e06" strokeWidth={2.2} />
            </Pressable>
          </View>

          <View style={styles.overviewDetails}>
            <View style={styles.verifiedRow}>
              <UserCheck size={12} color={colors.gold} />
              <Text style={styles.verifiedText}>VERIFIED TRAVELER</Text>
            </View>
            <Text numberOfLines={1} style={styles.name}>
              {shownName}
            </Text>
            <Text numberOfLines={1} style={styles.tags}>
              {PROFILE.tags}
            </Text>
          </View>
        </View>

        <View style={styles.overviewDivider} />

        {/* Quick Contacts */}
        <View style={styles.contactList}>
          <View style={styles.contactItem}>
            <Mail size={13} color={colors.gold} />
            <Text numberOfLines={1} style={styles.contactText}>
              {shownEmail}
            </Text>
          </View>
          <View style={styles.contactItem}>
            <Phone size={13} color={colors.gold} />
            <Text numberOfLines={1} style={styles.contactText}>
              {shownPhone}
            </Text>
          </View>
        </View>

        {/* Travel Stats Strip */}
        <View style={styles.travelStatsStrip}>
          <View style={styles.travelStat}>
            <Text style={styles.travelStatValue}>{bookings.length}</Text>
            <Text style={styles.travelStatLabel}>Total Stays</Text>
          </View>
          <View style={styles.travelStatDivider} />
          <View style={styles.travelStat}>
            <Text style={styles.travelStatValue}>{savedIds.length}</Text>
            <Text style={styles.travelStatLabel}>Saved Places</Text>
          </View>
          <View style={styles.travelStatDivider} />
          <View style={styles.travelStat}>
            <Text style={styles.travelStatValue}>Gold</Text>
            <Text style={styles.travelStatLabel}>Member Tier</Text>
          </View>
        </View>
      </View>

      {/* Menu Navigation Items */}
      <View style={styles.menuList}>
        <MenuRow
          Icon={Gift}
          title="Referral Portal & Rewards"
          description="View your referral earnings, QR code & payouts"
          tone="gold"
          onPress={() => router.push("/referrals")}
        />
        <MenuRow
          Icon={CalendarCheck}
          title="My Bookings & Stays"
          description="Manage active reservations & download vouchers"
          tone="blue"
          onPress={() => router.push("/bookings")}
        />
        <MenuRow
          Icon={Heart}
          title="Saved Properties"
          description="View your handpicked wishlist of luxury villas"
          tone="rose"
          onPress={() => router.push("/saved")}
        />
        <MenuRow
          Icon={CircleHelp}
          title="Help & 24/7 Concierge"
          description="FAQs, booking assistance & WhatsApp support"
          tone="purple"
          onPress={() => router.push("/contact" as any)}
        />
        <MenuRow
          Icon={LogOut}
          title="Sign Out"
          description="Securely logout from your BookStayX account"
          tone="danger"
          onPress={() => void signOut().then(() => router.replace("/login"))}
        />
        <MenuRow
          Icon={Trash2}
          title="Delete Account"
          description="Permanently erase your account and personal data"
          tone="danger"
          onPress={() => {
            setDeleteError("");
            setDeletePassword("");
            setDeleteAgreed(false);
            setDeleteModalVisible(true);
          }}
        />
      </View>
    </View>
  );

  const rightColumn = (
    <View style={[styles.rightCol, isDesktop && styles.rightColDesktop]}>
      <View style={styles.cardSection}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <Text style={styles.sectionSubtitle}>
              Update your contact info and personal preferences.
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={editing ? "Save profile" : "Edit profile"}
            onPress={handleToggleEdit}
            style={({ pressed }) => [
              styles.editBtn,
              editing && styles.editBtnActive,
              pressed && styles.pressed,
              Platform.select({
                web: { cursor: "pointer", outlineStyle: "none" } as any,
                default: {},
              }),
            ]}
          >
            {editing ? (
              <Check size={14} color="#120e06" strokeWidth={2.4} />
            ) : (
              <Pencil size={13} color={colors.gold} strokeWidth={2} />
            )}
            <Text style={[styles.editBtnText, editing && styles.editBtnTextActive]}>
              {editing ? "Save Changes" : "Edit Profile"}
            </Text>
          </Pressable>
        </View>

        {saveSuccess ? (
          <View style={styles.successBanner}>
            <Check size={14} color="#34D399" />
            <Text style={styles.successBannerText}>Profile details updated successfully!</Text>
          </View>
        ) : null}

        <View style={styles.fieldsContainer}>
          <ProfileField
            Icon={UserRound}
            label="Full Name"
            value={shownName}
            onChangeText={setName}
            editable={editing}
          />
          <ProfileField
            Icon={Mail}
            label="Email Address"
            value={shownEmail}
            onChangeText={setEmail}
            editable={editing}
            keyboardType="email-address"
          />
          <ProfileField
            Icon={Phone}
            label="Mobile Number"
            value={shownPhone}
            onChangeText={setPhone}
            editable={editing}
            keyboardType="phone-pad"
          />
          <ProfileField
            Icon={MapPin}
            label="Home City & Region"
            value={shownCity}
            onChangeText={setCity}
            editable={editing}
          />
        </View>

        <View style={styles.securityNote}>
          <ShieldCheck size={16} color="#34D399" strokeWidth={2} />
          <Text style={styles.securityText}>
            Your information is securely encrypted and never shared with third parties.
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <AppScreen
      contentContainerStyle={[styles.screen, isDesktop && styles.screenDesktop]}
      scrollProps={{ onScroll, scrollEventThrottle: 16 }}
    >
      <View style={[styles.container, isDesktop && styles.containerDesktop]}>
        {/* Header */}
        <View style={styles.headerBanner}>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Sparkles size={11} color={colors.gold} />
              <Text style={styles.badgeText}>ACCOUNT & PREFERENCES</Text>
            </View>
          </View>
          <Text style={[styles.title, isDesktop && styles.titleDesktop]}>
            My <Text style={styles.goldText}>Account</Text>
          </Text>
          <Text style={styles.subtitle}>
            Manage your personal details, referral credentials, and stay preferences.
          </Text>
        </View>

        {/* 2-Column Responsive Layout */}
        <View style={[styles.grid, isDesktop && styles.gridDesktop]}>
          {leftColumn}
          {rightColumn}
        </View>
        {/* Account Deletion Confirmation Modal */}
        <Modal
          visible={deleteModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => {
            if (!deleteLoading) setDeleteModalVisible(false);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={styles.modalIconWrap}>
                  <AlertTriangle size={22} color="#EF4444" strokeWidth={2.2} />
                </View>
                <View style={styles.modalTitleWrap}>
                  <Text style={styles.modalTitle}>Delete BookStayX Account</Text>
                  <Text style={styles.modalSubtitle}>
                    This action is permanent and cannot be undone.
                  </Text>
                </View>
              </View>

              <View style={styles.modalNoticeBox}>
                <View style={styles.noticeItem}>
                  <View style={styles.noticeBullet} />
                  <Text style={styles.noticeText}>
                    <Text style={styles.noticeBold}>What will be erased:</Text> Your profile details, contact information, saved villas, push tokens, and login credentials will be permanently erased immediately.
                  </Text>
                </View>
                <View style={styles.noticeItem}>
                  <View style={styles.noticeBullet} />
                  <Text style={styles.noticeText}>
                    <Text style={styles.noticeBold}>Statutory data retention:</Text> In compliance with Indian tax, accounting, and consumer protection laws, completed booking invoices and financial transaction ledgers are retained for legal audit compliance, with all personal account links removed.
                  </Text>
                </View>
              </View>

              <View style={styles.modalInputWrap}>
                <Text style={styles.modalInputLabel}>Confirm your password to authorize deletion</Text>
                <TextInput
                  secureTextEntry
                  value={deletePassword}
                  onChangeText={(val) => {
                    setDeletePassword(val);
                    setDeleteError("");
                  }}
                  placeholder="Enter your account password"
                  placeholderTextColor={colors.textMuted}
                  style={styles.modalInput}
                  editable={!deleteLoading}
                />
              </View>

              <Pressable
                accessibilityRole="checkbox"
                accessibilityLabel="Confirm permanent deletion"
                style={styles.confirmCheckboxRow}
                onPress={() => setDeleteAgreed(!deleteAgreed)}
              >
                {deleteAgreed ? (
                  <CheckSquare size={18} color="#EF4444" />
                ) : (
                  <Square size={18} color={colors.textMuted} />
                )}
                <Text style={styles.checkboxText}>
                  I confirm that I want to permanently delete my BookStayX account and understand this action cannot be reversed.
                </Text>
              </Pressable>

              {deleteError ? (
                <View style={styles.modalErrorBanner}>
                  <Text style={styles.modalErrorText}>{deleteError}</Text>
                </View>
              ) : null}

              <View style={styles.modalButtonRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Cancel deletion"
                  onPress={() => {
                    if (!deleteLoading) setDeleteModalVisible(false);
                  }}
                  style={styles.modalCancelBtn}
                  disabled={deleteLoading}
                >
                  <Text style={styles.modalCancelText}>Keep My Account</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Permanently delete account"
                  onPress={handleDeleteAccount}
                  style={[
                    styles.modalDeleteBtn,
                    (!deleteAgreed || !deletePassword || deleteLoading) && styles.modalDeleteBtnDisabled,
                  ]}
                  disabled={deleteLoading || !deleteAgreed || !deletePassword}
                >
                  {deleteLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalDeleteText}>Permanently Delete</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </AppScreen>
  );
}

function ProfileField({
  Icon,
  label,
  value,
  onChangeText,
  editable,
  keyboardType,
}: {
  Icon: typeof UserRound;
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  editable: boolean;
  keyboardType?: "email-address" | "phone-pad";
}) {
  return (
    <View style={styles.fieldRow}>
      <View style={styles.fieldIcon}>
        <Icon size={16} color={colors.gold} strokeWidth={1.8} />
      </View>
      <View style={styles.fieldMain}>
        <Text style={styles.fieldLabel}>
          {label} <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          keyboardType={keyboardType}
          autoCapitalize={keyboardType === "email-address" ? "none" : "words"}
          style={[styles.input, editable && styles.inputEditing]}
        />
      </View>
    </View>
  );
}

function MenuRow({
  Icon,
  title,
  description,
  tone,
  onPress,
}: {
  Icon: typeof Users;
  title: string;
  description: string;
  tone: "gold" | "blue" | "rose" | "purple" | "danger";
  onPress: () => void;
}) {
  const danger = tone === "danger";

  const iconColors = {
    gold: { bg: "rgba(224, 184, 74, 0.12)", color: colors.gold, border: "rgba(224, 184, 74, 0.3)" },
    blue: { bg: "rgba(59, 130, 246, 0.12)", color: "#60A5FA", border: "rgba(59, 130, 246, 0.3)" },
    rose: { bg: "rgba(244, 63, 94, 0.12)", color: "#FB7185", border: "rgba(244, 63, 94, 0.3)" },
    purple: { bg: "rgba(168, 85, 247, 0.12)", color: "#C084FC", border: "rgba(168, 85, 247, 0.3)" },
    danger: { bg: "rgba(239, 68, 68, 0.12)", color: "#F87171", border: "rgba(239, 68, 68, 0.3)" },
  }[tone];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuRow,
        danger && styles.logoutRow,
        pressed && styles.pressed,
        Platform.select({
          web: {
            cursor: "pointer",
            outlineStyle: "none",
            transition: "transform 0.2s ease, border-color 0.2s ease",
          } as any,
          default: {},
        }),
      ]}
    >
      <View style={[styles.menuIcon, { backgroundColor: iconColors.bg, borderColor: iconColors.border }]}>
        <Icon size={17} color={iconColors.color} strokeWidth={1.8} />
      </View>
      <View style={styles.menuCopy}>
        <Text style={[styles.menuTitle, danger && styles.logoutTitle]}>{title}</Text>
        <Text style={styles.menuDescription}>{description}</Text>
      </View>
      <ChevronRight
        size={18}
        color={danger ? "#F87171" : colors.gold}
        strokeWidth={2}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  screen: {
    paddingTop: 72,
    paddingBottom: layout.bottomChromeReserve + 20,
    backgroundColor: colors.surface,
  },
  screenDesktop: {
    paddingTop: 88,
    paddingBottom: layout.desktopBottomReserve + 24,
  },
  container: {
    paddingHorizontal: 20,
    gap: 20,
  },
  containerDesktop: {
    maxWidth: 1320,
    alignSelf: "center",
    width: "100%",
    paddingHorizontal: 36,
  },

  // Header Banner
  headerBanner: {
    paddingTop: 14,
    paddingBottom: 4,
  },
  badgeRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: radii.pill,
    backgroundColor: "rgba(224, 184, 74, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.3)",
  },
  badgeText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 9.5,
    letterSpacing: 1.1,
  },
  title: {
    color: colors.text,
    fontFamily: fontFamilies.displayMedium,
    fontSize: 28,
    lineHeight: 34,
  },
  titleDesktop: {
    fontSize: 36,
    lineHeight: 44,
  },
  goldText: {
    color: colors.gold,
  },
  subtitle: {
    marginTop: 6,
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 13,
    lineHeight: 20,
    maxWidth: 700,
  },

  // 2-Column Responsive Grid
  grid: {
    gap: 20,
    marginTop: 10,
  },
  gridDesktop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 24,
  },
  leftCol: {
    gap: 16,
  },
  leftColDesktop: {
    width: 440,
  },
  rightCol: {
    flex: 1,
  },
  rightColDesktop: {
    flex: 1,
  },

  // Overview Card
  overviewCard: {
    padding: 20,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.2)",
    backgroundColor: "rgba(14, 18, 24, 0.95)",
    ...Platform.select({
      web: {
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
      } as any,
      default: {},
    }),
  },
  overviewTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatarWrap: {
    position: "relative",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: colors.gold,
  },
  cameraBtn: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  overviewDetails: {
    flex: 1,
    minWidth: 0,
  },
  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  verifiedText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 9.5,
    letterSpacing: 1,
  },
  name: {
    color: colors.text,
    fontFamily: fontFamilies.sansBold,
    fontSize: 18,
    lineHeight: 23,
  },
  tags: {
    marginTop: 3,
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 11.5,
  },
  overviewDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    marginVertical: 14,
  },
  contactList: {
    gap: 8,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  contactText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 12.5,
  },
  travelStatsStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  travelStat: {
    alignItems: "center",
    flex: 1,
  },
  travelStatValue: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 16,
  },
  travelStatLabel: {
    marginTop: 2,
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 10.5,
  },
  travelStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },

  // Menu List
  menuList: {
    gap: 10,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "rgba(14, 18, 24, 0.9)",
    gap: 12,
  },
  logoutRow: {
    borderColor: "rgba(239, 68, 68, 0.35)",
    backgroundColor: "rgba(239, 68, 68, 0.06)",
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  menuCopy: {
    flex: 1,
    minWidth: 0,
  },
  menuTitle: {
    color: colors.text,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 13.5,
  },
  logoutTitle: {
    color: "#F87171",
  },
  menuDescription: {
    marginTop: 2,
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 11,
  },

  // Right Column Card Section
  cardSection: {
    padding: 22,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.18)",
    backgroundColor: "rgba(14, 18, 24, 0.95)",
    gap: 18,
    ...Platform.select({
      web: {
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
      } as any,
      default: {},
    }),
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: fontFamilies.displayMedium,
    fontSize: 20,
  },
  sectionSubtitle: {
    marginTop: 3,
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 12,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.35)",
    backgroundColor: "rgba(224, 184, 74, 0.1)",
  },
  editBtnActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  editBtnText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 12,
  },
  editBtnTextActive: {
    color: "#120e06",
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "rgba(52, 211, 153, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.3)",
  },
  successBannerText: {
    color: "#34D399",
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12,
  },
  fieldsContainer: {
    gap: 14,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  fieldIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(224, 184, 74, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  fieldMain: {
    flex: 1,
    gap: 4,
  },
  fieldLabel: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  required: {
    color: "#E11D48",
  },
  input: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "#0B0E11",
    paddingHorizontal: 12,
    color: colors.text,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 13.5,
    outlineStyle: "none" as never,
  },
  inputEditing: {
    borderColor: colors.gold,
    backgroundColor: "rgba(224, 184, 74, 0.05)",
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(52, 211, 153, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.2)",
    marginTop: 4,
  },
  securityText: {
    flex: 1,
    color: "#34D399",
    fontFamily: fontFamilies.sans,
    fontSize: 11.5,
    lineHeight: 16,
  },

  // Account Deletion Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.82)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 480,
    backgroundColor: "#0F1217",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.35)",
    padding: 24,
    gap: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  modalIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitleWrap: {
    flex: 1,
  },
  modalTitle: {
    color: "#F87171",
    fontFamily: fontFamilies.sansBold,
    fontSize: 18,
    lineHeight: 22,
  },
  modalSubtitle: {
    marginTop: 4,
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 12.5,
    lineHeight: 17,
  },
  modalNoticeBox: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 14,
    gap: 10,
  },
  noticeItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  noticeBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
    marginTop: 6,
  },
  noticeText: {
    flex: 1,
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    lineHeight: 17,
  },
  noticeBold: {
    color: colors.text,
    fontFamily: fontFamilies.sansBold,
  },
  modalInputWrap: {
    gap: 6,
  },
  modalInputLabel: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12.5,
  },
  modalInput: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontFamily: fontFamilies.sans,
    fontSize: 14,
  },
  confirmCheckboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 2,
  },
  checkboxText: {
    flex: 1,
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    lineHeight: 16,
  },
  modalErrorBanner: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.35)",
    borderRadius: 10,
    padding: 10,
  },
  modalErrorText: {
    color: "#F87171",
    fontFamily: fontFamilies.sans,
    fontSize: 12,
  },
  modalButtonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 13,
  },
  modalDeleteBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
  },
  modalDeleteBtnDisabled: {
    opacity: 0.5,
  },
  modalDeleteText: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.sansBold,
    fontSize: 13,
  },
});
