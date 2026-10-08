import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  DollarSign,
  Plus,
  RefreshCw,
  Search,
  Phone,
  Building,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  CreditCard,
  Edit2,
  Trash2,
  X,
  Check,
  ChevronRight,
  ShieldCheck,
} from "lucide-react-native";
import {
  getOwnerStaffList,
  saveOwnerStaffMember,
  deleteOwnerStaffMember,
  getStaffAttendanceRecords,
  markStaffAttendance,
  getStaffPaymentRecords,
  saveStaffPaymentRecord,
  getOwnerUnits,
  StaffMember,
  StaffRole,
  AttendanceStatus,
  StaffPaymentRecord,
  StaffAttendanceRecord,
} from "../../services/api/owner-modules";
import { OwnerUnit } from "../../services/api/owner";


const ROLES: StaffRole[] = [
  "Housekeeper",
  "Cleaner",
  "Caretaker",
  "Cook",
  "Manager",
  "Security",
  "Other",
];

const ATTENDANCE_STATUSES: AttendanceStatus[] = [
  "Present",
  "Absent",
  "Leave",
  "Half Day",
];

export const OwnerStaffScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"directory" | "attendance" | "payroll">("directory");

  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [attendance, setAttendance] = useState<StaffAttendanceRecord[]>([]);
  const [payments, setPayments] = useState<StaffPaymentRecord[]>([]);
  const [units, setUnits] = useState<OwnerUnit[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  // Modals
  const [staffModalVisible, setStaffModalVisible] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [formName, setFormName] = useState("");
  const [formRole, setFormRole] = useState<StaffRole>("Housekeeper");
  const [formMobile, setFormMobile] = useState("");
  const [formVilla, setFormVilla] = useState("");
  const [formSalary, setFormSalary] = useState("");
  const [savingStaff, setSavingStaff] = useState(false);

  // Pay Modal
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [selectedStaffForPay, setSelectedStaffForPay] = useState<StaffMember | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [savingPay, setSavingPay] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [sData, aData, pData, uData] = await Promise.all([
        getOwnerStaffList(),
        getStaffAttendanceRecords(),
        getStaffPaymentRecords(),
        getOwnerUnits(),
      ]);
      setStaffList(sData);
      setAttendance(aData);
      setPayments(pData);
      setUnits(uData);
    } catch (err) {
      console.error("Failed to load staff data", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalStaff = staffList.length;
    const activeStaff = staffList.filter((s) => s.isActive).length;
    const totalMonthlyPayroll = staffList.reduce((sum, s) => sum + (s.monthlySalary || 0), 0);

    const todayRecords = attendance.filter((r) => r.date === selectedDate);
    const presentToday = todayRecords.filter((r) => r.status === "Present" || r.status === "Half Day").length;
    const absentToday = todayRecords.filter((r) => r.status === "Absent").length;

    const totalPaidSalary = payments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
    const totalPendingSalary = payments.reduce((sum, p) => sum + (p.pendingAmount || 0), 0);

    return {
      totalStaff,
      activeStaff,
      totalMonthlyPayroll,
      presentToday,
      absentToday,
      totalPaidSalary,
      totalPendingSalary,
    };
  }, [staffList, attendance, payments, selectedDate]);

  // Filtered Staff
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      return (
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.role.toLowerCase().includes(q) ||
        s.mobile.includes(q) ||
        (s.assignedVilla && s.assignedVilla.toLowerCase().includes(q))
      );
    });
  }, [staffList, searchQuery]);

  const openAddStaffModal = () => {
    setEditingStaff(null);
    setFormName("");
    setFormRole("Housekeeper");
    setFormMobile("");
    setFormVilla(units[0]?.name || "All Units");
    setFormSalary("");
    setStaffModalVisible(true);
  };

  const openEditStaffModal = (item: StaffMember) => {
    setEditingStaff(item);
    setFormName(item.name);
    setFormRole(item.role);
    setFormMobile(item.mobile);
    setFormVilla(item.assignedVilla || "All Units");
    setFormSalary(item.monthlySalary.toString());
    setStaffModalVisible(true);
  };

  const handleSaveStaff = async () => {
    if (!formName.trim()) {
      Alert.alert("Missing Name", "Please enter staff name.");
      return;
    }
    const parsedSal = parseFloat(formSalary) || 0;

    try {
      setSavingStaff(true);
      await saveOwnerStaffMember({
        id: editingStaff?.id,
        name: formName.trim(),
        role: formRole,
        mobile: formMobile.trim(),
        assignedVilla: formVilla.trim(),
        isActive: editingStaff ? editingStaff.isActive : true,
        monthlySalary: parsedSal,
        joiningDate: (editingStaff ? editingStaff.joiningDate : new Date().toISOString().split("T")[0]) || "2026-09-25",
      });
      setStaffModalVisible(false);
      await loadData();
    } catch (err) {
      console.error("Error saving staff:", err);
    } finally {
      setSavingStaff(false);
    }
  };

  const handleDeleteStaff = (item: StaffMember) => {
    const doDelete = async () => {
      try {
        await deleteOwnerStaffMember(item.id);
        await loadData();
      } catch (err) {
        console.error("Error deleting staff:", err);
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm(`Remove staff member ${item.name}?`)) {
        doDelete();
      }
    } else {
      Alert.alert("Remove Staff", `Are you sure you want to remove ${item.name}?`, [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: doDelete },
      ]);
    }
  };

  const handleToggleAttendance = async (staffId: string, status: AttendanceStatus) => {
    try {
      await markStaffAttendance({
        date: selectedDate || new Date().toISOString().split("T")[0] || "2026-09-25",
        staffId,
        status,
      });

      const updated = await getStaffAttendanceRecords();
      setAttendance(updated);
    } catch (err) {
      console.error("Error updating attendance:", err);
    }
  };

  const openPayModal = (staff: StaffMember) => {
    setSelectedStaffForPay(staff);
    const existing = payments.find((p) => p.staffId === staff.id);
    if (existing) {
      setPayAmount(existing.amountPaid.toString());
      setPayNotes(existing.notes || "");
    } else {
      setPayAmount(staff.monthlySalary.toString());
      setPayNotes("Monthly salary disbursement");
    }
    setPayModalVisible(true);
  };

  const handleSavePayment = async () => {
    if (!selectedStaffForPay) return;
    const paid = parseFloat(payAmount) || 0;
    const expected = selectedStaffForPay.monthlySalary;
    const pending = Math.max(0, expected - paid);
    const status = paid >= expected ? "Paid" : paid > 0 ? "Partial" : "Pending";

    try {
      setSavingPay(true);
      await saveStaffPaymentRecord({
        staffId: selectedStaffForPay.id,
        period: `${new Date().toLocaleString("default", { month: "long" })} ${new Date().getFullYear()}`,
        expectedPay: expected,
        amountPaid: paid,
        pendingAmount: pending,
        paymentDate: new Date().toISOString().split("T")[0],
        paymentStatus: status,
        notes: payNotes,
      });
      setPayModalVisible(false);
      await loadData();
    } catch (err) {
      console.error("Error saving payment:", err);
    } finally {
      setSavingPay(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E0B84A" />
        <Text style={styles.loadingText}>Loading staff directory & rosters...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Housekeeping & Staff</Text>
          <Text style={styles.headerSubtitle}>
            Manage caretakers, cleaners, daily rosters, and monthly wage disbursements
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh} disabled={refreshing}>
            <RefreshCw size={16} color="#A0AEC0" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={openAddStaffModal}>
            <Plus size={16} color="#000" />
            <Text style={styles.addButtonText}>Add Staff</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Metrics Row */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <View style={styles.metricIconWrap}>
            <Users size={20} color="#38BDF8" />
          </View>
          <Text style={styles.metricLabel}>Total Staff Count</Text>
          <Text style={styles.metricValue}>{metrics.totalStaff} Members</Text>
          <Text style={styles.metricSub}>{metrics.activeStaff} currently active</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricIconWrap}>
            <UserCheck size={20} color="#34D399" />
          </View>
          <Text style={styles.metricLabel}>Today's Attendance</Text>
          <Text style={[styles.metricValue, { color: "#34D399" }]}>
            {metrics.presentToday} Present
          </Text>
          <Text style={styles.metricSub}>{metrics.absentToday} marked absent / leave</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricIconWrap}>
            <DollarSign size={20} color="#E0B84A" />
          </View>
          <Text style={styles.metricLabel}>Monthly Payroll Obligation</Text>
          <Text style={[styles.metricValue, { color: "#E0B84A" }]}>
            ₹{metrics.totalMonthlyPayroll.toLocaleString("en-IN")}
          </Text>
          <Text style={styles.metricSub}>Combined salaries</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricIconWrap}>
            <CreditCard size={20} color="#A78BFA" />
          </View>
          <Text style={styles.metricLabel}>Disbursed This Month</Text>
          <Text style={styles.metricValue}>
            ₹{metrics.totalPaidSalary.toLocaleString("en-IN")}
          </Text>
          <Text style={styles.metricSub}>
            ₹{metrics.totalPendingSalary.toLocaleString("en-IN")} pending
          </Text>
        </View>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "directory" && styles.tabBtnActive]}
          onPress={() => setActiveTab("directory")}
        >
          <Users size={16} color={activeTab === "directory" ? "#E0B84A" : "#94A3B8"} />
          <Text style={[styles.tabBtnText, activeTab === "directory" && styles.tabBtnTextActive]}>
            Staff Directory ({staffList.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "attendance" && styles.tabBtnActive]}
          onPress={() => setActiveTab("attendance")}
        >
          <Calendar size={16} color={activeTab === "attendance" ? "#E0B84A" : "#94A3B8"} />
          <Text style={[styles.tabBtnText, activeTab === "attendance" && styles.tabBtnTextActive]}>
            Daily Roster & Attendance
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "payroll" && styles.tabBtnActive]}
          onPress={() => setActiveTab("payroll")}
        >
          <DollarSign size={16} color={activeTab === "payroll" ? "#E0B84A" : "#94A3B8"} />
          <Text style={[styles.tabBtnText, activeTab === "payroll" && styles.tabBtnTextActive]}>
            Payroll & Wage Log
          </Text>
        </TouchableOpacity>
      </View>

      {/* TAB 1: DIRECTORY */}
      {activeTab === "directory" && (
        <View style={styles.tabContent}>
          <View style={styles.searchBox}>
            <Search size={16} color="#718096" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search staff by name, role, villa, phone..."
              placeholderTextColor="#718096"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <X size={16} color="#718096" />
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.staffGrid}>
            {filteredStaff.map((staff) => (
              <View key={staff.id} style={styles.staffCard}>
                <View style={styles.staffCardHeader}>
                  <View style={styles.staffAvatar}>
                    <Text style={styles.staffAvatarText}>
                      {staff.name.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.staffInfo}>
                    <Text style={styles.staffName}>{staff.name}</Text>
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleBadgeText}>{staff.role}</Text>
                    </View>
                  </View>
                  <View style={styles.staffCardActions}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => openEditStaffModal(staff)}>
                      <Edit2 size={13} color="#A0AEC0" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.deleteBtn]}
                      onPress={() => handleDeleteStaff(staff)}
                    >
                      <Trash2 size={13} color="#F87171" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.staffDivider} />

                <View style={styles.staffDetailRow}>
                  <Phone size={13} color="#718096" />
                  <Text style={styles.staffDetailText}>{staff.mobile || "No phone provided"}</Text>
                </View>
                <View style={styles.staffDetailRow}>
                  <Building size={13} color="#718096" />
                  <Text style={styles.staffDetailText}>
                    Assigned: {staff.assignedVilla || "All Units"}
                  </Text>
                </View>
                <View style={styles.staffDetailRow}>
                  <DollarSign size={13} color="#718096" />
                  <Text style={styles.staffDetailText}>
                    Salary: ₹{staff.monthlySalary.toLocaleString("en-IN")}/mo
                  </Text>
                </View>

                <View style={styles.staffCardFooter}>
                  <TouchableOpacity
                    style={styles.payQuickBtn}
                    onPress={() => openPayModal(staff)}
                  >
                    <CreditCard size={13} color="#000" />
                    <Text style={styles.payQuickBtnText}>Record Salary</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* TAB 2: DAILY ATTENDANCE */}
      {activeTab === "attendance" && (
        <View style={styles.tabContent}>
          <View style={styles.dateSelectorRow}>
            <View style={styles.dateInfoWrap}>
              <Calendar size={18} color="#E0B84A" />
              <Text style={styles.dateSelectorText}>
                Roster for {new Date(selectedDate || Date.now()).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </Text>
            </View>
            <View style={styles.quickDateBtns}>
              <TouchableOpacity
                style={[styles.quickDateBtn, selectedDate === (new Date().toISOString().split("T")[0] || "") && styles.quickDateBtnActive]}
                onPress={() => setSelectedDate(new Date().toISOString().split("T")[0] || "")}
              >
                <Text style={[styles.quickDateBtnText, selectedDate === (new Date().toISOString().split("T")[0] || "") && styles.quickDateBtnTextActive]}>
                  Today
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickDateBtn, selectedDate === (new Date(Date.now() - 86400000).toISOString().split("T")[0] || "") && styles.quickDateBtnActive]}
                onPress={() => setSelectedDate(new Date(Date.now() - 86400000).toISOString().split("T")[0] || "")}
              >
                <Text style={[styles.quickDateBtnText, selectedDate === (new Date(Date.now() - 86400000).toISOString().split("T")[0] || "") && styles.quickDateBtnTextActive]}>
                  Yesterday
                </Text>
              </TouchableOpacity>

            </View>
          </View>

          <View style={styles.attendanceTable}>
            {staffList.map((staff) => {
              const currentRec = attendance.find(
                (r) => r.staffId === staff.id && r.date === selectedDate
              );
              const currentStatus = currentRec?.status;

              return (
                <View key={staff.id} style={styles.attendanceRow}>
                  <View style={styles.attStaffLeft}>
                    <Text style={styles.attStaffName}>{staff.name}</Text>
                    <Text style={styles.attStaffRole}>
                      {staff.role} • {staff.assignedVilla || "General"}
                    </Text>
                  </View>

                  <View style={styles.attButtonsRow}>
                    {ATTENDANCE_STATUSES.map((st) => {
                      const isSel = currentStatus === st;
                      let activeStyle = styles.attBtnPresent;
                      if (st === "Absent") activeStyle = styles.attBtnAbsent;
                      if (st === "Leave") activeStyle = styles.attBtnLeave;
                      if (st === "Half Day") activeStyle = styles.attBtnHalf;

                      return (
                        <TouchableOpacity
                          key={st}
                          style={[styles.attBtn, isSel && activeStyle]}
                          onPress={() => handleToggleAttendance(staff.id, st)}
                        >
                          <Text
                            style={[
                              styles.attBtnText,
                              isSel && styles.attBtnTextActive,
                            ]}
                          >
                            {st}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* TAB 3: PAYROLL */}
      {activeTab === "payroll" && (
        <View style={styles.tabContent}>
          <View style={styles.payrollTable}>
            <View style={styles.payrollHeaderRow}>
              <Text style={[styles.payrollHeadCol, { flex: 2 }]}>Staff Member</Text>
              <Text style={[styles.payrollHeadCol, { flex: 1 }]}>Monthly Salary</Text>
              <Text style={[styles.payrollHeadCol, { flex: 1 }]}>Disbursed</Text>
              <Text style={[styles.payrollHeadCol, { flex: 1 }]}>Pending</Text>
              <Text style={[styles.payrollHeadCol, { flex: 1.2 }]}>Action</Text>
            </View>

            {staffList.map((staff) => {
              const pay = payments.find((p) => p.staffId === staff.id);
              const paid = pay ? pay.amountPaid : 0;
              const pending = Math.max(0, staff.monthlySalary - paid);
              const isFull = paid >= staff.monthlySalary;

              return (
                <View key={staff.id} style={styles.payrollItemRow}>
                  <View style={{ flex: 2 }}>
                    <Text style={styles.payrollStaffName}>{staff.name}</Text>
                    <Text style={styles.payrollStaffRole}>{staff.role}</Text>
                  </View>
                  <Text style={[styles.payrollCell, { flex: 1 }]}>
                    ₹{staff.monthlySalary.toLocaleString("en-IN")}
                  </Text>
                  <Text style={[styles.payrollCell, { flex: 1, color: "#34D399" }]}>
                    ₹{paid.toLocaleString("en-IN")}
                  </Text>
                  <Text
                    style={[
                      styles.payrollCell,
                      { flex: 1, color: pending > 0 ? "#F87171" : "#94A3B8" },
                    ]}
                  >
                    ₹{pending.toLocaleString("en-IN")}
                  </Text>
                  <View style={{ flex: 1.2, alignItems: "flex-start" }}>
                    <TouchableOpacity
                      style={[
                        styles.payActionBtn,
                        isFull && styles.payActionBtnFull,
                      ]}
                      onPress={() => openPayModal(staff)}
                    >
                      <Text style={[styles.payActionBtnText, isFull && { color: "#34D399" }]}>
                        {isFull ? "Paid ✓" : "Pay Salary"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Add / Edit Staff Modal */}
      <Modal visible={staffModalVisible} transparent animationType="fade" onRequestClose={() => setStaffModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingStaff ? "Edit Staff Details" : "Add New Staff Member"}
              </Text>
              <TouchableOpacity onPress={() => setStaffModalVisible(false)}>
                <X size={18} color="#A0AEC0" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.formLabel}>Staff Full Name *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Ramesh Kumar"
                placeholderTextColor="#718096"
                value={formName}
                onChangeText={setFormName}
              />

              <Text style={styles.formLabel}>Role / Designation *</Text>
              <View style={styles.roleGrid}>
                {ROLES.map((r) => {
                  const isSel = formRole === r;
                  return (
                    <TouchableOpacity
                      key={r}
                      style={[styles.roleChoice, isSel && styles.roleChoiceActive]}
                      onPress={() => setFormRole(r)}
                    >
                      <Text style={[styles.roleChoiceText, isSel && styles.roleChoiceTextActive]}>
                        {r}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>Mobile Number</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="+91 98xxx xxxxx"
                    placeholderTextColor="#718096"
                    value={formMobile}
                    onChangeText={setFormMobile}
                  />
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>Monthly Salary (₹)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. 15000"
                    placeholderTextColor="#718096"
                    keyboardType="numeric"
                    value={formSalary}
                    onChangeText={setFormSalary}
                  />
                </View>
              </View>

              <Text style={styles.formLabel}>Assigned Property / Villa Unit</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Lakeview Villa Main or All Units"
                placeholderTextColor="#718096"
                value={formVilla}
                onChangeText={setFormVilla}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setStaffModalVisible(false)}
                disabled={savingStaff}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSaveStaff}
                disabled={savingStaff}
              >
                {savingStaff ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <>
                    <Check size={16} color="#000" />
                    <Text style={styles.submitBtnText}>
                      {editingStaff ? "Update Staff" : "Save Staff"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Pay Salary Modal */}
      <Modal visible={payModalVisible} transparent animationType="fade" onRequestClose={() => setPayModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Disburse Monthly Wage</Text>
              <TouchableOpacity onPress={() => setPayModalVisible(false)}>
                <X size={18} color="#A0AEC0" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {selectedStaffForPay && (
                <View style={styles.payTargetCard}>
                  <Text style={styles.payTargetName}>{selectedStaffForPay.name}</Text>
                  <Text style={styles.payTargetSub}>
                    {selectedStaffForPay.role} • Standard Monthly Salary: ₹
                    {selectedStaffForPay.monthlySalary.toLocaleString("en-IN")}
                  </Text>
                </View>
              )}

              <Text style={styles.formLabel}>Amount to Disburse (₹) *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter payment amount"
                placeholderTextColor="#718096"
                keyboardType="numeric"
                value={payAmount}
                onChangeText={setPayAmount}
              />

              <Text style={styles.formLabel}>Payment Notes / Transaction ID</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. GPay UPI Ref 928374 or Cash advance"
                placeholderTextColor="#718096"
                value={payNotes}
                onChangeText={setPayNotes}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setPayModalVisible(false)}
                disabled={savingPay}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSavePayment}
                disabled={savingPay}
              >
                {savingPay ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <>
                    <Check size={16} color="#000" />
                    <Text style={styles.submitBtnText}>Record Wage Paid</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  refreshButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: "#10141B",
    borderWidth: 1,
    borderColor: "#1E2633",
    justifyContent: "center",
    alignItems: "center",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0B84A",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 13,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: "#0D1117",
    borderWidth: 1,
    borderColor: "#1E2633",
    borderRadius: 12,
    padding: 16,
  },
  metricIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#161D27",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  metricLabel: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  metricValue: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  metricSub: {
    color: "#64748B",
    fontSize: 11,
  },
  tabsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1E2633",
    paddingBottom: 8,
    flexWrap: "wrap",
  },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#0D1117",
    borderWidth: 1,
    borderColor: "#1E2633",
  },
  tabBtnActive: {
    borderColor: "#E0B84A",
    backgroundColor: "rgba(224, 184, 74, 0.12)",
  },
  tabBtnText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
  },
  tabBtnTextActive: {
    color: "#E0B84A",
  },
  tabContent: {
    marginTop: 4,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0D1117",
    borderWidth: 1,
    borderColor: "#1E2633",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    color: "#FFF",
    fontSize: 13,
  },
  staffGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  staffCard: {
    flex: 1,
    minWidth: 280,
    backgroundColor: "#0D1117",
    borderWidth: 1,
    borderColor: "#1E2633",
    borderRadius: 12,
    padding: 16,
  },
  staffCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  staffAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#1E2633",
    justifyContent: "center",
    alignItems: "center",
  },
  staffAvatarText: {
    color: "#E0B84A",
    fontWeight: "700",
    fontSize: 14,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
  },
  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#161D27",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  roleBadgeText: {
    color: "#A0AEC0",
    fontSize: 10,
    fontWeight: "600",
  },
  staffCardActions: {
    flexDirection: "row",
    gap: 4,
  },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#161D27",
    borderWidth: 1,
    borderColor: "#1E2633",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteBtn: {
    borderColor: "rgba(248, 113, 113, 0.3)",
    backgroundColor: "rgba(248, 113, 113, 0.08)",
  },
  staffDivider: {
    height: 1,
    backgroundColor: "#1E2633",
    marginVertical: 12,
  },
  staffDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  staffDetailText: {
    color: "#94A3B8",
    fontSize: 12,
  },
  staffCardFooter: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#161D27",
  },
  payQuickBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#E0B84A",
    paddingVertical: 8,
    borderRadius: 6,
  },
  payQuickBtnText: {
    color: "#000",
    fontSize: 11,
    fontWeight: "700",
  },
  dateSelectorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#0D1117",
    borderWidth: 1,
    borderColor: "#1E2633",
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    flexWrap: "wrap",
    gap: 10,
  },
  dateInfoWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dateSelectorText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  quickDateBtns: {
    flexDirection: "row",
    gap: 8,
  },
  quickDateBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#161D27",
  },
  quickDateBtnActive: {
    backgroundColor: "#E0B84A",
  },
  quickDateBtnText: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "600",
  },
  quickDateBtnTextActive: {
    color: "#000",
  },
  attendanceTable: {
    backgroundColor: "#0D1117",
    borderWidth: 1,
    borderColor: "#1E2633",
    borderRadius: 12,
    overflow: "hidden",
  },
  attendanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#141A23",
    flexWrap: "wrap",
    gap: 12,
  },
  attStaffLeft: {
    minWidth: 180,
  },
  attStaffName: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
  attStaffRole: {
    color: "#718096",
    fontSize: 11,
    marginTop: 2,
  },
  attButtonsRow: {
    flexDirection: "row",
    gap: 6,
  },
  attBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#161D27",
    borderWidth: 1,
    borderColor: "#1E2633",
  },
  attBtnPresent: {
    borderColor: "#34D399",
    backgroundColor: "rgba(52, 211, 153, 0.15)",
  },
  attBtnAbsent: {
    borderColor: "#F87171",
    backgroundColor: "rgba(248, 113, 113, 0.15)",
  },
  attBtnLeave: {
    borderColor: "#FBBF24",
    backgroundColor: "rgba(251, 191, 36, 0.15)",
  },
  attBtnHalf: {
    borderColor: "#38BDF8",
    backgroundColor: "rgba(56, 189, 248, 0.15)",
  },
  attBtnText: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "600",
  },
  attBtnTextActive: {
    color: "#FFF",
    fontWeight: "700",
  },
  payrollTable: {
    backgroundColor: "#0D1117",
    borderWidth: 1,
    borderColor: "#1E2633",
    borderRadius: 12,
    overflow: "hidden",
  },
  payrollHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#161D27",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1E2633",
  },
  payrollHeadCol: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
  },
  payrollItemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#141A23",
  },
  payrollStaffName: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
  },
  payrollStaffRole: {
    color: "#718096",
    fontSize: 11,
  },
  payrollCell: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "600",
  },
  payActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#E0B84A",
  },
  payActionBtnFull: {
    backgroundColor: "rgba(52, 211, 153, 0.15)",
    borderWidth: 1,
    borderColor: "#34D399",
  },
  payActionBtnText: {
    color: "#000",
    fontSize: 11,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: "#0D1117",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1E2633",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1E2633",
  },
  modalTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  modalBody: {
    padding: 18,
  },
  formLabel: {
    color: "#A0AEC0",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 10,
  },
  formInput: {
    backgroundColor: "#161D27",
    borderWidth: 1,
    borderColor: "#1E2633",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: "#FFF",
    fontSize: 13,
  },
  roleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  roleChoice: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#161D27",
    borderWidth: 1,
    borderColor: "#1E2633",
  },
  roleChoiceActive: {
    borderColor: "#E0B84A",
    backgroundColor: "rgba(224, 184, 74, 0.15)",
  },
  roleChoiceText: {
    color: "#94A3B8",
    fontSize: 11,
  },
  roleChoiceTextActive: {
    color: "#FFF",
    fontWeight: "700",
  },
  formRow: {
    flexDirection: "row",
    gap: 12,
  },
  formCol: {
    flex: 1,
  },
  payTargetCard: {
    backgroundColor: "#161D27",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1E2633",
    marginBottom: 10,
  },
  payTargetName: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
  payTargetSub: {
    color: "#A0AEC0",
    fontSize: 12,
    marginTop: 2,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#1E2633",
    backgroundColor: "#090C10",
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#1E2633",
  },
  cancelBtnText: {
    color: "#A0AEC0",
    fontSize: 12,
    fontWeight: "600",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0B84A",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  submitBtnText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "700",
  },
});
