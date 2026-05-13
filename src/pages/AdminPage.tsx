import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Package, BookOpen, LayoutDashboard, LogOut,
  TrendingUp, Crown, Edit2, User, MessageSquare, Mail, Phone, MapPin, Calendar, IndianRupee, Users, FileText, Eye,
  UserCog, Search, RefreshCw, UserPlus, Plane, AlertCircle, Shield, CheckCircle2, XCircle, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { api, getErrorMessage } from "@/lib/api";
import PackageEditor from "@/components/PackageEditor";
import ProfilePage from "@/pages/ProfilePage";
import { format } from "date-fns";

type Tab = "overview" | "users" | "packageEditor" | "enquiries" | "consentForms" | "trips" | "profile";

interface Stats {
  totalUsers: number;
  totalPackages: number;
  totalTrips: number;
  totalBookings: number;
  totalEnquiries?: number;
  totalConsentForms?: number;
}

interface Enquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  packageTitle: string;
  packagePrice: number;
  numberOfPeople: number;
  travelDate: string | null;
  selectedRoute: string | null;
  budgetMin: number;
  budgetMax: number;
  remarks: string | null;
  status: 'NEW' | 'CONTACTED' | 'CONVERTED' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
}

interface ConsentForm {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelation: string;
  packageName: string;
  travelDate: string;
  numberOfTravelers: number;
  photoUrl: string | null;
  idProofUrl: string | null;
  idProofType: string | null;
  idNumber: string | null;
  medicalConditions: string | null;
  medicalConditionSeverity: string | null;
  allergies: string | null;
  medications: string | null;
  bloodGroup: string | null;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  medicalConsent: boolean;
  photoConsent: boolean;
  specialRequests: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  reviewer: { firstName: string; lastName: string } | null;
}

interface Trip {
  id: string;
  destination: string;
  days: number;
  budget: number;
  interests: string[];
  isPublic: boolean;
  shareToken: string | null;
  createdAt: string;
  updatedAt: string;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  itinerary: Array<{
    dayNumber: number;
    title: string;
    activities: Array<{
      time: string;
      title: string;
      description: string;
      locationName: string;
      category: string;
      cost: number;
    }>;
  }>;
  budgetBreakdown: {
    accommodation: number;
    food: number;
    transport: number;
    activities: number;
    total: number;
  };
}

interface Trip {
  id: string;
  userId: string;
  destination: string;
  days: number;
  budget: number;
  interests: string[];
  isPublic: boolean;
  shareToken: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  itinerary?: Array<{
    dayNumber: number;
    title: string;
    activities: Array<{
      title: string;
      time: string;
      category: string;
      cost: number;
    }>;
  }>;
  budgetBreakdown?: {
    accommodation: number;
    food: number;
    transport: number;
    activities: number;
    total: number;
  };
}

interface UserRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  _count?: { trips: number; bookings: number };
}

const ROLE_BADGE: Record<string, string> = {
  SUPERADMIN: "bg-rose-100 text-rose-700 border-rose-200",
  ADMIN:      "bg-violet-100 text-violet-700 border-violet-200",
  STAFF:      "bg-amber-100 text-amber-700 border-amber-200",
  USER:       "bg-slate-100 text-slate-600 border-slate-200",
};

const emptyCreate = { firstName: "", lastName: "", email: "", phone: "", password: "", role: "USER" };

export default function AdminPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [enquiriesLoading, setEnquiriesLoading] = useState(false);
  const [enquiryFilter, setEnquiryFilter] = useState<string>("all");
  const [consentForms, setConsentForms] = useState<ConsentForm[]>([]);
  const [consentFormsLoading, setConsentFormsLoading] = useState(false);
  const [consentFormFilter, setConsentFormFilter] = useState<string>("all");
  const [selectedConsentForm, setSelectedConsentForm] = useState<ConsentForm | null>(null);
  
  // Trips management states
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripsLoading, setTripsLoading] = useState(false);
  const [tripSearch, setTripSearch] = useState("");
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  
  // User management states
  const [users, setUsers] = useState<UserRow[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [usersLoading, setUsersLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreate);
  const [creating, setCreating] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const canCreateSuperAdmin = user?.role === "SUPERADMIN";
  const isSuperAdmin = user?.role === "SUPERADMIN";

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { if (tab === "enquiries") fetchEnquiries(); }, [tab, enquiryFilter]);
  useEffect(() => { if (tab === "consentForms") fetchConsentForms(); }, [tab, consentFormFilter]);
  useEffect(() => { if (tab === "trips") fetchTrips(); }, [tab]);
  useEffect(() => { if (tab === "users") fetchUsers(); }, [tab]);

  async function fetchStats() {
    try {
      const { data } = await api.get("/admin/dashboard");
      setStats(data.data.stats);
    } catch {
      setStats({ totalUsers: 0, totalPackages: 0, totalTrips: 0, totalBookings: 0, totalEnquiries: 0, totalConsentForms: 0 });
    }
  }

  async function fetchEnquiries() {
    setEnquiriesLoading(true);
    try {
      const params = enquiryFilter !== "all" ? { status: enquiryFilter } : {};
      const { data } = await api.get("/enquiries", { params });
      setEnquiries(data.data.enquiries);
    } catch (error) {
      toast.error("Failed to load enquiries", { description: getErrorMessage(error) });
    } finally {
      setEnquiriesLoading(false);
    }
  }

  async function updateEnquiryStatus(id: string, status: string) {
    try {
      await api.patch(`/enquiries/${id}/status`, { status });
      toast.success("Enquiry status updated");
      fetchEnquiries();
      fetchStats(); // Refresh stats
    } catch (error) {
      toast.error("Failed to update status", { description: getErrorMessage(error) });
    }
  }

  async function fetchConsentForms() {
    setConsentFormsLoading(true);
    try {
      const params = consentFormFilter !== "all" ? { status: consentFormFilter } : {};
      const { data } = await api.get("/consent-forms", { params });
      setConsentForms(data.data.consentForms);
    } catch (error) {
      toast.error("Failed to load consent forms", { description: getErrorMessage(error) });
    } finally {
      setConsentFormsLoading(false);
    }
  }

  async function fetchTrips() {
    setTripsLoading(true);
    try {
      const { data } = await api.get("/admin/trips", { params: { limit: 100 } });
      setTrips(data.data || []);
    } catch (error) {
      toast.error("Failed to load trips", { description: getErrorMessage(error) });
    } finally {
      setTripsLoading(false);
    }
  }

  async function deleteTrip(id: string) {
    if (!confirm("Are you sure you want to delete this trip?")) return;
    try {
      await api.delete(`/trips/${id}`);
      toast.success("Trip deleted successfully");
      fetchTrips();
      fetchStats();
    } catch (error) {
      toast.error("Failed to delete trip", { description: getErrorMessage(error) });
    }
  }

  async function updateConsentFormStatus(id: string, status: string, adminNotes?: string) {
    try {
      await api.patch(`/consent-forms/${id}/status`, { status, adminNotes });
      toast.success("Consent form status updated");
      fetchConsentForms();
      fetchStats();
      setSelectedConsentForm(null);
    } catch (error) {
      toast.error("Failed to update status", { description: getErrorMessage(error) });
    }
  }

  async function fetchUsers() {
    setUsersLoading(true);
    try {
      const { data } = await api.get("/admin/users?limit=50");
      setUsers(data.data ?? []);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!createForm.firstName || !createForm.lastName || !createForm.email || !createForm.password) {
      toast.error("Please fill all required fields");
      return;
    }
    setCreating(true);
    try {
      await api.post("/admin/users", createForm);
      toast.success(`User ${createForm.email} created successfully`);
      setShowCreate(false);
      setCreateForm(emptyCreate);
      fetchUsers();
      fetchStats();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || "Failed to create user");
    } finally {
      setCreating(false);
    }
  }

  async function changeRole(userId: string, role: string) {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role });
      toast.success("Role updated");
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    } catch {
      toast.error("Failed to update role");
    }
  }

  async function toggleActive(userId: string, current: boolean) {
    try {
      await api.patch(`/admin/users/${userId}/toggle-active`);
      toast.success(current ? "User deactivated" : "User activated");
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !u.isActive } : u));
    } catch {
      toast.error("Failed to update user");
    }
  }

  const filteredUsers = users.filter(u =>
    `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(userSearch.toLowerCase())
  );

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers ?? "—", icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Total Trips", value: stats?.totalTrips ?? "—", icon: TrendingUp, color: "text-green-500", bg: "bg-green-50" },
    { label: "Packages", value: stats?.totalPackages ?? "—", icon: Package, color: "text-violet-500", bg: "bg-violet-50" },
    { label: "Bookings", value: stats?.totalBookings ?? "—", icon: BookOpen, color: "text-amber-500", bg: "bg-amber-50" },
    { label: "Enquiries", value: stats?.totalEnquiries ?? "—", icon: MessageSquare, color: "text-rose-500", bg: "bg-rose-50" },
    { label: "Consent Forms", value: stats?.totalConsentForms ?? "—", icon: FileText, color: "text-purple-500", bg: "bg-purple-50" },
  ];

  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "users", label: "Users", icon: Users, superAdminOnly: true },
    { id: "packageEditor", label: "Package Editor", icon: Edit2 },
    { id: "trips", label: "Trips", icon: Plane },
    { id: "enquiries", label: "Enquiries", icon: MessageSquare },
    { id: "consentForms", label: "Consent Forms", icon: FileText },
    // { id: "profile", label: "Profile", icon: User }, // Uncomment to re-enable profile for admin
  ] as { id: Tab; label: string; icon: any; superAdminOnly?: boolean }[];

  const visibleTabs = tabs.filter(t => !t.superAdminOnly || isSuperAdmin);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">

      {/* ── Mobile Sidebar Toggle ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar (Hidden on mobile) ── */}
      <aside className={`fixed lg:static inset-y-0 left-0 w-60 border-r border-border bg-card flex-col z-50 transform transition-transform lg:transform-none ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}>
        <div className="p-4 border-b border-border">
          <Link to="/" className="flex items-center justify-center mb-3 hover:opacity-80 transition-opacity">
            <img src="/logo.png" alt="DeshYatra" className="h-10 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Crown className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm text-foreground">{isSuperAdmin ? "Super Admin" : "Admin"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {visibleTabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                tab === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" /><span className="truncate">{label}</span>
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-border">
          <Button variant="ghost" size="sm" className="w-full gap-2 justify-start text-destructive hover:text-destructive"
            onClick={async () => { await logout(); navigate("/login"); }}>
            <LogOut className="w-4 h-4" /> Logout
          </Button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-auto">

        {/* Mobile Header with Menu Button */}
        <div className="lg:hidden sticky top-0 z-40 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">Admin Panel</h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Profile tab renders full-page */}
        {tab === "profile" && <ProfilePage hideNav />}

        {tab !== "profile" && (
          <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">

            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                {tab === "overview" && "Dashboard Overview"}
                {tab === "users" && "User Management"}
                {tab === "packageEditor" && "Package Editor"}
                {tab === "trips" && "Trips Management"}
                {tab === "enquiries" && "Enquiries Management"}
                {tab === "consentForms" && "Consent Forms Management"}
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">Welcome back, {user?.firstName}.</p>
            </motion.div>

            {/* ── Overview ── */}
            {tab === "overview" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
                  {statCards.map(({ label, value, icon: Icon, color, bg }, i) => (
                    <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                      <Card>
                        <CardContent className="p-5 flex items-center gap-4">
                          <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                            <Icon className={`w-5 h-5 ${color}`} />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-foreground">{value}</p>
                            <p className="text-xs text-muted-foreground">{label}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      {isSuperAdmin && (
                        <>
                          <Button className="w-full justify-start gap-2" variant="outline" onClick={() => setTab("users")}>
                            <UserCog className="w-4 h-4" /> Manage Users
                          </Button>
                          <Button className="w-full justify-start gap-2" variant="outline" onClick={() => { setTab("users"); setShowCreate(true); }}>
                            <UserPlus className="w-4 h-4" /> Create New User
                          </Button>
                        </>
                      )}
                      <Button className="w-full justify-start gap-2" variant="outline" onClick={() => setTab("packageEditor")}>
                        <Edit2 className="w-4 h-4" /> Package Editor
                      </Button>
                      <Button className="w-full justify-start gap-2" variant="outline" onClick={() => setTab("enquiries")}>
                        <MessageSquare className="w-4 h-4" /> View Enquiries
                      </Button>
                      <Button className="w-full justify-start gap-2" variant="outline" onClick={() => setTab("consentForms")}>
                        <FileText className="w-4 h-4" /> View Consent Forms
                      </Button>
                      {/* <Button className="w-full justify-start gap-2" variant="outline" onClick={() => setTab("profile")}>
                        <User className="w-4 h-4" /> My Profile
                      </Button> */}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle className="text-base">Your Account</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      {[
                        { label: "Name", value: `${user?.firstName} ${user?.lastName}` },
                        { label: "Email", value: user?.email },
                        { label: "Role", value: <Badge className={ROLE_BADGE[user?.role ?? "USER"]}>{user?.role}</Badge> },
                        { label: "Verified", value: <span className={user?.isEmailVerified ? "text-green-600 font-medium" : "text-red-500"}>{user?.isEmailVerified ? "Yes" : "No"}</span> },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{label}</span>
                          <span className="font-medium">{value}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {/* ── Package Editor ── */}
            {tab === "packageEditor" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <PackageEditor />
              </motion.div>
            )}

            {/* ── Users Management (SuperAdmin Only) ── */}
            {tab === "users" && isSuperAdmin && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search users..." className="pl-9" value={userSearch} onChange={e => setUserSearch(e.target.value)} />
                  </div>
                  <Button variant="outline" size="icon" onClick={fetchUsers}>
                    <RefreshCw className={`w-4 h-4 ${usersLoading ? "animate-spin" : ""}`} />
                  </Button>
                  <Button className="gap-2" onClick={() => setShowCreate(true)}>
                    <UserPlus className="w-4 h-4" /> Create User
                  </Button>
                </div>

                <Card>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/40">
                          {["User","Role","Status","Trips","Bookings","Joined","Actions"].map(h => (
                            <th key={h} className={`px-4 py-3 font-medium text-muted-foreground ${h==="Actions"?"text-right":"text-left"}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {usersLoading ? (
                          <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">Loading...</td></tr>
                        ) : filteredUsers.length === 0 ? (
                          <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">No users found</td></tr>
                        ) : filteredUsers.map((u, i) => (
                          <motion.tr key={u.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                            className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-medium text-foreground">{u.firstName} {u.lastName}</p>
                              <p className="text-xs text-muted-foreground">{u.email}</p>
                            </td>
                            <td className="px-4 py-3">
                              <Select value={u.role} onValueChange={val => changeRole(u.id, val)}>
                                <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {["USER","STAFF","ADMIN",...(canCreateSuperAdmin?["SUPERADMIN"]:[])].map(r => (
                                    <SelectItem key={r} value={r}>{r}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className={u.isActive ? "text-green-600 border-green-200 bg-green-50" : "text-red-500 border-red-200 bg-red-50"}>
                                {u.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{u._count?.trips ?? 0}</td>
                            <td className="px-4 py-3 text-muted-foreground">{u._count?.bookings ?? 0}</td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(u.createdAt).toLocaleDateString("en-IN")}</td>
                            <td className="px-4 py-3 text-right">
                              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => toggleActive(u.id, u.isActive)}>
                                {u.isActive ? "Deactivate" : "Activate"}
                              </Button>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* ── Enquiries ── */}
            {tab === "enquiries" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                {/* Filter */}
                <Card>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Filter by Status:</span>
                    </div>
                    <Select value={enquiryFilter} onValueChange={setEnquiryFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Enquiries</SelectItem>
                        <SelectItem value="NEW">New</SelectItem>
                        <SelectItem value="CONTACTED">Contacted</SelectItem>
                        <SelectItem value="CONVERTED">Converted</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                {/* Enquiries Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Enquiries List</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {enquiriesLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                      </div>
                    ) : enquiries.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No enquiries found</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Contact</TableHead>
                              <TableHead>Package</TableHead>
                              <TableHead>People</TableHead>
                              <TableHead>Travel Date</TableHead>
                              <TableHead>Budget</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Created</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {enquiries.map((enquiry) => (
                              <TableRow key={enquiry.id}>
                                <TableCell>
                                  <div className="font-medium">{enquiry.name}</div>
                                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                    <MapPin className="w-3 h-3" />
                                    {enquiry.city}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-xs space-y-1">
                                    <div className="flex items-center gap-1">
                                      <Mail className="w-3 h-3 text-muted-foreground" />
                                      <a href={`mailto:${enquiry.email}`} className="hover:underline">{enquiry.email}</a>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Phone className="w-3 h-3 text-muted-foreground" />
                                      <a href={`tel:${enquiry.phone}`} className="hover:underline">{enquiry.phone}</a>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="max-w-xs">
                                    <div className="font-medium text-sm truncate">{enquiry.packageTitle}</div>
                                    <div className="text-xs text-muted-foreground">₹{Number(enquiry.packagePrice).toLocaleString('en-IN')}</div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <Users className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-sm">{enquiry.numberOfPeople}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {enquiry.travelDate ? (
                                    <div className="flex items-center gap-1 text-sm">
                                      <Calendar className="w-3 h-3 text-muted-foreground" />
                                      {format(new Date(enquiry.travelDate), 'MMM dd, yyyy')}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">Not specified</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="text-xs">
                                    <div className="flex items-center gap-1">
                                      <IndianRupee className="w-3 h-3 text-muted-foreground" />
                                      <span>{Number(enquiry.budgetMin).toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="text-muted-foreground">to ₹{Number(enquiry.budgetMax).toLocaleString('en-IN')}</div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={enquiry.status}
                                    onValueChange={(value) => updateEnquiryStatus(enquiry.id, value)}
                                  >
                                    <SelectTrigger className="w-32">
                                      <SelectValue>
                                        <Badge
                                          className={
                                            enquiry.status === 'NEW' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                            enquiry.status === 'CONTACTED' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                            enquiry.status === 'CONVERTED' ? 'bg-green-100 text-green-700 border-green-200' :
                                            'bg-gray-100 text-gray-700 border-gray-200'
                                          }
                                        >
                                          {enquiry.status}
                                        </Badge>
                                      </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="NEW">New</SelectItem>
                                      <SelectItem value="CONTACTED">Contacted</SelectItem>
                                      <SelectItem value="CONVERTED">Converted</SelectItem>
                                      <SelectItem value="CLOSED">Closed</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <div className="text-xs text-muted-foreground">
                                    {format(new Date(enquiry.createdAt), 'MMM dd, yyyy')}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ── Consent Forms ── */}
            {tab === "consentForms" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                {/* Filter */}
                <Card>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Filter by Status:</span>
                    </div>
                    <Select value={consentFormFilter} onValueChange={setConsentFormFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Forms</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="APPROVED">Approved</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                {/* Consent Forms Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Consent Forms List</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {consentFormsLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                      </div>
                    ) : consentForms.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No consent forms found</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Contact</TableHead>
                              <TableHead>Package</TableHead>
                              <TableHead>Travel Date</TableHead>
                              <TableHead>Travelers</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Created</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {consentForms.map((form) => (
                              <TableRow key={form.id}>
                                <TableCell>
                                  <div className="font-medium">{form.fullName}</div>
                                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                    <MapPin className="w-3 h-3" />
                                    {form.city}, {form.state}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-xs space-y-1">
                                    <div className="flex items-center gap-1">
                                      <Mail className="w-3 h-3 text-muted-foreground" />
                                      <a href={`mailto:${form.email}`} className="hover:underline">{form.email}</a>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Phone className="w-3 h-3 text-muted-foreground" />
                                      <a href={`tel:${form.phone}`} className="hover:underline">{form.phone}</a>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="max-w-xs">
                                    <div className="font-medium text-sm truncate">{form.packageName}</div>
                                    <div className="text-xs text-muted-foreground">{form.gender}, {form.nationality}</div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1 text-sm">
                                    <Calendar className="w-3 h-3 text-muted-foreground" />
                                    {format(new Date(form.travelDate), 'MMM dd, yyyy')}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <Users className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-sm">{form.numberOfTravelers}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    className={
                                      form.status === 'PENDING' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                      form.status === 'APPROVED' ? 'bg-green-100 text-green-700 border-green-200' :
                                      'bg-red-100 text-red-700 border-red-200'
                                    }
                                  >
                                    {form.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="text-xs text-muted-foreground">
                                    {format(new Date(form.createdAt), 'MMM dd, yyyy')}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setSelectedConsentForm(form)}
                                    className="h-8 gap-1"
                                  >
                                    <Eye className="w-3 h-3" />
                                    View
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Consent Form Detail Dialog */}
            <Dialog open={!!selectedConsentForm} onOpenChange={() => setSelectedConsentForm(null)}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between">
                    <span>Consent Form Details</span>
                    <Badge className={
                      selectedConsentForm?.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                      selectedConsentForm?.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }>
                      {selectedConsentForm?.status}
                    </Badge>
                  </DialogTitle>
                </DialogHeader>
                {selectedConsentForm && (
                  <div className="space-y-6">
                    {/* Personal Information */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                        <User className="w-4 h-4" /> Personal Information
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-blue-700">Full Name</Label>
                          <p className="font-medium text-blue-900">{selectedConsentForm.fullName}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-blue-700">Email</Label>
                          <p className="font-medium text-blue-900">{selectedConsentForm.email}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-blue-700">Phone</Label>
                          <p className="font-medium text-blue-900">{selectedConsentForm.phone}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-blue-700">Date of Birth</Label>
                          <p className="font-medium text-blue-900">{format(new Date(selectedConsentForm.dateOfBirth), 'PPP')}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-blue-700">Gender</Label>
                          <p className="font-medium text-blue-900">{selectedConsentForm.gender}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-blue-700">Nationality</Label>
                          <p className="font-medium text-blue-900">{selectedConsentForm.nationality}</p>
                        </div>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> Address
                      </h3>
                      <p className="font-medium text-slate-900">{selectedConsentForm.address}</p>
                      <p className="text-sm text-slate-600 mt-1">
                        {selectedConsentForm.city}, {selectedConsentForm.state} - {selectedConsentForm.pincode}
                      </p>
                    </div>

                    {/* Travel Details */}
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                        <Plane className="w-4 h-4" /> Travel Details
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label className="text-xs text-green-700">Package</Label>
                          <p className="font-medium text-green-900">{selectedConsentForm.packageName}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-green-700">Travel Date</Label>
                          <p className="font-medium text-green-900">{format(new Date(selectedConsentForm.travelDate), 'PPP')}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-green-700">Number of Travelers</Label>
                          <p className="font-medium text-green-900">{selectedConsentForm.numberOfTravelers}</p>
                        </div>
                      </div>
                      {selectedConsentForm.specialRequests && (
                        <div className="mt-3">
                          <Label className="text-xs text-green-700">Special Requests / Dietary Preferences</Label>
                          <p className="text-sm text-green-800 mt-1">{selectedConsentForm.specialRequests}</p>
                        </div>
                      )}
                    </div>

                    {/* Emergency Contact */}
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                      <h3 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                        <Phone className="w-4 h-4" /> Emergency Contact
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label className="text-xs text-orange-700">Name</Label>
                          <p className="font-medium text-orange-900">{selectedConsentForm.emergencyName}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-orange-700">Phone</Label>
                          <p className="font-medium text-orange-900">{selectedConsentForm.emergencyPhone}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-orange-700">Relation</Label>
                          <p className="font-medium text-orange-900">{selectedConsentForm.emergencyRelation}</p>
                        </div>
                      </div>
                    </div>

                    {/* Medical Information */}
                    {selectedConsentForm.medicalConditions ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" /> Medical Information
                        </h3>
                        <div>
                          <Label className="text-xs text-amber-700">Medical Condition</Label>
                          <p className="font-medium text-amber-900 mt-1">{selectedConsentForm.medicalConditions}</p>
                        </div>
                        {selectedConsentForm.medicalConditionSeverity && (
                          <div className="mt-3">
                            <Label className="text-xs text-amber-700">Severity Level</Label>
                            <div className="mt-1">
                              <Badge className={`${
                                selectedConsentForm.medicalConditionSeverity === 'Severe' ? 'bg-red-100 text-red-700 border-red-300' :
                                selectedConsentForm.medicalConditionSeverity === 'Moderate' ? 'bg-orange-100 text-orange-700 border-orange-300' :
                                'bg-yellow-100 text-yellow-700 border-yellow-300'
                              }`}>
                                {selectedConsentForm.medicalConditionSeverity}
                              </Badge>
                            </div>
                          </div>
                        )}
                        {selectedConsentForm.allergies && (
                          <div className="mt-3">
                            <Label className="text-xs text-amber-700">Allergies</Label>
                            <p className="text-sm text-amber-800 mt-1">{selectedConsentForm.allergies}</p>
                          </div>
                        )}
                        {selectedConsentForm.medications && (
                          <div className="mt-3">
                            <Label className="text-xs text-amber-700">Current Medications</Label>
                            <p className="text-sm text-amber-800 mt-1">{selectedConsentForm.medications}</p>
                          </div>
                        )}
                        {selectedConsentForm.bloodGroup && (
                          <div className="mt-3">
                            <Label className="text-xs text-amber-700">Blood Group</Label>
                            <p className="font-medium text-amber-900 mt-1">{selectedConsentForm.bloodGroup}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" /> Medical Information
                        </h3>
                        <p className="text-sm text-green-700">No medical conditions reported</p>
                      </div>
                    )}

                    {/* Documents */}
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                      <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Documents & ID Proof
                      </h3>
                      
                      {/* ID Number Display */}
                      {selectedConsentForm.idNumber && (
                        <div className="mb-4 bg-white border border-purple-200 rounded-lg p-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs text-purple-700">ID Type</Label>
                              <p className="font-medium text-purple-900">{selectedConsentForm.idProofType || 'N/A'}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-purple-700">ID Number</Label>
                              <p className="font-mono font-semibold text-purple-900">{selectedConsentForm.idNumber}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-6">
                        {selectedConsentForm.photoUrl ? (
                          <div>
                            <Label className="text-xs text-purple-700 mb-2 block">Passport Photo</Label>
                            <a href={selectedConsentForm.photoUrl} target="_blank" rel="noopener noreferrer" className="block group">
                              <img 
                                src={selectedConsentForm.photoUrl} 
                                alt="Passport Photo" 
                                className="w-full h-48 object-cover rounded-lg border-2 border-purple-200 group-hover:border-purple-400 transition-colors" 
                              />
                              <p className="text-xs text-purple-600 mt-1 group-hover:text-purple-700">Click to view full size</p>
                            </a>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-purple-400">
                            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-xs">No photo uploaded</p>
                          </div>
                        )}
                        {selectedConsentForm.idProofUrl ? (
                          <div>
                            <Label className="text-xs text-purple-700 mb-2 block">
                              ID Proof Document
                            </Label>
                            <a href={selectedConsentForm.idProofUrl} target="_blank" rel="noopener noreferrer" className="block group">
                              <img 
                                src={selectedConsentForm.idProofUrl} 
                                alt="ID Proof" 
                                className="w-full h-48 object-cover rounded-lg border-2 border-purple-200 group-hover:border-purple-400 transition-colors" 
                              />
                              <p className="text-xs text-purple-600 mt-1 group-hover:text-purple-700">Click to view full size</p>
                            </a>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-purple-400">
                            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-xs">No ID proof uploaded</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Consent Status */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4" /> Consent & Agreements
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2">
                          {selectedConsentForm.termsAccepted ? 
                            <CheckCircle2 className="w-4 h-4 text-green-600" /> : 
                            <XCircle className="w-4 h-4 text-red-600" />
                          }
                          <span className="text-sm">Terms & Conditions</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {selectedConsentForm.privacyAccepted ? 
                            <CheckCircle2 className="w-4 h-4 text-green-600" /> : 
                            <XCircle className="w-4 h-4 text-red-600" />
                          }
                          <span className="text-sm">Privacy Policy</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {selectedConsentForm.medicalConsent ? 
                            <CheckCircle2 className="w-4 h-4 text-green-600" /> : 
                            <XCircle className="w-4 h-4 text-red-600" />
                          }
                          <span className="text-sm">Medical Consent</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {selectedConsentForm.photoConsent ? 
                            <CheckCircle2 className="w-4 h-4 text-green-600" /> : 
                            <XCircle className="w-4 h-4 text-red-600" />
                          }
                          <span className="text-sm">Photo Consent</span>
                        </div>
                      </div>
                    </div>

                    {/* Submission Info */}
                    <div className="text-xs text-muted-foreground border-t pt-4">
                      <p>Submitted on: {format(new Date(selectedConsentForm.createdAt), 'PPP p')}</p>
                      {selectedConsentForm.reviewedAt && (
                        <p className="mt-1">Reviewed on: {format(new Date(selectedConsentForm.reviewedAt), 'PPP p')}</p>
                      )}
                    </div>

                    {/* Status Update Actions */}
                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        onClick={() => updateConsentFormStatus(selectedConsentForm.id, 'APPROVED')}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        disabled={selectedConsentForm.status === 'APPROVED'}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => updateConsentFormStatus(selectedConsentForm.id, 'REJECTED')}
                        variant="destructive"
                        className="flex-1"
                        disabled={selectedConsentForm.status === 'REJECTED'}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* ── Trips Management ── */}
            {tab === "trips" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                {/* Search */}
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by destination..."
                      value={tripSearch}
                      onChange={(e) => setTripSearch(e.target.value)}
                      className="flex-1"
                    />
                    <Button size="sm" variant="outline" onClick={fetchTrips}>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>

                {/* Trips Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">All Trips</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {tripsLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                      </div>
                    ) : trips.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Plane className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No trips found</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>User</TableHead>
                              <TableHead>Destination</TableHead>
                              <TableHead>Duration</TableHead>
                              <TableHead>Budget</TableHead>
                              <TableHead>Interests</TableHead>
                              <TableHead>Created</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {trips.filter(t => !tripSearch || t.destination.toLowerCase().includes(tripSearch.toLowerCase())).map((trip) => (
                              <TableRow key={trip.id}>
                                <TableCell>
                                  {trip.user ? (
                                    <>
                                      <div className="font-medium">{trip.user.firstName} {trip.user.lastName}</div>
                                      <div className="text-xs text-muted-foreground">{trip.user.email}</div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="font-medium">{trip.guestName || "Guest User"}</div>
                                      <div className="text-xs text-muted-foreground">{trip.guestEmail}</div>
                                      <div className="text-xs text-muted-foreground">{trip.guestPhone}</div>
                                    </>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-muted-foreground" />
                                    <span className="font-medium">{trip.destination}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-sm">{trip.days} days</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <IndianRupee className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-sm font-medium">₹{trip.budget.toLocaleString()}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1">
                                    {trip.interests.slice(0, 2).map((interest, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {interest}
                                      </Badge>
                                    ))}
                                    {trip.interests.length > 2 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{trip.interests.length - 2}
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-xs text-muted-foreground">
                                    {format(new Date(trip.createdAt), 'MMM dd, yyyy')}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setSelectedTrip(trip)}
                                      className="h-8 gap-1"
                                    >
                                      <Eye className="w-3 h-3" />
                                      View
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => deleteTrip(trip.id)}
                                      className="h-8 gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <XCircle className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Trip Detail Dialog */}
            <Dialog open={!!selectedTrip} onOpenChange={() => setSelectedTrip(null)}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Plane className="w-5 h-5" />
                    Trip to {selectedTrip?.destination}
                  </DialogTitle>
                </DialogHeader>
                {selectedTrip && (
                  <div className="space-y-6">
                    {/* Trip Overview */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <h3 className="font-semibold text-blue-900 mb-3">Trip Overview</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-blue-700">Destination</Label>
                          <p className="font-medium text-blue-900">{selectedTrip.destination}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-blue-700">Duration</Label>
                          <p className="font-medium text-blue-900">{selectedTrip.days} days</p>
                        </div>
                        <div>
                          <Label className="text-xs text-blue-700">Budget</Label>
                          <p className="font-medium text-blue-900">₹{selectedTrip.budget.toLocaleString()}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-blue-700">Created By</Label>
                          {selectedTrip.user ? (
                            <>
                              <p className="font-medium text-blue-900">{selectedTrip.user.firstName} {selectedTrip.user.lastName}</p>
                              <p className="text-xs text-blue-700">{selectedTrip.user.email}</p>
                            </>
                          ) : (
                            <>
                              <p className="font-medium text-blue-900">{selectedTrip.guestName || "Guest User"}</p>
                              <p className="text-xs text-blue-700">{selectedTrip.guestEmail}</p>
                              <p className="text-xs text-blue-700">{selectedTrip.guestPhone}</p>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="mt-3">
                        <Label className="text-xs text-blue-700">Interests</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedTrip.interests.map((interest, idx) => (
                            <Badge key={idx} className="bg-blue-100 text-blue-700">
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Budget Breakdown */}
                    {selectedTrip.budgetBreakdown && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                          <IndianRupee className="w-4 h-4" /> Budget Breakdown
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs text-green-700">Accommodation</Label>
                            <p className="font-medium text-green-900">₹{selectedTrip.budgetBreakdown.accommodation?.toLocaleString() || 0}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-green-700">Food</Label>
                            <p className="font-medium text-green-900">₹{selectedTrip.budgetBreakdown.food?.toLocaleString() || 0}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-green-700">Transport</Label>
                            <p className="font-medium text-green-900">₹{selectedTrip.budgetBreakdown.transport?.toLocaleString() || 0}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-green-700">Activities</Label>
                            <p className="font-medium text-green-900">₹{selectedTrip.budgetBreakdown.activities?.toLocaleString() || 0}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Itinerary */}
                    {selectedTrip.itinerary && selectedTrip.itinerary.length > 0 && (
                      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                        <h3 className="font-semibold text-purple-900 mb-3">Itinerary</h3>
                        <div className="space-y-4">
                          {selectedTrip.itinerary.map((day) => (
                            <div key={day.dayNumber} className="bg-white rounded-lg p-3 border border-purple-100">
                              <h4 className="font-semibold text-purple-900 mb-2">
                                Day {day.dayNumber}: {day.title}
                              </h4>
                              <div className="space-y-2">
                                {day.activities.map((activity, idx) => (
                                  <div key={idx} className="flex gap-3 text-sm">
                                    <span className="text-purple-600 font-medium min-w-[60px]">{activity.time}</span>
                                    <div className="flex-1">
                                      <p className="font-medium text-purple-900">{activity.title}</p>
                                      {activity.description && (
                                        <p className="text-xs text-purple-700 mt-0.5">{activity.description}</p>
                                      )}
                                      <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className="text-xs">
                                          {activity.category}
                                        </Badge>
                                        {activity.cost > 0 && (
                                          <span className="text-xs text-purple-600">₹{activity.cost}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Create User Dialog (SuperAdmin Only) */}
            <Dialog open={showCreate} onOpenChange={open => { setShowCreate(open); if (!open) setCreateForm(emptyCreate); }}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-primary" /> Create New User
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateUser} className="space-y-4 mt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>First Name *</Label>
                      <Input placeholder="John" value={createForm.firstName} onChange={e => setCreateForm(f => ({ ...f, firstName: e.target.value }))} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Last Name *</Label>
                      <Input placeholder="Doe" value={createForm.lastName} onChange={e => setCreateForm(f => ({ ...f, lastName: e.target.value }))} required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email *</Label>
                    <Input type="email" placeholder="user@example.com" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phone</Label>
                    <Input type="tel" placeholder="+91 9876543210" value={createForm.phone} onChange={e => setCreateForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Password *</Label>
                    <div className="relative">
                      <Input type={showPwd ? "text" : "password"} placeholder="Min 8 chars, upper, lower, number, special"
                        value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} required className="pr-10" />
                      <button type="button" onClick={() => setShowPwd(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs">
                        {showPwd ? "Hide" : "Show"}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">Must include uppercase, lowercase, number & special character</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Role *</Label>
                    <Select value={createForm.role} onValueChange={val => setCreateForm(f => ({ ...f, role: val }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["USER","STAFF","ADMIN",...(canCreateSuperAdmin?["SUPERADMIN"]:[])].map(r => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowCreate(false); setCreateForm(emptyCreate); }}>Cancel</Button>
                    <Button type="submit" className="flex-1 gap-2" disabled={creating}>
                      {creating ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : <UserPlus className="w-4 h-4" />}
                      {creating ? "Creating..." : "Create User"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </main>
    </div>
  );
}
