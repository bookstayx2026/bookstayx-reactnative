import { Slot, usePathname, useRouter, type Href } from "expo-router";
import { Building2, CalendarCheck2, CalendarDays, Home, LogOut, Share2, UserRound } from "lucide-react-native";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fontFamilies, layout, radii } from "@/theme";
import { useAuth } from "@/components/auth";

const nav = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/owner", label: "Calendar", Icon: CalendarDays },
  { href: "/owner/bookings", label: "Bookings", Icon: CalendarCheck2 },
  { href: "/owner/units", label: "Units", Icon: Building2 },
  { href: "/owner/profile", label: "Profile", Icon: UserRound },
] as const;

export function OwnerShell() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  return <View style={styles.root}>
    <View style={[styles.header,{paddingTop:Math.max(10,insets.top)}]}>
      <View style={styles.brand}><Text style={styles.brandMain}>BOOKSTAY</Text><Text style={styles.brandX}>X</Text></View>
      <View style={styles.headerActions}>
        <Pressable accessibilityRole="button" onPress={()=>router.push("/referrals")} style={styles.chip}><Share2 size={14} color={colors.gold}/><Text style={styles.chipText}>Referral</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Sign out" onPress={()=>void signOut().then(()=>router.replace("/owner-login"))} style={styles.chip}><LogOut size={14} color={colors.gold}/><Text style={styles.chipText}>Sign out</Text></Pressable>
      </View>
    </View>
    <View style={styles.content}><Slot /></View>
    <View style={[styles.navWrap,{paddingBottom:Math.max(10,insets.bottom)}]}>
      <View accessibilityRole="tablist" style={styles.nav}>
        {nav.map(({href,label,Icon})=>{const active=href==="/owner"?pathname==="/owner"||pathname==="/owner/":href==="/"?false:pathname.startsWith(href);return <Pressable key={href} accessibilityRole="tab" accessibilityState={{selected:active}} onPress={()=>router.push(href as Href)} style={[styles.navItem,active&&styles.navActive]}><Icon size={17} strokeWidth={1.7} color={active?colors.gold:colors.textSubtle}/><Text style={[styles.navLabel,active&&styles.navLabelActive]}>{label}</Text></Pressable>})}
      </View>
    </View>
  </View>;
}

const styles=StyleSheet.create({
  root:{flex:1,backgroundColor:colors.background}, content:{flex:1},
  header:{zIndex:20,minHeight:70,paddingHorizontal:12,paddingBottom:12,flexDirection:"row",alignItems:"center",borderBottomWidth:StyleSheet.hairlineWidth,borderBottomColor:"rgba(255,255,255,.1)",backgroundColor:"rgba(5,7,9,.96)"},
  brand:{flex:1,flexDirection:"row",alignItems:"baseline"},brandMain:{fontFamily:fontFamilies.displayBold,fontSize:23,color:colors.text,letterSpacing:1},brandX:{fontFamily:fontFamilies.displayBold,fontSize:23,color:colors.gold},
  headerActions:{flexDirection:"row",gap:6},chip:{height:36,flexDirection:"row",alignItems:"center",gap:5,paddingHorizontal:10,borderRadius:radii.pill,borderWidth:1,borderColor:"rgba(224,184,74,.55)"},chipText:{fontFamily:fontFamilies.sansSemiBold,fontSize:10,color:colors.gold},
  navWrap:{position:"absolute",left:0,right:0,bottom:0,zIndex:30,alignItems:"center",paddingHorizontal:10},nav:{width:"100%",maxWidth:layout.sourceMaxWidth,minHeight:70,padding:6,flexDirection:"row",borderRadius:22,borderWidth:1,borderColor:"rgba(224,184,74,.25)",backgroundColor:"rgba(11,14,18,.97)",...Platform.select({web:{boxShadow:"0 -10px 40px rgba(224,184,74,.12)"},default:{elevation:16}})},
  navItem:{flex:1,minHeight:54,alignItems:"center",justifyContent:"center",gap:4,borderRadius:14,borderWidth:1,borderColor:"transparent"},navActive:{borderColor:colors.gold},navLabel:{fontFamily:fontFamilies.sansMedium,fontSize:9.5,color:colors.textSubtle},navLabelActive:{color:colors.gold}
});
