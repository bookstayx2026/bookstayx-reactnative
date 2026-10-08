/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth";
import { getProtectedOwnerDashboard, type OwnerDashboard } from "@/services/api";

export function useOwnerDashboard() {
  const { session } = useAuth();
  const token = session?.role === "owner" ? session.tokens.accessToken : "";
  const [data,setData]=useState<OwnerDashboard|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const refresh=useCallback(async()=>{if(!token)return;setLoading(true);setError("");try{setData(await getProtectedOwnerDashboard(token))}catch(caught){setError(caught instanceof Error?caught.message:"Unable to load owner dashboard.")}finally{setLoading(false)}},[token]);
  useEffect(()=>{void refresh()},[refresh]);
  return { token, data, loading, error, refresh };
}
