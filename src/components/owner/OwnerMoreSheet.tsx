import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRouter, usePathname } from "expo-router";
import {
  X,
  Inbox,
  Users,
  Building,
  CreditCard,
  BarChart3,
  Globe,
  Share2,
  Bell,
  Settings,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from "lucide-react-native";

interface OwnerMoreSheetProps {
  visible: boolean;
  onClose: () => void;
  requestCount?: number;
  unreadCount?: number;
}

interface MenuItem {
  title: string;
  subtitle: string;
  icon: any;
  route: string;
  badge?: number;
  badgeColor?: string;
  isExternal?: boolean;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export const OwnerMoreSheet: React.FC<OwnerMoreSheetProps> = ({
  visible,
  onClose,
  requestCount = 0,
  unreadCount = 0,
}) => {
  const router = useRouter();
  const pathname = usePathname();

  const sections: MenuSection[] = [
    {
      title: "Operations & Properties",
      items: [
        {
          title: "Booking Requests",
          subtitle: "Inquiries, WhatsApp leads & approvals",
          icon: Inbox,
          route: "/owner/requests",
          badge: requestCount > 0 ? requestCount : undefined,
          badgeColor: "#E0B84A",
        },
        {
          title: "Housekeeping & Staff",
          subtitle: "Caretakers, daily rosters & wage logs",
          icon: Users,
          route: "/owner/staff",
        },
        {
          title: "Villa Units",
          subtitle: "Inventory, capacity & pricing tiers",
          icon: Building,
          route: "/owner/units",
        },
      ],
    },
    {
      title: "Finance & Performance",
      items: [
        {
          title: "Expenses & Outflows",
          subtitle: "Bills, maintenance, cleaning & net profit",
          icon: CreditCard,
          route: "/owner/expenses",
        },
        {
          title: "Reports & Analytics",
          subtitle: "Revenue trends, ADR & channel attribution",
          icon: BarChart3,
          route: "/owner/reports",
        },
      ],
    },
    {
      title: "Network & Portals",
      items: [
        {
          title: "B2B Agent Network",
          subtitle: "Agent rates, commissions & contracts",
          icon: Globe,
          route: "/owner/b2b",
        },
        {
          title: "Referral Portal",
          subtitle: "Owner referral codes & bonuses",
          icon: Share2,
          route: "/owner/referrals",
        },
        {
          title: "Property Profile",
          subtitle: "Amenities, gallery, house rules & location",
          icon: Building,
          route: "/owner/profile",
        },
        {
          title: "Customer Site",
          subtitle: "View live guest booking portal",
          icon: ExternalLink,
          route: "/",
          isExternal: true,
        },
      ],
    },
    {
      title: "System & Preferences",
      items: [
        {
          title: "Notifications",
          subtitle: "Alerts, guest activities & ledger logs",
          icon: Bell,
          route: "/owner/notifications",
          badge: unreadCount > 0 ? unreadCount : undefined,
          badgeColor: "#E0B84A",
        },
        {
          title: "Owner Settings",
          subtitle: "Contact channels & automation rules",
          icon: Settings,
          route: "/owner/settings",
        },
      ],
    },
  ];

  const handleNavigate = (route: string) => {
    onClose();
    router.push(route as any);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.sheetContainer}>
          <View style={styles.dragHandle} />

          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Owner Hub & Modules</Text>
              <Text style={styles.headerSubtitle}>
                Select an operational workspace to navigate
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color="#A0AEC0" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
            {sections.map((section, sIdx) => (
              <View key={sIdx} style={styles.sectionWrap}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <View style={styles.itemsCard}>
                  {section.items.map((item, iIdx) => {
                    const IconComp = item.icon;
                    const isActive = pathname === item.route;

                    return (
                      <TouchableOpacity
                        key={iIdx}
                        style={[
                          styles.menuItem,
                          isActive && styles.menuItemActive,
                          iIdx < section.items.length - 1 && styles.menuItemBorder,
                        ]}
                        onPress={() => handleNavigate(item.route)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.iconBox, isActive && styles.iconBoxActive]}>
                          <IconComp
                            size={18}
                            color={isActive ? "#E0B84A" : "#94A3B8"}
                          />
                        </View>

                        <View style={styles.itemTextWrap}>
                          <View style={styles.itemTitleRow}>
                            <Text
                              style={[
                                styles.itemTitle,
                                isActive && styles.itemTitleActive,
                              ]}
                            >
                              {item.title}
                            </Text>
                            {item.badge !== undefined && (
                              <View
                                style={[
                                  styles.badge,
                                  { backgroundColor: item.badgeColor || "#E0B84A" },
                                ]}
                              >
                                <Text style={styles.badgeText}>{item.badge}</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.itemSub}>{item.subtitle}</Text>
                        </View>

                        <ChevronRight
                          size={16}
                          color={isActive ? "#E0B84A" : "#4A5568"}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.75)",
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: "#0D1117",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: "#1E2633",
    maxHeight: "85%",
    paddingBottom: 24,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#2D3748",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 6,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1E2633",
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#161D27",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollArea: {
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingVertical: 14,
    gap: 16,
  },
  sectionWrap: {
    gap: 8,
  },
  sectionTitle: {
    color: "#718096",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingHorizontal: 4,
  },
  itemsCard: {
    backgroundColor: "#10141B",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1E2633",
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#161D27",
  },
  menuItemActive: {
    backgroundColor: "rgba(224, 184, 74, 0.08)",
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#161D27",
    justifyContent: "center",
    alignItems: "center",
  },
  iconBoxActive: {
    backgroundColor: "rgba(224, 184, 74, 0.15)",
  },
  itemTextWrap: {
    flex: 1,
  },
  itemTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemTitle: {
    color: "#CBD5E1",
    fontSize: 14,
    fontWeight: "600",
  },
  itemTitleActive: {
    color: "#E0B84A",
    fontWeight: "700",
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: "#000",
    fontSize: 10,
    fontWeight: "700",
  },
  itemSub: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 2,
  },
});
