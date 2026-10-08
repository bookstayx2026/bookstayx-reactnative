import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter, type Href } from "expo-router";
import {
  ArrowRight,
  Coins,
  Crown,
  Gift,
  Share2,
  ShieldCheck,
  Sparkles,
  Store,
  TrendingUp,
  Trophy,
  UserRound,
  Users,
  Wallet,
  Zap,
} from "lucide-react-native";
import { getTopEarners, type TopEarner } from "@/services/api";
import { colors, fontFamilies, radii } from "@/theme";
import { useIsWideScreen } from "@/hooks/use-window-class";
import { ReferralDashboardScreen } from "@/components/referral/ReferralDashboardScreen";

const money = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export function OwnerReferralsScreen() {
  const router = useRouter();
  const isWide = useIsWideScreen();
  const [activeTab, setActiveTab] = useState<"overview" | "dashboard">("overview");
  const [period, setPeriod] = useState<"month" | "all">("all");
  const [earners, setEarners] = useState<TopEarner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getTopEarners(period)
      .then(setEarners)
      .catch(() => setEarners([]))
      .finally(() => setLoading(false));
  }, [period]);

  const displayEarners: { name: string; amount: number }[] = earners.length
    ? earners.map((e) => ({
        name: e.username || e.name || "Partner",
        amount: Number(e.total_earnings || e.earnings || e.amount || 0),
      }))
    : [
        { name: "Sujay", amount: 26840 },
        { name: "Anjali", amount: 18420 },
        { name: "Rahul", amount: 12650 },
      ];

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.scroll, isWide && styles.scrollWide]}
    >
      <View style={[styles.container, isWide && styles.containerWide]}>
        {/* Top Tab Switcher */}
        <View style={styles.tabRow}>
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === "overview" }}
            onPress={() => setActiveTab("overview")}
            style={[styles.tabBtn, activeTab === "overview" && styles.tabBtnActive]}
          >
            <Sparkles
              size={15}
              color={activeTab === "overview" ? colors.gold : colors.textMuted}
            />
            <Text
              style={[styles.tabBtnText, activeTab === "overview" && styles.tabBtnTextActive]}
            >
              Rewards & Leaderboard
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === "dashboard" }}
            onPress={() => setActiveTab("dashboard")}
            style={[styles.tabBtn, activeTab === "dashboard" && styles.tabBtnActive]}
          >
            <Wallet
              size={15}
              color={activeTab === "dashboard" ? colors.gold : colors.textMuted}
            />
            <Text
              style={[styles.tabBtnText, activeTab === "dashboard" && styles.tabBtnTextActive]}
            >
              Referral Dashboard & Wallet
            </Text>
          </Pressable>
        </View>

        {activeTab === "dashboard" ? (
          <View style={styles.embeddedDashboard}>
            <ReferralDashboardScreen />
          </View>
        ) : (
          <>
            {/* Hero Banner Section */}
            <View style={[styles.heroBanner, isWide && styles.heroBannerWide]}>
              <View style={styles.badgeRow}>
                <View style={styles.badge}>
                  <Sparkles size={11} color={colors.gold} />
                  <Text style={styles.badgeText}>PARTNER REWARDS PROGRAM</Text>
                </View>
              </View>

              <View style={[styles.heroRow, isWide && styles.heroRowWide]}>
                <View style={styles.heroLeft}>
                  <Text style={[styles.heroTitle, isWide && styles.heroTitleWide]}>
                    Refer Friends & Earn <Text style={styles.goldText}>Real Cash</Text>
                  </Text>
                  <Text style={[styles.heroSubtitle, isWide && styles.heroSubtitleWide]}>
                    Share your love for scenic weekend getaways. Get rewarded with direct cash
                    payouts for every confirmed stay booked by your friends, guests, and community.
                  </Text>

                  <View style={styles.b2bShortcutRow}>
                    <Pressable
                      onPress={() => router.push("/owner/b2b" as Href)}
                      style={({ pressed }) => [
                        styles.b2bShortcutBtn,
                        pressed && styles.pressed,
                        Platform.select({ web: { cursor: "pointer" } as any, default: {} }),
                      ]}
                    >
                      <Store size={14} color={colors.gold} />
                      <Text style={styles.b2bShortcutText}>
                        Looking for B2B Agents? Manage B2B Network →
                      </Text>
                    </Pressable>
                  </View>
                </View>

                <View style={[styles.heroActionCard, isWide && styles.heroActionCardWide]}>
                  <View style={styles.heroActionTop}>
                    <View style={styles.walletIconCircle}>
                      <Wallet size={20} color={colors.gold} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.actionCardTitle}>Referral Dashboard</Text>
                      <Text style={styles.actionCardSubtitle}>
                        View earnings, payouts & your unique link
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setActiveTab("dashboard")}
                    style={({ pressed }) => [
                      styles.dashboardBtn,
                      pressed && styles.pressed,
                      Platform.select({
                        web: { cursor: "pointer", outlineStyle: "none" } as any,
                        default: {},
                      }),
                    ]}
                  >
                    <Text style={styles.dashboardBtnText}>Open My Referral Wallet</Text>
                    <ArrowRight size={15} color="#120e06" strokeWidth={2.5} />
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Top Earners Leaderboard */}
            <View style={[styles.leaderboardPanel, isWide && styles.leaderboardPanelWide]}>
              <View style={styles.leaderboardHeader}>
                <View style={styles.leaderboardTitleRow}>
                  <Trophy size={20} color={colors.gold} />
                  <View>
                    <Text style={styles.leaderboardTitle}>Top Earners Leaderboard</Text>
                    <Text style={styles.leaderboardSubtitle}>
                      Top performing community partners this season
                    </Text>
                  </View>
                </View>

                <View style={styles.segment}>
                  <Pressable
                    onPress={() => setPeriod("month")}
                    style={[styles.segmentBtn, period === "month" && styles.segmentBtnActive]}
                  >
                    <Text
                      style={[
                        styles.segmentBtnText,
                        period === "month" && styles.segmentBtnTextActive,
                      ]}
                    >
                      This Month
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setPeriod("all")}
                    style={[styles.segmentBtn, period === "all" && styles.segmentBtnActive]}
                  >
                    <Text
                      style={[
                        styles.segmentBtnText,
                        period === "all" && styles.segmentBtnTextActive,
                      ]}
                    >
                      All Time
                    </Text>
                  </Pressable>
                </View>
              </View>

              {loading ? (
                <ActivityIndicator style={{ marginVertical: 32 }} color={colors.gold} />
              ) : (
                <View style={[styles.earnersGrid, isWide && styles.earnersGridWide]}>
                  {displayEarners.slice(0, 3).map((earner, index) => {
                    const isFirst = index === 0;
                    return (
                      <View
                        key={`${earner.name}-${index}`}
                        style={[
                          styles.earnerCard,
                          isWide && styles.earnerCardWide,
                          isFirst && styles.earnerCardFirst,
                        ]}
                      >
                        <View style={styles.rankBadge}>
                          <Text style={[styles.rankText, isFirst && styles.rankTextFirst]}>
                            #{index + 1}
                          </Text>
                        </View>

                        <View style={[styles.avatar, isFirst && styles.avatarFirst]}>
                          {isFirst ? (
                            <Crown size={20} color={colors.gold} />
                          ) : (
                            <UserRound size={18} color={colors.textSecondary} />
                          )}
                        </View>

                        <View style={styles.earnerInfo}>
                          <Text style={styles.earnerName}>{earner.name}</Text>
                          <Text style={styles.earnerRole}>
                            {isFirst ? "🏆 Top Ambassador" : "Verified Partner"}
                          </Text>
                        </View>

                        <View style={styles.earnerAmountBox}>
                          <Text style={styles.earnerAmount}>{money(earner.amount)}</Text>
                          <Text style={styles.earnerAmountSub}>Total Earned</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* 3-Step "How It Works" Visual Process */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionBadge}>SIMPLE 3-STEP REWARD FLOW</Text>
                <Text style={[styles.sectionTitle, isWide && styles.sectionTitleWide]}>
                  How It Works
                </Text>
              </View>

              <View style={[styles.stepsGrid, isWide && styles.stepsGridWide]}>
                <View style={[styles.stepCard, isWide && styles.stepCardWide]}>
                  <View style={styles.stepNumberBadge}>
                    <Text style={styles.stepNumberText}>01</Text>
                  </View>
                  <View style={styles.stepIconCircle}>
                    <Share2 size={22} color={colors.gold} />
                  </View>
                  <Text style={styles.stepTitle}>Share Your Link</Text>
                  <Text style={styles.stepDesc}>
                    Open your dashboard to copy your personal invite link or QR code and share with
                    friends.
                  </Text>
                </View>

                <View style={[styles.stepCard, isWide && styles.stepCardWide]}>
                  <View style={styles.stepNumberBadge}>
                    <Text style={styles.stepNumberText}>02</Text>
                  </View>
                  <View style={styles.stepIconCircle}>
                    <Users size={22} color={colors.gold} />
                  </View>
                  <Text style={styles.stepTitle}>Friend Books a Stay</Text>
                  <Text style={styles.stepDesc}>
                    Your friend explores and completes a booking for a villa, cottage, or resort on
                    BookStayX.
                  </Text>
                </View>

                <View style={[styles.stepCard, isWide && styles.stepCardWide]}>
                  <View style={styles.stepNumberBadge}>
                    <Text style={styles.stepNumberText}>03</Text>
                  </View>
                  <View style={styles.stepIconCircle}>
                    <Coins size={22} color={colors.gold} />
                  </View>
                  <Text style={styles.stepTitle}>Receive Cash Rewards</Text>
                  <Text style={styles.stepDesc}>
                    Get real cash credited to your wallet with instant withdrawal straight to your
                    UPI ID.
                  </Text>
                </View>
              </View>
            </View>

            {/* Benefits Grid */}
            <View style={[styles.benefitsGrid, isWide && styles.benefitsGridWide]}>
              <View style={[styles.benefitCard, isWide && styles.benefitCardWide]}>
                <Zap size={20} color={colors.gold} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.benefitTitle}>Unlimited Earning Potential</Text>
                  <Text style={styles.benefitDesc}>
                    No caps or limits on how many guests you can refer. The more you share, the more
                    you earn.
                  </Text>
                </View>
              </View>

              <View style={[styles.benefitCard, isWide && styles.benefitCardWide]}>
                <ShieldCheck size={20} color={colors.gold} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.benefitTitle}>Direct UPI Transfers</Text>
                  <Text style={styles.benefitDesc}>
                    Hassle-free automated payouts directly to Google Pay, PhonePe, or any valid UPI ID.
                  </Text>
                </View>
              </View>

              <View style={[styles.benefitCard, isWide && styles.benefitCardWide]}>
                <TrendingUp size={20} color={colors.gold} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.benefitTitle}>Transparent Real-Time Tracking</Text>
                  <Text style={styles.benefitDesc}>
                    Monitor clicks, confirmed bookings, and payout status live from your personal
                    portal.
                  </Text>
                </View>
              </View>
            </View>

            {/* Bottom Call to Action Card */}
            <View style={[styles.bottomCta, isWide && styles.bottomCtaWide]}>
              <View style={styles.bottomCtaLeft}>
                <View style={styles.bottomCtaBadge}>
                  <Gift size={14} color={colors.gold} />
                  <Text style={styles.bottomCtaBadgeText}>START EARNING TODAY</Text>
                </View>
                <Text style={[styles.bottomCtaTitle, isWide && styles.bottomCtaTitleWide]}>
                  Ready to invite your network?
                </Text>
                <Text style={styles.bottomCtaDesc}>
                  Access your personalized referral link, QR code, and live earnings dashboard in
                  seconds.
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={() => setActiveTab("dashboard")}
                style={({ pressed }) => [
                  styles.startInvitingBtn,
                  pressed && styles.pressed,
                  Platform.select({
                    web: { cursor: "pointer", outlineStyle: "none" } as any,
                    default: {},
                  }),
                ]}
              >
                <Text style={styles.startInvitingBtnText}>Open Referral Dashboard</Text>
                <ArrowRight size={16} color="#120e06" strokeWidth={2.5} />
              </Pressable>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  scroll: {
    flexGrow: 1,
    alignItems: "center",
    backgroundColor: "#07080A",
    paddingTop: 16,
    paddingBottom: 48,
  },
  scrollWide: {
    paddingTop: 24,
    paddingBottom: 56,
  },
  container: {
    width: "100%",
    paddingHorizontal: 16,
    gap: 20,
  },
  containerWide: {
    maxWidth: 1360,
    paddingHorizontal: 28,
    gap: 26,
  },

  // Tab Switcher
  tabRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(18, 22, 28, 0.8)",
    padding: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.16)",
    alignSelf: "flex-start",
  },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: "rgba(224, 184, 74, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.32)",
  },
  tabBtnText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 13,
  },
  tabBtnTextActive: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.sansBold,
  },

  embeddedDashboard: {
    width: "100%",
    borderRadius: 18,
    overflow: "hidden",
  },

  // Hero Banner
  heroBanner: {
    backgroundColor: "rgba(14, 18, 24, 0.95)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.22)",
    padding: 20,
    ...Platform.select({
      web: {
        boxShadow: "0 8px 30px rgba(0, 0, 0, 0.4)",
      } as any,
      default: {},
    }),
  },
  heroBannerWide: {
    padding: 30,
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
  heroRow: {
    gap: 20,
  },
  heroRowWide: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 32,
  },
  heroLeft: {
    flex: 1,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.displayMedium,
    fontSize: 26,
    lineHeight: 32,
  },
  heroTitleWide: {
    fontSize: 34,
    lineHeight: 42,
  },
  goldText: {
    color: colors.gold,
  },
  heroSubtitle: {
    marginTop: 8,
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 13.5,
    lineHeight: 21,
    maxWidth: 680,
  },
  heroSubtitleWide: {
    fontSize: 14,
    lineHeight: 22,
  },
  b2bShortcutRow: {
    marginTop: 14,
  },
  b2bShortcutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: "rgba(224, 184, 74, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.22)",
    alignSelf: "flex-start",
  },
  b2bShortcutText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12,
  },

  heroActionCard: {
    backgroundColor: "rgba(22, 28, 36, 0.8)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.25)",
    padding: 16,
    gap: 14,
  },
  heroActionCardWide: {
    width: 340,
  },
  heroActionTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  walletIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(224, 184, 74, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionCardTitle: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.sansBold,
    fontSize: 14.5,
  },
  actionCardSubtitle: {
    marginTop: 2,
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 11,
  },
  dashboardBtn: {
    backgroundColor: colors.gold,
    borderRadius: 10,
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  dashboardBtnText: {
    color: "#120e06",
    fontFamily: fontFamilies.sansBold,
    fontSize: 12.5,
  },

  // Leaderboard
  leaderboardPanel: {
    backgroundColor: "rgba(14, 18, 24, 0.9)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.18)",
    padding: 18,
    gap: 16,
  },
  leaderboardPanelWide: {
    padding: 24,
  },
  leaderboardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
  },
  leaderboardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  leaderboardTitle: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.sansBold,
    fontSize: 16,
  },
  leaderboardSubtitle: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 12,
  },
  segment: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  segmentBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: "rgba(224, 184, 74, 0.18)",
  },
  segmentBtnText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12,
  },
  segmentBtnTextActive: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
  },
  earnersGrid: {
    gap: 10,
  },
  earnersGridWide: {
    flexDirection: "row",
    gap: 14,
  },
  earnerCard: {
    flex: 1,
    backgroundColor: "rgba(22, 28, 36, 0.6)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  earnerCardWide: {
    flexDirection: "column",
    alignItems: "flex-start",
    padding: 18,
    gap: 14,
  },
  earnerCardFirst: {
    borderColor: "rgba(224, 184, 74, 0.35)",
    backgroundColor: "rgba(224, 184, 74, 0.06)",
  },
  rankBadge: {
    position: "absolute",
    right: 12,
    top: 12,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  rankText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansBold,
    fontSize: 11,
  },
  rankTextFirst: {
    color: colors.gold,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFirst: {
    backgroundColor: "rgba(224, 184, 74, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.4)",
  },
  earnerInfo: {
    flex: 1,
  },
  earnerName: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.sansBold,
    fontSize: 14,
  },
  earnerRole: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 11.5,
    marginTop: 2,
  },
  earnerAmountBox: {
    alignItems: "flex-end",
  },
  earnerAmount: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 15,
  },
  earnerAmountSub: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 10.5,
  },

  // Steps
  section: {
    gap: 14,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionBadge: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 10,
    letterSpacing: 1,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.sansBold,
    fontSize: 20,
  },
  sectionTitleWide: {
    fontSize: 24,
  },
  stepsGrid: {
    gap: 12,
  },
  stepsGridWide: {
    flexDirection: "row",
    gap: 16,
  },
  stepCard: {
    flex: 1,
    backgroundColor: "rgba(14, 18, 24, 0.7)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    padding: 18,
    gap: 10,
    position: "relative",
  },
  stepCardWide: {
    padding: 22,
  },
  stepNumberBadge: {
    position: "absolute",
    right: 16,
    top: 16,
  },
  stepNumberText: {
    color: "rgba(255, 255, 255, 0.12)",
    fontFamily: fontFamilies.sansBold,
    fontSize: 26,
  },
  stepIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(224, 184, 74, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepTitle: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.sansBold,
    fontSize: 15,
  },
  stepDesc: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 12.5,
    lineHeight: 18,
  },

  // Benefits
  benefitsGrid: {
    gap: 12,
  },
  benefitsGridWide: {
    flexDirection: "row",
    gap: 16,
  },
  benefitCard: {
    flex: 1,
    backgroundColor: "rgba(14, 18, 24, 0.6)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  benefitCardWide: {
    padding: 20,
  },
  benefitTitle: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.sansBold,
    fontSize: 13.5,
  },
  benefitDesc: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 16,
  },

  // Bottom CTA
  bottomCta: {
    backgroundColor: "rgba(22, 28, 36, 0.9)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.25)",
    padding: 20,
    gap: 16,
  },
  bottomCtaWide: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 28,
  },
  bottomCtaLeft: {
    flex: 1,
    gap: 6,
  },
  bottomCtaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  bottomCtaBadgeText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 9.5,
    letterSpacing: 1,
  },
  bottomCtaTitle: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.sansBold,
    fontSize: 18,
  },
  bottomCtaTitleWide: {
    fontSize: 22,
  },
  bottomCtaDesc: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 12.5,
  },
  startInvitingBtn: {
    backgroundColor: colors.gold,
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  startInvitingBtnText: {
    color: "#120e06",
    fontFamily: fontFamilies.sansBold,
    fontSize: 13,
  },
});
