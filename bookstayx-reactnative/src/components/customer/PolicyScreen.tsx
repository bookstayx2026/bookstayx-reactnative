import { StyleSheet, Text, View } from "react-native";
import { AppScreen } from "@/components/foundation";
import { UtilityHeader } from "./CustomerUtility";
import { useCustomerChrome } from "./CustomerChromeContext";
import { colors, fontFamilies, layout } from "@/theme";
export type PolicySection={title:string;body:string};
export function PolicyScreen({title,subtitle,sections}:{title:string;subtitle:string;sections:PolicySection[]}){const {onScroll}=useCustomerChrome();return <AppScreen contentContainerStyle={styles.screen} scrollProps={{onScroll,scrollEventThrottle:16}}><UtilityHeader title={title} subtitle={subtitle}/><View style={styles.content}>{sections.map(section=><View key={section.title} style={styles.section}><Text style={styles.title}>{section.title}</Text><Text style={styles.body}>{section.body}</Text></View>)}<Text style={styles.updated}>Last updated: 1 September 2026</Text></View></AppScreen>}
const styles=StyleSheet.create({screen:{paddingBottom:layout.bottomChromeReserve},content:{paddingHorizontal:20},section:{paddingVertical:17,borderBottomWidth:1,borderBottomColor:"rgba(255,255,255,.08)"},title:{color:"white",fontFamily:fontFamilies.displaySemiBold,fontSize:21},body:{marginTop:8,color:colors.textSecondary,fontFamily:fontFamilies.sans,fontSize:12.5,lineHeight:20},updated:{marginTop:22,color:colors.textMuted,fontFamily:fontFamilies.sans,fontSize:10.5}});
