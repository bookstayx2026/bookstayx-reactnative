import type { LucideIcon } from "lucide-react-native";
import { BellRing, Building2, ContactRound, CreditCard, Handshake, LayoutDashboard, Settings, Share2, UsersRound, WalletCards } from "lucide-react-native";

export type AdminSection = { slug: string; href: string; label: string; description: string; icon: LucideIcon; phase: number };

export const adminSections: AdminSection[] = [
  { slug: "overview", href: "/admin", label: "Overview", description: "Operational dashboard and live summaries", icon: LayoutDashboard, phase: 4 },
  { slug: "properties", href: "/admin/properties", label: "Properties", description: "Properties, units, media and category controls", icon: Building2, phase: 5 },
  { slug: "owners", href: "/admin/owners", label: "Owners", description: "Owner directory and linked property access", icon: UsersRound, phase: 8 },
  { slug: "referrals", href: "/admin/referrals", label: "Referrals", description: "Referral accounts, status and impersonation", icon: Share2, phase: 8 },
  { slug: "transactions", href: "/admin/transactions", label: "Transactions", description: "Bookings, payments, refunds and cancellations", icon: CreditCard, phase: 7 },
  { slug: "b2b", href: "/admin/b2b", label: "B2B", description: "Business and owner-linked partner programs", icon: Handshake, phase: 8 },
  { slug: "requests", href: "/admin/requests", label: "Request center", description: "Withdrawal and refund decisions", icon: BellRing, phase: 7 },
  { slug: "revenue", href: "/admin/revenue", label: "Revenue", description: "Revenue, liabilities and payout summaries", icon: WalletCards, phase: 7 },
  { slug: "contacts", href: "/admin/contacts", label: "Contacts", description: "Owner, partner and guest contacts", icon: ContactRound, phase: 8 },
  { slug: "settings", href: "/admin/settings", label: "Security", description: "Administrator security and TOTP", icon: Settings, phase: 3 },
];

export const getAdminSection = (slug?: string) => adminSections.find((section) => section.slug === slug);
