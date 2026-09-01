import { apiRequest } from "./client";
export type OwnerIdentity = { id: number; property_id?: string; propertyName?: string; owner_name?: string; ownerNumber?: string };
export type AuthTokens = { accessToken: string; refreshToken: string };
export async function sendOwnerOtp(mobileNumber: string) { return apiRequest<{ success: true; message: string; otpLimitLeft?: number | null }>("/api/owners/send-otp", { method: "POST", body: { mobileNumber } }); }
export async function verifyOwnerOtp(mobileNumber: string, otp: string) { const result = await apiRequest<{ success: true; token: string; refreshToken: string; data: OwnerIdentity }>("/api/owners/verify-otp", { method: "POST", body: { mobileNumber, otp } }); return { tokens: { accessToken: result.token, refreshToken: result.refreshToken }, identity: result.data }; }
export async function adminLogin(email: string, password: string) { return apiRequest<{ success: true; requiresTOTP?: boolean; tempToken?: string; data?: { token: string; refreshToken: string; admin: { id: number; email: string } } }>("/api/auth/login", { method: "POST", body: { email, password } }); }
export async function verifyAdminTotp(tempToken: string, code: string) { return apiRequest<{ success: true; data: { token: string; refreshToken: string; admin: { id: number; email: string } } }>("/api/auth/verify-totp", { method: "POST", body: { tempToken, code } }); }
export async function revokeSession(refreshToken: string) { return apiRequest<{ success: true }>("/api/auth/logout", { method: "POST", body: { refreshToken } }); }
export async function verifyOwnerSession(accessToken: string) { return apiRequest<{ valid: boolean; code?: string }>("/api/owners/verify-session", { headers: { Authorization: `Bearer ${accessToken}` } }); }
export async function refreshSession(refreshToken: string) { return apiRequest<{ success: true; accessToken: string; refreshToken: string }>("/api/auth/refresh", { method: "POST", body: { refreshToken } }); }
