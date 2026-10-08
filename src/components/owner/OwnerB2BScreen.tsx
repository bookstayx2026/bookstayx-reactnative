/* API-backed effects hydrate protected owner state. */
/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  Copy,
  EyeOff,
  Plus,
  Share2,
  ShieldCheck,
  Sparkles,
  Store,
  Trash2,
  UsersRound,
} from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import { useAuth } from "@/components/auth";
import { colors, fontFamilies, layout, radii, spacing } from "@/theme";
import { useIsWideScreen } from "@/hooks/use-window-class";
import { PressableScale } from "@/components/foundation";
import {
  createOwnerB2BPartner,
  deleteOwnerB2BPartner,
  getOwnerB2BPartners,
  hideOwnerB2BPartner,
  type OwnerB2BPartner,
} from "@/services/api";

export function OwnerB2BScreen() {
  const { session } = useAuth();
  const isDesktop = useIsWideScreen();
  const token = session?.role === "owner" ? session.tokens.accessToken : "";
  const [partners, setPartners] = useState<OwnerB2BPartner[]>([]);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      setPartners((await getOwnerB2BPartners(token)).list || []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load partners.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    setError("");
    setBusy(true);
    try {
      await createOwnerB2BPartner(token, {
        username: name.trim(),
        mobile: mobile.replace(/\D/g, ""),
        referral_code: code.trim().toUpperCase() || undefined,
      });
      setName("");
      setMobile("");
      setCode("");
      setMessage("B2B partner created successfully.");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create partner.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number, hide: boolean) => {
    setError("");
    try {
      if (hide) await hideOwnerB2BPartner(token, id);
      else await deleteOwnerB2BPartner(token, id);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update partner.");
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[s.scroll, isDesktop && s.scrollDesktop]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[s.page, isDesktop && s.pageDesktop]}>
        {/* Header */}
        <View style={s.headerBanner}>
          <View style={s.badge}>
            <Sparkles size={11} color={colors.gold} />
            <Text style={s.badgeText}>OWNER PARTNER NETWORK</Text>
          </View>
          <Text style={[s.title, isDesktop && s.titleDesktop]}>B2B Partners</Text>
          <Text style={s.subtitle}>
            Create property-linked partner codes, distribute custom referral links, and
            track partner commissions.
          </Text>
        </View>

        {error || message ? (
          <Text style={[s.message, error ? s.error : s.success]}>
            {error || message}
          </Text>
        ) : null}

        {/* 2-Column Responsive Widescreen Layout */}
        <View style={isDesktop ? s.widescreenRow : s.mobileStack}>
          {/* Left Column: Create Partner */}
          <View style={isDesktop ? s.widescreenLeft : undefined}>
            <View style={s.panel}>
              <View style={s.panelTitleRow}>
                <Plus size={18} color={colors.gold} />
                <Text style={s.panelTitle}>Add New Partner</Text>
              </View>

              <View style={s.grid}>
                <Field
                  label="Partner full name"
                  value={name}
                  onChange={setName}
                  placeholder="e.g. Rahul Sharma"
                />
                <Field
                  label="Mobile number (WhatsApp)"
                  value={mobile}
                  onChange={setMobile}
                  placeholder="10-digit number"
                  numeric
                />
                <Field
                  label="Custom referral code (optional)"
                  value={code}
                  onChange={(value) =>
                    setCode(value.replace(/[^a-z0-9]/gi, "").toUpperCase())
                  }
                  placeholder="e.g. STAYRAHUL"
                />
              </View>

              <PressableScale
                disabled={busy}
                onPress={() => void create()}
                style={[s.primary, busy && s.disabled]}
              >
                {busy ? (
                  <ActivityIndicator color={colors.actionInk} />
                ) : (
                  <Text style={s.primaryText}>Create B2B Partner</Text>
                )}
              </PressableScale>
            </View>
          </View>

          {/* Right Column: Active Partners List */}
          <View style={isDesktop ? s.widescreenRight : undefined}>
            <View style={s.panel}>
              <View style={s.panelTitleRow}>
                <UsersRound size={18} color={colors.gold} />
                <Text style={s.panelTitle}>Active Partners ({partners.length})</Text>
              </View>

              {loading ? (
                <View style={s.loadingBox}>
                  <ActivityIndicator color={colors.gold} />
                  <Text style={s.loadingText}>Loading partners...</Text>
                </View>
              ) : partners.length ? (
                partners.map((partner) => (
                  <View key={partner.id} style={s.partner}>
                    <View style={s.partnerCopy}>
                      <Text style={s.partnerName}>{partner.username}</Text>
                      <Text style={s.meta}>
                        {partner.referral_otp_number} ·{" "}
                        <Text style={{ color: colors.gold }}>
                          {partner.referral_code}
                        </Text>
                      </Text>
                      <Text numberOfLines={1} style={s.link}>
                        {partner.referral_url}
                      </Text>
                    </View>

                    <View style={s.partnerActions}>
                      <IconButton
                        label="Copy referral URL"
                        onPress={() =>
                          void Clipboard.setStringAsync(partner.referral_url)
                        }
                        Icon={Copy}
                      />
                      <IconButton
                        label="Share URL"
                        onPress={() =>
                          void Share.share({ message: partner.referral_url })
                        }
                        Icon={Share2}
                      />
                      <IconButton
                        label="Hide partner"
                        onPress={() => void remove(partner.id, true)}
                        Icon={EyeOff}
                      />
                      <IconButton
                        label="Delete partner"
                        danger
                        onPress={() => void remove(partner.id, false)}
                        Icon={Trash2}
                      />
                    </View>
                  </View>
                ))
              ) : (
                <View style={s.emptyBox}>
                  <Store size={32} color={colors.gold} />
                  <Text style={s.empty}>No owner-linked B2B partners yet.</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  numeric,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  numeric?: boolean;
}) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={numeric ? "phone-pad" : "default"}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={s.input}
      />
    </View>
  );
}

function IconButton({
  label,
  onPress,
  Icon,
  danger,
}: {
  label: string;
  onPress: () => void;
  Icon: typeof Copy;
  danger?: boolean;
}) {
  return (
    <PressableScale
      accessibilityLabel={label}
      onPress={onPress}
      style={[s.iconButton, danger && s.iconButtonDanger]}
    >
      <Icon size={15} color={danger ? colors.danger : colors.gold} />
    </PressableScale>
  );
}

const s = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    alignItems: "center",
    paddingBottom: 100,
    backgroundColor: "#07080A",
  },
  scrollDesktop: {
    paddingBottom: 48,
  },
  page: {
    width: "100%",
    maxWidth: layout.sourceMaxWidth,
    padding: 16,
    gap: 16,
  },
  pageDesktop: {
    maxWidth: 1360,
    paddingHorizontal: 28,
    paddingTop: 24,
    gap: 24,
  },
  headerBanner: {
    gap: 6,
  },
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: "rgba(224, 184, 74, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.35)",
  },
  badgeText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 9.5,
    letterSpacing: 0.8,
  },
  title: {
    color: "#fff",
    fontFamily: fontFamilies.displaySemiBold,
    fontSize: 26,
  },
  titleDesktop: {
    fontSize: 32,
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 12.5,
    lineHeight: 18,
    maxWidth: 600,
  },
  message: {
    padding: 12,
    borderRadius: 10,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12,
  },
  error: {
    color: "#FCA5A5",
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderColor: "rgba(239, 68, 68, 0.35)",
    borderWidth: 1,
  },
  success: {
    color: "#86EFAC",
    backgroundColor: "rgba(34, 197, 94, 0.12)",
    borderColor: "rgba(34, 197, 94, 0.35)",
    borderWidth: 1,
  },

  // Widescreen Layout
  widescreenRow: {
    flexDirection: "row",
    gap: 24,
    alignItems: "flex-start",
  },
  widescreenLeft: {
    flex: 1,
    minWidth: 0,
  },
  widescreenRight: {
    flex: 1.4,
    minWidth: 0,
  },
  mobileStack: {
    gap: 16,
  },

  panel: {
    gap: 14,
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.22)",
    backgroundColor: "#10141B",
  },
  panelTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  panelTitle: {
    color: "#fff",
    fontFamily: fontFamilies.displaySemiBold,
    fontSize: 20,
  },
  grid: {
    gap: 12,
  },
  field: {
    width: "100%",
    gap: 6,
  },
  label: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 11,
  },
  input: {
    minHeight: 46,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.35)",
    backgroundColor: "#0B0E11",
    color: colors.text,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 13,
  },
  primary: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.goldAction,
    marginTop: 6,
  },
  primaryText: {
    color: colors.actionInk,
    fontFamily: fontFamilies.sansBold,
    fontSize: 13.5,
  },
  disabled: {
    opacity: 0.55,
  },
  partner: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  partnerCopy: {
    flex: 1,
    minWidth: 0,
  },
  partnerName: {
    color: "#fff",
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 14,
  },
  meta: {
    marginTop: 3,
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 10.5,
  },
  link: {
    marginTop: 3,
    color: colors.gold,
    fontFamily: fontFamilies.sans,
    fontSize: 10,
  },
  partnerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "rgba(224, 184, 74, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.25)",
  },
  iconButtonDanger: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderColor: "rgba(239, 68, 68, 0.25)",
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 36,
    gap: 8,
  },
  empty: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 12,
  },
  loadingBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    gap: 8,
  },
  loadingText: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 12,
  },
});
