import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { OwnerShell } from "@/components/owner";
import { useAuth } from "@/components/auth";
import { colors } from "@/theme";
export default function OwnerLayout(){const{ready,session}=useAuth();if(!ready)return <View style={{flex:1,alignItems:"center",justifyContent:"center",backgroundColor:colors.background}}><ActivityIndicator color={colors.gold}/></View>;if(session?.role!=="owner")return <Redirect href="/owner-login"/>;return <OwnerShell/>}
