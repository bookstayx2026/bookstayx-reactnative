import type { LucideIcon } from "lucide-react-native";
import {
  Bell,
  CalendarDays,
  Heart,
  Home,
  Hotel,
  IndianRupee,
  MapPin,
  RefreshCcw,
  Scale,
  Shield,
  User,
} from "lucide-react-native";

export type CustomerNavItem = {
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  exact?: boolean;
};

export const customerNavItems: CustomerNavItem[] = [
  { href: "/", label: "Home", shortLabel: "Home", icon: Home, exact: true },
  { href: "/properties", label: "Properties", shortLabel: "Stays", icon: Hotel },
  { href: "/locations", label: "Locations", shortLabel: "Places", icon: MapPin },
  { href: "/referrals", label: "Referral", shortLabel: "Referral", icon: IndianRupee },
  { href: "/bookings", label: "Bookings", shortLabel: "Bookings", icon: CalendarDays },
  { href: "/saved", label: "Saved", shortLabel: "Saved", icon: Heart },
  { href: "/profile", label: "Profile", shortLabel: "Profile", icon: User },
];

export const customerMenuItems = [
  customerNavItems[0],
  customerNavItems[1],
  customerNavItems[2],
  customerNavItems[4],
  customerNavItems[5],
  customerNavItems[3],
  customerNavItems[6],
] as CustomerNavItem[];

export const policyNavItems: CustomerNavItem[] = [
  { href: "/terms", label: "Terms & Privacy", shortLabel: "Terms", icon: Scale },
  { href: "/privacy", label: "Privacy Policy", shortLabel: "Privacy", icon: Shield },
  { href: "/refund-policy", label: "Refund Policy", shortLabel: "Refunds", icon: RefreshCcw },
];

export const notificationNavItem: CustomerNavItem = {
  href: "/notifications",
  label: "Notifications",
  shortLabel: "Alerts",
  icon: Bell,
};

export function isCustomerRouteActive(pathname: string, item: CustomerNavItem) {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}
