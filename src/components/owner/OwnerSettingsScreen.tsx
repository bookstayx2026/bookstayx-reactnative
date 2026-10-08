import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import {
  Settings,
  User,
  Building,
  Phone,
  Mail,
  Bell,
  Shield,
  Clock,
  Save,
  CheckCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react-native";
import {
  getOwnerSettings,
  saveOwnerSettings,
  OwnerSettingsData,
} from "../../services/api/owner-modules";

export const OwnerSettingsScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form State
  const [ownerDisplayName, setOwnerDisplayName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [primaryMobile, setPrimaryMobile] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [email, setEmail] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [autoAcceptRequests, setAutoAcceptRequests] = useState(false);
  const [smsAlertsEnabled, setSmsAlertsEnabled] = useState(true);
  const [whatsappAlertsEnabled, setWhatsappAlertsEnabled] = useState(true);
  const [checkInNoticeHours, setCheckInNoticeHours] = useState("24");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getOwnerSettings();
      setOwnerDisplayName(data.ownerDisplayName || "");
      setBusinessName(data.businessName || "");
      setPrimaryMobile(data.primaryMobile || "");
      setWhatsappNumber(data.whatsappNumber || "");
      setEmail(data.email || "");
      setEmergencyContact(data.emergencyContact || "");
      setAutoAcceptRequests(!!data.autoAcceptRequests);
      setSmsAlertsEnabled(!!data.smsAlertsEnabled);
      setWhatsappAlertsEnabled(!!data.whatsappAlertsEnabled);
      setCheckInNoticeHours(data.checkInNoticeHours?.toString() || "24");
    } catch (err) {
      console.error("Failed to load owner settings", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await saveOwnerSettings({
        ownerDisplayName,
        businessName,
        primaryMobile,
        whatsappNumber,
        email,
        emergencyContact,
        autoAcceptRequests,
        smsAlertsEnabled,
        whatsappAlertsEnabled,
        checkInNoticeHours: parseInt(checkInNoticeHours, 10) || 24,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      if (Platform.OS !== "web") {
        Alert.alert("Settings Saved", "Your owner preferences have been saved successfully.");
      }
    } catch (err) {
      console.error("Failed to save owner settings:", err);
      Alert.alert("Error", "Could not save preferences.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E0B84A" />
        <Text style={styles.loadingText}>Loading owner configuration...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Owner Settings & Configuration</Text>
          <Text style={styles.headerSubtitle}>
            Manage operating preferences, automated booking rules, and verified contact channels
          </Text>
        </View>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <>
              <Save size={16} color="#000" />
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Success Banner */}
      {savedSuccess && (
        <View style={styles.successBanner}>
          <CheckCircle size={16} color="#34D399" />
          <Text style={styles.successText}>Configuration saved successfully!</Text>
        </View>
      )}

      {/* Profile & Business Details */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <User size={18} color="#E0B84A" />
          <Text style={styles.sectionTitle}>Owner Profile & Hospitality Entity</Text>
        </View>

        <View style={styles.formRow}>
          <View style={styles.formCol}>
            <Text style={styles.formLabel}>Owner / Manager Full Name</Text>
            <TextInput
              style={styles.formInput}
              value={ownerDisplayName}
              onChangeText={setOwnerDisplayName}
              placeholder="e.g. Sujay Patil"
              placeholderTextColor="#718096"
            />
          </View>
          <View style={styles.formCol}>
            <Text style={styles.formLabel}>Business / Brand Name</Text>
            <TextInput
              style={styles.formInput}
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="e.g. Pawna Haven Retreats"
              placeholderTextColor="#718096"
            />
          </View>
        </View>

        <View style={styles.formRow}>
          <View style={styles.formCol}>
            <Text style={styles.formLabel}>Emergency Caretaker Contact</Text>
            <TextInput
              style={styles.formInput}
              value={emergencyContact}
              onChangeText={setEmergencyContact}
              placeholder="+91 94xxx xxxxx"
              placeholderTextColor="#718096"
            />
          </View>
          <View style={styles.formCol}>
            <Text style={styles.formLabel}>Official Notification Email</Text>
            <TextInput
              style={styles.formInput}
              value={email}
              onChangeText={setEmail}
              placeholder="owner@domain.com"
              placeholderTextColor="#718096"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>
      </View>

      {/* Contact & Guest Channels */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Phone size={18} color="#38BDF8" />
          <Text style={styles.sectionTitle}>Direct Guest Communication Channels</Text>
        </View>

        <View style={styles.formRow}>
          <View style={styles.formCol}>
            <Text style={styles.formLabel}>Primary Calling Number</Text>
            <TextInput
              style={styles.formInput}
              value={primaryMobile}
              onChangeText={setPrimaryMobile}
              placeholder="+91 88060 92609"
              placeholderTextColor="#718096"
            />
          </View>
          <View style={styles.formCol}>
            <Text style={styles.formLabel}>WhatsApp Business Number</Text>
            <TextInput
              style={styles.formInput}
              value={whatsappNumber}
              onChangeText={setWhatsappNumber}
              placeholder="+91 88060 92609"
              placeholderTextColor="#718096"
            />
          </View>
        </View>
      </View>

      {/* Operational Automation */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Clock size={18} color="#A78BFA" />
          <Text style={styles.sectionTitle}>Booking & Operational Automation</Text>
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleTextWrap}>
            <Text style={styles.toggleTitle}>Instant Booking Confirmation</Text>
            <Text style={styles.toggleSub}>
              Automatically accept website requests if calendar cells are unblocked
            </Text>
          </View>
          <Switch
            value={autoAcceptRequests}
            onValueChange={setAutoAcceptRequests}
            trackColor={{ false: "#1E2633", true: "#E0B84A" }}
            thumbColor="#FFF"
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.toggleRow}>
          <View style={styles.toggleTextWrap}>
            <Text style={styles.toggleTitle}>WhatsApp Instant Booking Alerts</Text>
            <Text style={styles.toggleSub}>
              Send owner and guest instant booking confirmations via WhatsApp Bot
            </Text>
          </View>
          <Switch
            value={whatsappAlertsEnabled}
            onValueChange={setWhatsappAlertsEnabled}
            trackColor={{ false: "#1E2633", true: "#34D399" }}
            thumbColor="#FFF"
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.toggleRow}>
          <View style={styles.toggleTextWrap}>
            <Text style={styles.toggleTitle}>SMS Notification Gateway</Text>
            <Text style={styles.toggleSub}>
              Dispatch critical payment credits & check-in OTPs via SMS
            </Text>
          </View>
          <Switch
            value={smsAlertsEnabled}
            onValueChange={setSmsAlertsEnabled}
            trackColor={{ false: "#1E2633", true: "#38BDF8" }}
            thumbColor="#FFF"
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.formRow}>
          <View style={styles.formCol}>
            <Text style={styles.formLabel}>Minimum Check-In Notice (Hours)</Text>
            <TextInput
              style={styles.formInput}
              value={checkInNoticeHours}
              onChangeText={setCheckInNoticeHours}
              keyboardType="numeric"
              placeholder="e.g. 24"
              placeholderTextColor="#718096"
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#07080A",
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#07080A",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    color: "#A0AEC0",
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    flexWrap: "wrap",
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFF",
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#94A3B8",
    marginTop: 4,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0B84A",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  saveBtnText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 13,
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(52, 211, 153, 0.15)",
    borderWidth: 1,
    borderColor: "#34D399",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  successText: {
    color: "#34D399",
    fontSize: 13,
    fontWeight: "600",
  },
  sectionCard: {
    backgroundColor: "#0D1117",
    borderWidth: 1,
    borderColor: "#1E2633",
    borderRadius: 12,
    padding: 18,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
  },
  formRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  formCol: {
    flex: 1,
    minWidth: 220,
  },
  formLabel: {
    color: "#A0AEC0",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: "#161D27",
    borderWidth: 1,
    borderColor: "#1E2633",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#FFF",
    fontSize: 13,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    gap: 16,
  },
  toggleTextWrap: {
    flex: 1,
  },
  toggleTitle: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  toggleSub: {
    color: "#718096",
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#161D27",
    marginVertical: 4,
  },
});
