import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { adminPaths } from "@/lib/adminPaths";
import { ChevronLeft, Phone, Loader2, Trash2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import PaginationBar from "@/components/ui/PaginationBar";

const PAGE_SIZE = 10;

const AdminContactsPage = () => {
  const [contacts, setContacts] = useState({
    owners: [],
    b2b: [],
    owners_b2b: [],
    referrals: [],
  });
  const [customers, setCustomers] = useState<
    { id: string; username: string; referral_otp_number: string }[]
  >([]);
  const [customersLoading, setCustomersLoading] = useState(true);

  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any | null>(null);

  const [pages, setPages] = useState<Record<string, number>>({
    owners: 1,
    b2b: 1,
    owners_b2b: 1,
    referrals: 1,
    customers: 1,
  });

  const token = localStorage.getItem("adminToken");

  const fetchContacts = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/referrals/admin/contacts", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        setLoading(false);
        return;
      }

      const data: any[] = await res.json();

      setContacts({
        owners: data.filter((u) => u.referral_type === "owner"),
        b2b: data.filter((u) => u.referral_type === "b2b"),
        owners_b2b: data.filter((u) => u.referral_type === "owners_b2b"),
        referrals: data.filter(
          (u) => u.referral_type === "public" || !u.referral_type,
        ),
      });
    } catch (e) {
      console.error("Failed to load contacts", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    if (!token) {
      setCustomersLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/payments/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setCustomersLoading(false);
        return;
      }
      const json = await res.json();
      const data: any[] = Array.isArray(json)
        ? json
        : json.bookings || json.data || [];
      const seen = new Set<string>();
      const unique: {
        id: string;
        username: string;
        referral_otp_number: string;
      }[] = [];
      for (const b of data) {
        const phone = (b.guest_phone || b.customer_mobile || "")
          .replace(/\D/g, "")
          .slice(-10);
        if (!phone || seen.has(phone)) continue;
        seen.add(phone);
        unique.push({
          id: phone,
          username: b.guest_name || b.customer_name || "Guest",
          referral_otp_number: phone,
        });
      }
      setCustomers(unique);
    } catch (e) {
      console.error("Failed to load customers", e);
    } finally {
      setCustomersLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
    fetchCustomers();
  }, []);

  const handleHardDelete = async () => {
    if (!deleteConfirm) return;

    setDeletingId(deleteConfirm.id);

    try {
      const res = await fetch("/api/referrals/admin/hard-delete-contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: deleteConfirm.id }),
      });

      if (!res.ok) throw new Error("Delete failed");

      toast.success(`${deleteConfirm.name} permanently deleted`);

      await fetchContacts();
    } catch (e) {
      toast.error("Failed to delete contact");
    } finally {
      setDeletingId(null);
      setDeleteConfirm(null);
    }
  };

  const renderList = (items: any[], tabKey: string, showOwner?: boolean) => {
    if (loading) {
      return (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-gold" />
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="text-center py-10 text-white/30 text-sm">
          No contacts found
        </div>
      );
    }

    const currentPage = pages[tabKey] || 1;
    const totalPages = Math.ceil(items.length / PAGE_SIZE);
    const paginated = items.slice(
      (currentPage - 1) * PAGE_SIZE,
      currentPage * PAGE_SIZE,
    );

    return (
      <div className="space-y-2 mt-4">
        {paginated.map((c, i) => (
          <div
            key={i}
            className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3"
          >
            <div className="flex-1 min-w-0 mr-2">
              <p className="text-sm font-semibold text-white/90 capitalize truncate">
                {c.username || c.name}
              </p>

              {showOwner && c.parent_owner_name && (
                <p className="text-[10px] text-[#F59E0B]">
                  Owner:{" "}
                  {c.parent_owner_name
                    .toLowerCase()
                    .replace(/\b\w/g, (char) => char.toUpperCase())}
                </p>
              )}

              <p className="text-xs text-white/40">
                {c.referral_otp_number || c.mobile}
              </p>

              {(c.status === "deleted" || c.status === "owner_deleted") && (
                <p className="text-[10px] text-red-400/70">Referral removed</p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <a
                href={`tel:${c.referral_otp_number || c.mobile}`}
                className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/20 transition-all"
              >
                <Phone className="w-4 h-4" />
              </a>

              <button
                onClick={() =>
                  setDeleteConfirm({
                    id: c.id,
                    name: c.username || c.name,
                  })
                }
                disabled={deletingId === c.id}
                className="w-9 h-9 rounded-full bg-red-500/10 border border-red-500/15 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50"
              >
                {deletingId === c.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        ))}

        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(p) => setPages((prev) => ({ ...prev, [tabKey]: p }))}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white pb-10">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0A0A0A] border-b border-gold/10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            to={adminPaths.dashboard}
            className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-gold hover:bg-gold/10 transition-all border border-gold/10"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>

          <h1 className="font-display text-lg font-bold italic text-gold tracking-wide">
            Contacts
          </h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-md mx-auto px-4 pt-5">
        <Tabs
          defaultValue="owners"
          onValueChange={() =>
            setPages({
              owners: 1,
              b2b: 1,
              owners_b2b: 1,
              referrals: 1,
              customers: 1,
            })
          }
          className="w-full"
        >
          <TabsList className="bg-white/5 p-1 rounded-xl w-full border border-white/5 grid grid-cols-5">
            <TabsTrigger
              value="owners"
              className="rounded-lg text-[9px] py-2.5 data-[state=active]:bg-gold data-[state=active]:text-black font-bold"
            >
              Owners
            </TabsTrigger>
            <TabsTrigger
              value="b2b"
              className="rounded-lg text-[9px] py-2.5 data-[state=active]:bg-gold data-[state=active]:text-black font-bold"
            >
              B2B
            </TabsTrigger>
            <TabsTrigger
              value="owners_b2b"
              className="rounded-lg text-[9px] py-2.5 data-[state=active]:bg-gold data-[state=active]:text-black font-bold"
            >
              Own B2B
            </TabsTrigger>
            <TabsTrigger
              value="referrals"
              className="rounded-lg text-[9px] py-2.5 data-[state=active]:bg-gold data-[state=active]:text-black font-bold"
            >
              Referrals
            </TabsTrigger>
            <TabsTrigger
              value="customers"
              className="rounded-lg text-[9px] py-2.5 data-[state=active]:bg-gold data-[state=active]:text-black font-bold"
            >
              Guests
            </TabsTrigger>
          </TabsList>

          <TabsContent value="owners">
            {renderList(contacts.owners, "owners")}
          </TabsContent>
          <TabsContent value="b2b">
            {renderList(contacts.b2b, "b2b")}
          </TabsContent>
          <TabsContent value="owners_b2b">
            {renderList(contacts.owners_b2b, "owners_b2b", true)}
          </TabsContent>
          <TabsContent value="referrals">
            {renderList(contacts.referrals, "referrals")}
          </TabsContent>

          <TabsContent value="customers">
            {customersLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-gold" />
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-10 text-white/30 text-sm">
                No guest contacts yet
              </div>
            ) : (
              <div className="space-y-2 mt-4">
                {customers
                  .slice(
                    (pages.customers - 1) * PAGE_SIZE,
                    pages.customers * PAGE_SIZE,
                  )
                  .map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3"
                    >
                      <div className="flex-1 min-w-0 mr-2">
                        <p className="text-sm font-semibold text-white/90 capitalize truncate">
                          {c.username}
                        </p>
                        <p className="text-xs text-white/40">
                          {c.referral_otp_number}
                        </p>
                      </div>
                      <a
                        href={`tel:${c.referral_otp_number}`}
                        className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/20 transition-all"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                <PaginationBar
                  currentPage={pages.customers}
                  totalPages={Math.ceil(customers.length / PAGE_SIZE)}
                  onPageChange={(p) =>
                    setPages((prev) => ({ ...prev, customers: p }))
                  }
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Popup */}
      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <AlertDialogContent className="bg-[#0B0B0B] border border-white/10 text-white rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-500 text-lg font-semibold">
              Delete Contact?
            </AlertDialogTitle>

            <AlertDialogDescription className="text-white/70">
              Are you sure you want to permanently delete{" "}
              <span className="font-bold text-white capitalize">
                {deleteConfirm?.name}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex gap-3 pt-4">
            <AlertDialogCancel className="flex-1 bg-gold text-black border border-gold/20 hover:bg-gold/50 hover:text-black rounded-xl transition-all">
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={handleHardDelete}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminContactsPage;
