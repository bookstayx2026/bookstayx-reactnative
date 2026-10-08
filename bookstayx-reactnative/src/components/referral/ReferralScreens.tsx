import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import {
  ArrowRight,
  CheckCircle2,
  Coins,
  Crown,
  Gift,
  QrCode,
  Share2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Trophy,
  UserRound,
  Users,
  Wallet,
  Zap,
} from "lucide-react-native";
import { getTopEarners, type TopEarner } from "@/services/api";
import { colors, fontFamilies, layout, radii } from "@/theme";
import { useIsDesktop } from "@/hooks/use-window-class";

const money = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export function ReferralHomeScreen() {
  const [period, setPeriod] = useState<"month" | "all">("all");
  const [earners, setEarners] = useState<TopEarner[]>([]);
  const [loading, setLoading] = useState(true);
  const isDesktop = useIsDesktop();

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
      contentContainerStyle={[styles.scroll, isDesktop && styles.scrollDesktop]}
    >
      <View style={[styles.container, isDesktop && styles.containerDesktop]}>
        
        {/* Hero Banner Section */}
        <View style={[styles.heroBanner, isDesktop && styles.heroBannerDesktop]}>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Sparkles size={11} color={colors.gold} />
              <Text style={styles.badgeText}>PARTNER REWARDS PROGRAM</Text>
            </View>
          </View>

          <View style={[styles.heroRow, isDesktop && styles.heroRowDesktop]}>
            <View style={styles.heroLeft}>
              <Text style={[styles.heroTitle, isDesktop && styles.heroTitleDesktop]}>
                Refer Friends & Earn <Text style={styles.goldText}>Real Cash</Text>
              </Text>
              <Text style={[styles.heroSubtitle, isDesktop && styles.heroSubtitleDesktop]}>
                Share your love for scenic weekend getaways. Get rewarded with direct cash payouts for every confirmed stay booked by your friends and family.
              </Text>
            </View>

            <View style={[styles.heroActionCard, isDesktop && styles.heroActionCardDesktop]}>
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
                onPress={() => router.push("/referrals/dashboard")}
                style={({ pressed }) => [
                  styles.dashboardBtn,
                  pressed && styles.pressed,
                  Platform.select({
                    web: { cursor: "pointer", outlineStyle: "none" } as any,
                    default: {},
                  }),
                ]}
              >
                <Text style={styles.dashboardBtnText}>Open My Dashboard</Text>
                <ArrowRight size={15} color="#120e06" strokeWidth={2.5} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Top Earners Leaderboard */}
        <View style={[styles.leaderboardPanel, isDesktop && styles.leaderboardPanelDesktop]}>
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
                <Text style={[styles.segmentBtnText, period === "month" && styles.segmentBtnTextActive]}>
                  This Month
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setPeriod("all")}
                style={[styles.segmentBtn, period === "all" && styles.segmentBtnActive]}
              >
                <Text style={[styles.segmentBtnText, period === "all" && styles.segmentBtnTextActive]}>
                  All Time
                </Text>
              </Pressable>
            </View>
          </View>

          {loading ? (
            <ActivityIndicator style={{ marginVertical: 32 }} color={colors.gold} />
          ) : (
            <View style={[styles.earnersGrid, isDesktop && styles.earnersGridDesktop]}>
              {displayEarners.slice(0, 3).map((earner, index) => {
                const isFirst = index === 0;
                return (
                  <View
                    key={`${earner.name}-${index}`}
                    style={[
                      styles.earnerCard,
                      isDesktop && styles.earnerCardDesktop,
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
            <Text style={[styles.sectionTitle, isDesktop && styles.sectionTitleDesktop]}>
              How It Works
            </Text>
          </View>

          <View style={[styles.stepsGrid, isDesktop && styles.stepsGridDesktop]}>
            <View style={[styles.stepCard, isDesktop && styles.stepCardDesktop]}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>01</Text>
              </View>
              <View style={styles.stepIconCircle}>
                <Share2 size={22} color={colors.gold} />
              </View>
              <Text style={styles.stepTitle}>Share Your Link</Text>
              <Text style={styles.stepDesc}>
                Open your dashboard to copy your personal invite link or QR code and share with friends.
              </Text>
            </View>

            <View style={[styles.stepCard, isDesktop && styles.stepCardDesktop]}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>02</Text>
              </View>
              <View style={styles.stepIconCircle}>
                <Users size={22} color={colors.gold} />
              </View>
              <Text style={styles.stepTitle}>Friend Books a Stay</Text>
              <Text style={styles.stepDesc}>
                Your friend explores and completes a booking for a villa, cottage, or resort on BookStayX.
              </Text>
            </View>

            <View style={[styles.stepCard, isDesktop && styles.stepCardDesktop]}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>03</Text>
              </View>
              <View style={styles.stepIconCircle}>
                <Coins size={22} color={colors.gold} />
              </View>
              <Text style={styles.stepTitle}>Receive Cash Rewards</Text>
              <Text style={styles.stepDesc}>
                Get real cash credited to your wallet with instant withdrawal straight to your UPI ID.
              </Text>
            </View>
          </View>
        </View>

        {/* Benefits Grid on Widescreen */}
        <View style={[styles.benefitsGrid, isDesktop && styles.benefitsGridDesktop]}>
          <View style={[styles.benefitCard, isDesktop && styles.benefitCardDesktop]}>
            <Zap size={20} color={colors.gold} />
            <View style={{ flex: 1 }}>
              <Text style={styles.benefitTitle}>Unlimited Earning Potential</Text>
              <Text style={styles.benefitDesc}>
                No caps or limits on how many guests you can refer. The more you share, the more you earn.
              </Text>
            </View>
          </View>

          <View style={[styles.benefitCard, isDesktop && styles.benefitCardDesktop]}>
            <ShieldCheck size={20} color={colors.gold} />
            <View style={{ flex: 1 }}>
              <Text style={styles.benefitTitle}>Direct UPI Transfers</Text>
              <Text style={styles.benefitDesc}>
                Hassle-free automated payouts directly to Google Pay, PhonePe, or any valid UPI ID.
              </Text>
            </View>
          </View>

          <View style={[styles.benefitCard, isDesktop && styles.benefitCardDesktop]}>
            <TrendingUp size={20} color={colors.gold} />
            <View style={{ flex: 1 }}>
              <Text style={styles.benefitTitle}>Transparent Real-Time Tracking</Text>
              <Text style={styles.benefitDesc}>
                Monitor clicks, confirmed bookings, and payout status live from your personal portal.
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom Call to Action Card */}
        <View style={[styles.bottomCta, isDesktop && styles.bottomCtaDesktop]}>
          <View style={styles.bottomCtaLeft}>
            <View style={styles.bottomCtaBadge}>
              <Gift size={14} color={colors.gold} />
              <Text style={styles.bottomCtaBadgeText}>START EARNING TODAY</Text>
            </View>
            <Text style={[styles.bottomCtaTitle, isDesktop && styles.bottomCtaTitleDesktop]}>
              Ready to invite your network?
            </Text>
            <Text style={styles.bottomCtaDesc}>
              Access your personalized referral link, QR code, and live earnings dashboard in seconds.
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/referrals/dashboard")}
            style={({ pressed }) => [
              styles.startInvitingBtn,
              pressed && styles.pressed,
              Platform.select({
                web: { cursor: "pointer", outlineStyle: "none" } as any,
                default: {},
              }),
            ]}
          >
            <Text style={styles.startInvitingBtnText}>Open Referral Portal</Text>
            <ArrowRight size={16} color="#120e06" strokeWidth={2.5} />
          </Pressable>
        </View>

      </View>
    </ScrollView>
  );
}

// Redirect or alias for legacy references
export const ReferralGenerateScreen = ReferralHomeScreen;

const styles = StyleSheet.create({
  pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  scroll: {
    flexGrow: 1,
    alignItems: "center",
    backgroundColor: colors.background,
    paddingTop: 72,
    paddingBottom: layout.bottomChromeReserve + 20,
  },
  scrollDesktop: {
    paddingTop: 88,
    paddingBottom: layout.desktopBottomReserve + 24,
  },
  container: {
    width: "100%",
    paddingHorizontal: 20,
    gap: 24,
  },
  containerDesktop: {
    maxWidth: 1320,
    paddingHorizontal: 36,
    gap: 32,
  },

  // Hero Banner
  heroBanner: {
    backgroundColor: "rgba(14, 18, 24, 0.95)",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.22)",
    padding: 22,
    ...Platform.select({
      web: {
        boxShadow: "0 8px 30px rgba(0, 0, 0, 0.4)",
      } as any,
      default: {},
    }),
  },
  heroBannerDesktop: {
    padding: 34,
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
  heroRowDesktop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 36,
  },
  heroLeft: {
    flex: 1,
  },
  heroTitle: {
    color: colors.text,
    fontFamily: fontFamilies.displayMedium,
    fontSize: 28,
    lineHeight: 34,
  },
  heroTitleDesktop: {
    fontSize: 38,
    lineHeight: 46,
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
  heroSubtitleDesktop: {
    fontSize: 14.5,
    lineHeight: 23,
  },
  heroActionCard: {
    backgroundColor: "rgba(22, 28, 36, 0.8)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.25)",
    padding: 18,
    gap: 14,
  },
  heroActionCardDesktop: {
    width: 360,
  },
  heroActionTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  walletIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(224, 184, 74, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionCardTitle: {
    color: colors.text,
    fontFamily: fontFamilies.sansBold,
    fontSize: 15,
  },
  actionCardSubtitle: {
    marginTop: 2,
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 11.5,
  },
  dashboardBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.gold,
    paddingVertical: 12,
    borderRadius: 12,
  },
  dashboardBtnText: {
    color: "#120e06",
    fontFamily: fontFamilies.sansBold,
    fontSize: 13,
  },

  // Steps Section
  section: {
    gap: 16,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionBadge: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: fontFamilies.displayMedium,
    fontSize: 22,
    lineHeight: 28,
  },
  sectionTitleDesktop: {
    fontSize: 26,
    lineHeight: 32,
  },
  stepsGrid: {
    gap: 14,
  },
  stepsGridDesktop: {
    flexDirection: "row",
    gap: 18,
  },
  stepCard: {
    flex: 1,
    backgroundColor: "rgba(14, 18, 24, 0.9)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 20,
    position: "relative",
    ...Platform.select({
      web: {
        boxShadow: "0 4px 18px rgba(0, 0, 0, 0.25)",
      } as any,
      default: {},
    }),
  },
  stepCardDesktop: {
    padding: 24,
  },
  stepNumberBadge: {
    position: "absolute",
    right: 16,
    top: 16,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    backgroundColor: "rgba(224, 184, 74, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.25)",
  },
  stepNumberText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 11,
  },
  stepIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(224, 184, 74, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  stepTitle: {
    color: colors.text,
    fontFamily: fontFamilies.sansBold,
    fontSize: 16,
    lineHeight: 22,
  },
  stepDesc: {
    marginTop: 6,
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 12.5,
    lineHeight: 18,
  },

  // Benefits Grid
  benefitsGrid: {
    gap: 12,
  },
  benefitsGridDesktop: {
    flexDirection: "row",
    gap: 16,
  },
  benefitCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    backgroundColor: "rgba(18, 22, 28, 0.65)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    padding: 16,
  },
  benefitCardDesktop: {
    padding: 18,
  },
  benefitTitle: {
    color: colors.text,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 13.5,
  },
  benefitDesc: {
    marginTop: 3,
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 11.5,
    lineHeight: 16,
  },

  // Leaderboard Panel
  leaderboardPanel: {
    backgroundColor: "rgba(14, 18, 24, 0.95)",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.2)",
    padding: 20,
    gap: 16,
  },
  leaderboardPanelDesktop: {
    padding: 28,
  },
  leaderboardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  leaderboardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  leaderboardTitle: {
    color: colors.text,
    fontFamily: fontFamilies.displayMedium,
    fontSize: 18,
  },
  leaderboardSubtitle: {
    marginTop: 2,
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 11.5,
  },
  segment: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 3,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  segmentBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  segmentBtnActive: {
    backgroundColor: "rgba(224, 184, 74, 0.15)",
    borderWidth: 1,
    borderColor: colors.gold,
  },
  segmentBtnText: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
  },
  segmentBtnTextActive: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
  },
  earnersGrid: {
    gap: 10,
  },
  earnersGridDesktop: {
    flexDirection: "row",
    gap: 14,
  },
  earnerCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(22, 28, 36, 0.7)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    padding: 14,
  },
  earnerCardDesktop: {
    padding: 18,
  },
  earnerCardFirst: {
    borderColor: "rgba(224, 184, 74, 0.35)",
    backgroundColor: "rgba(224, 184, 74, 0.06)",
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
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
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFirst: {
    backgroundColor: "rgba(224, 184, 74, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.4)",
  },
  earnerInfo: {
    flex: 1,
  },
  earnerName: {
    color: colors.text,
    fontFamily: fontFamilies.sansBold,
    fontSize: 14,
  },
  earnerRole: {
    marginTop: 2,
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 10.5,
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
    marginTop: 1,
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 9.5,
  },

  // Bottom CTA
  bottomCta: {
    backgroundColor: "rgba(18, 22, 28, 0.95)",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.3)",
    padding: 24,
    gap: 18,
  },
  bottomCtaDesktop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 32,
  },
  bottomCtaLeft: {
    flex: 1,
    maxWidth: 720,
  },
  bottomCtaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 6,
  },
  bottomCtaBadgeText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 9.5,
    letterSpacing: 1.1,
  },
  bottomCtaTitle: {
    color: colors.text,
    fontFamily: fontFamilies.displayMedium,
    fontSize: 22,
    lineHeight: 28,
  },
  bottomCtaTitleDesktop: {
    fontSize: 26,
    lineHeight: 32,
  },
  bottomCtaDesc: {
    marginTop: 6,
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 13,
    lineHeight: 19,
  },
  startInvitingBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.gold,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: radii.pill,
    alignSelf: "flex-start",
  },
  startInvitingBtnText: {
    color: "#120e06",
    fontFamily: fontFamilies.sansBold,
    fontSize: 13.5,
  },
});
