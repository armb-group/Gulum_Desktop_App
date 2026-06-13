import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { getTeachers, createTeacher, updateTeacher } from "@/services/teacherCrudAPI";
import { useAuth } from "@/contexts/AuthContext";
import { AdminShell } from "./AdminShell";
import { ConfirmModal } from "@/components/ConfirmModal";
import { CustomTooltip } from "@/components/CustomTooltip";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, Pencil, Save, Trash2, Plus, X,
  ChevronRight, ChevronLeft, Check, Loader2, Copy, Eye
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ─── Interfaces ────────────────────────────────────────────────────────────────

interface Teacher {
  id: string | number;
  user_id: string | number;
  institution_id: string | number;
  employee_code: string;
  full_name: string;
  qualification: string;
  specialization: string;
  experience_year: string | number;
  joining_date: string;
  metadata: string;
  is_active: boolean;
  created_at: string;
  created_by: string;
  email: string;
  phone: string;
  department: string;
}

interface AccountForm { email: string; phone: string; password: string; }
interface PersonalForm { full_name: string; qualification: string; specialization: string; }
interface ProfessionalForm {
  institution_id: string;
  employee_code: string;
  experience_year: string;
  joining_date: string;
  metadata: string;
  department: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const STEPS = ["Account", "Personal", "Professional", "Review & Submit"];

const emptyAccount: AccountForm = { email: "", phone: "", password: "" };
const emptyPersonal: PersonalForm = { full_name: "", qualification: "", specialization: "" };
const emptyProfessional: ProfessionalForm = {
  institution_id: "", employee_code: "", experience_year: "", joining_date: "", metadata: "",
  department: "",
};

const emptyTeacher: Teacher = {
  id: 0, user_id: 0, institution_id: 0, employee_code: "", full_name: "",
  qualification: "", specialization: "", experience_year: 0, joining_date: "",
  metadata: "", is_active: true, created_at: "", created_by: "", email: "", phone: "",
  department: "",
};

const HIDDEN_IN_ROW = new Set<keyof Teacher>(["id", "user_id", "metadata", "joining_date", "experience_year", "specialization", "qualification", "institution_id", "created_at", "created_by"]);

const TABLE_COLUMNS: Array<{ key: keyof Teacher; label: string }> = [
  { key: "id", label: "ID" },
  { key: "user_id", label: "User ID" },
  { key: "institution_id", label: "Institution ID" },
  { key: "employee_code", label: "Employee Code" },
  { key: "full_name", label: "Full Name" },
  { key: "qualification", label: "Qualification" },
  { key: "specialization", label: "Specialization" },
  { key: "experience_year", label: "Experience" },
  { key: "joining_date", label: "Joining Date" },
  { key: "metadata", label: "Metadata" },
  { key: "is_active", label: "Active" },
  { key: "created_at", label: "Created At" },
  { key: "created_by", label: "Created By" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "department", label: "Department" },
];

// ─── Stepper ───────────────────────────────────────────────────────────────────

const Stepper = ({ current }: { current: number }) => (
  <div className="flex items-center justify-between mb-8 px-2">
    {STEPS.map((label, i) => (
      <div key={i} className="flex items-center flex-1 last:flex-none">
        <div className="flex flex-col items-center gap-1">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all duration-300 ${
            i < current ? "bg-primary border-primary text-primary-foreground"
              : i === current ? "border-primary text-primary bg-primary/10"
              : "border-muted-foreground/30 text-muted-foreground bg-muted/30"
          }`}>
            {i < current ? <Check className="h-4 w-4" /> : i + 1}
          </div>
          <span className={`text-xs font-medium whitespace-nowrap ${i === current ? "text-primary" : "text-muted-foreground"}`}>
            {label}
          </span>
        </div>
        {i < STEPS.length - 1 && (
          <div className={`flex-1 h-0.5 mx-2 mb-5 transition-all duration-300 ${i < current ? "bg-primary" : "bg-muted-foreground/20"}`} />
        )}
      </div>
    ))}
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-medium text-foreground">{label}</label>
    {children}
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

const TeacherCrud = () => {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [tableLoading, setTableLoading] = useState(true);

  useEffect(() => {
    getTeachers()
      .then((data) => setTeachers(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Failed to load teachers."))
      .finally(() => setTableLoading(false));
  }, []);

  const [search, setSearch] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("");

  const uniqueDepartments = useMemo(
    () => Array.from(new Set(teachers.map((t) => String(t.department || "")).filter(Boolean))),
    [teachers]
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedViewTeacher, setSelectedViewTeacher] = useState<Teacher | null>(null);
  const [isEditingView, setIsEditingView] = useState(false);
  const [viewEditData, setViewEditData] = useState<Teacher | null>(null);

  const [account, setAccount] = useState<AccountForm>(emptyAccount);
  const [personal, setPersonal] = useState<PersonalForm>(emptyPersonal);
  const [professional, setProfessional] = useState<ProfessionalForm>(emptyProfessional);
  const [deleteTargetId, setDeleteTargetId] = useState<string | number | null>(null);

  const overlayRef = useRef<HTMLDivElement>(null);
  const mouseDownTarget = useRef<EventTarget | null>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && modalOpen) closeModal(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  const closeModal = () => {
    setModalOpen(false);
    setStep(0);
    setAccount(emptyAccount);
    setPersonal(emptyPersonal);
    setProfessional(emptyProfessional);
  };

  // ── Validation ──────────────────────────────────────────────────────────────

  const validateStep = (): boolean => {
    if (step === 0) {
      if (!account.email || !/\S+@\S+\.\S+/.test(account.email)) {
        toast.error("Enter a valid email address."); return false;
      }
      if (!account.phone || account.phone.length < 7) {
        toast.error("Enter a valid phone number."); return false;
      }
      if (!account.password || account.password.length < 6) {
        toast.error("Password must be at least 6 characters."); return false;
      }
    }
    if (step === 1) {
      if (!personal.full_name.trim()) { toast.error("Full name is required."); return false; }
      if (!personal.qualification.trim()) { toast.error("Qualification is required."); return false; }
      if (!personal.specialization.trim()) { toast.error("Specialization is required."); return false; }
    }
    if (step === 2) {
      const { institution_id, employee_code, experience_year, joining_date, department } = professional;
      if (!institution_id || !employee_code || !experience_year || !joining_date || !department.trim()) {
        toast.error("All professional fields are required."); return false;
      }
    }
    return true;
  };

  const handleNext = () => { if (validateStep()) setStep((s) => s + 1); };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!validateStep()) return;
    if (submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true);
    try {
      // Create Teacher (registers user credentials and profile details in one call)
      await createTeacher({
        email: account.email,
        phone: account.phone,
        password: account.password,
        institution_id: professional.institution_id,
        employee_code: professional.employee_code,
        full_name: personal.full_name,
        qualification: personal.qualification,
        specialization: personal.specialization,
        experience_year: professional.experience_year,
        joining_date: professional.joining_date,
        metadata: professional.metadata,
        created_by: user?.name ?? "Admin",
        department: professional.department,
      });

      toast.success("Teacher registered successfully!");
      closeModal();
      getTeachers()
        .then((data) => setTeachers(Array.isArray(data) ? data : []))
        .catch(() => {});
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ??
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "An unexpected error occurred.";
      toast.error(msg);
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  // ── Table handlers ──────────────────────────────────────────────────────────

  const filteredTeachers = useMemo(
    () => teachers.filter((t) => {
      const matchesSearch = Object.values(t).join(" ").toLowerCase().includes(search.toLowerCase());
      const matchesDept = !selectedDeptFilter || String(t.department || "").toLowerCase() === selectedDeptFilter.toLowerCase();
      return matchesSearch && matchesDept;
    }),
    [teachers, search, selectedDeptFilter]
  );

  const handleViewSave = async () => {
    if (!viewEditData) return;
    try {
      await updateTeacher(viewEditData.id, viewEditData);
      setTeachers((prev) => prev.map((t) => (t.id === viewEditData.id ? viewEditData : t)));
      setSelectedViewTeacher(viewEditData);
      setIsEditingView(false);
      setViewModalOpen(false);
      toast.success("Teacher updated successfully!");
    } catch {
      toast.error("Failed to update teacher.");
    }
  };

  const handleDelete = (id: string | number) => {
    setDeleteTargetId(id);
  };

  const confirmDelete = () => {
    if (deleteTargetId !== null) {
      setTeachers((prev) => prev.filter((t) => t.id !== deleteTargetId));
      toast.success("Teacher deleted successfully");
    }
  };

  const handleCopy = (value: string) => {
    if (!value || value === "—") return;
    navigator.clipboard.writeText(value);
    toast.success("Copied to clipboard");
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <AdminShell title="Teacher Management">
      <section className="container py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Teacher Management</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage all teachers with advanced CRUD operations.</p>
          </div>
          <Button onClick={() => setModalOpen(true)} className="shadow-md hover:scale-105 transition-transform gap-2">
            <Plus className="h-4 w-4" /> Add Teacher
          </Button>
        </div>


        {/* Table */}
        <Card className="overflow-x-auto rounded-2xl admin-glass-strong">
          <div className="flex flex-col gap-4 p-4 lg:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Teacher Directory</p>
                <h2 className="text-base font-semibold text-foreground">{filteredTeachers.length} teachers found</h2>
              </div>
              <div className="text-sm text-muted-foreground">Latest updates appear automatically.</div>
            </div>

            {/* Search Bar & Filter in between */}
            <div className="flex flex-col sm:flex-row gap-4 items-center my-2">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, employee code, email, specialization..."
                  className="pl-10 h-11 rounded-xl bg-card border-border shadow-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-72">
                <select
                  value={selectedDeptFilter}
                  onChange={(e) => setSelectedDeptFilter(e.target.value)}
                  className="w-full h-11 rounded-xl border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring shadow-sm"
                >
                  <option value="">All Departments</option>
                  {uniqueDepartments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>

            {tableLoading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                <Loader2 className="h-5 w-5 animate-spin" /> Loading teachers...
              </div>
            ) : filteredTeachers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <p className="text-sm">No teachers match your search.</p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto rounded-lg border border-border/60">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-primary text-primary-foreground text-left text-xs font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-3 py-2 border-b border-border/80" style={{ width: "60px", minWidth: "60px" }}>S.No</th>
                      {TABLE_COLUMNS.filter((col) => !HIDDEN_IN_ROW.has(col.key)).map((col) => (
                        <th key={col.key} className="px-3 py-2 border-b border-border/80">
                          {col.label}
                        </th>
                      ))}
                      <th className="px-3 py-2 border-b border-border/80">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeachers.map((teacher, index) => {
                      return (
                        <tr key={teacher.id} className={`border-b border-border/40 transition-colors duration-200 hover:bg-muted/40 ${index % 2 === 0 ? "bg-card" : "bg-muted/20"}`}>
                          <td className="px-3 py-2 align-middle border-r border-border/45 text-black dark:text-[#FFF19E] text-xs font-medium">
                            {index + 1}
                          </td>
                          {TABLE_COLUMNS.filter((col) => !HIDDEN_IN_ROW.has(col.key)).map((col) => {
                            const value = teacher[col.key];
                            return (
                              <td key={col.key} className="px-3 py-2 align-middle max-w-[15rem] border-r border-border/45 last:border-r-0">
                                  <div className="flex items-center justify-between gap-2 group/cell">
                                    {(() => {
                                      const hasTooltip = value !== undefined && value !== null && String(value).trim() !== "" && String(value) !== "—";
                                      const contentStr = String(value ?? "");
                                      
                                      const getSpan = () => {
                                        if (col.key === "full_name") {
                                          return <span className="font-semibold text-black dark:text-[#FFF19E]">{String(value ?? "—")}</span>;
                                        } else if (col.key === "email") {
                                          return <span className="text-black dark:text-[#FFF19E] text-xs">{String(value ?? "—")}</span>;
                                        } else if (col.key === "employee_code") {
                                          return <span className="bg-amber-100 dark:bg-amber-950/40 text-black dark:text-[#FFF19E] border border-amber-200/50 dark:border-amber-900/30 text-xs font-medium px-2 py-0.5 rounded-full">{String(value ?? "—")}</span>;
                                        } else if (col.key === "is_active") {
                                          return (
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border text-black dark:text-[#FFF19E] ${value ? "bg-emerald-100 dark:bg-emerald-950/40 border-emerald-200/50 dark:border-emerald-900/30" : "bg-red-100 dark:bg-red-950/40 border-red-200/50 dark:border-red-900/30"}`}>
                                              {value ? "Active" : "Inactive"}
                                            </span>
                                          );
                                        } else if (col.key === "id" || col.key === "user_id") {
                                          return <span className="text-black dark:text-[#FFF19E] text-xs font-mono truncate max-w-[120px]">{String(value ?? "—")}</span>;
                                        } else {
                                          return <span className="text-black dark:text-[#FFF19E] text-xs">{String(value ?? "—")}</span>;
                                        }
                                      };

                                      const spanEl = getSpan();
                                      if (hasTooltip && col.key !== "is_active") {
                                        return <CustomTooltip content={contentStr}>{spanEl}</CustomTooltip>;
                                      }
                                      return spanEl;
                                    })()}
                                    {value !== undefined && value !== "—" && (
                                      <CustomTooltip content="Copy">
                                        <button
                                          onClick={() => handleCopy(String(value))}
                                          className="opacity-0 group-hover/cell:opacity-100 text-muted-foreground hover:text-primary transition-opacity p-1"
                                        >
                                          <Copy className="h-3.5 w-3.5" />
                                        </button>
                                      </CustomTooltip>
                                    )}
                                  </div>
                              </td>
                            );
                          })}
                          <td className="px-3 py-2 align-middle">
                            <div className="flex items-center gap-2">
                               <CustomTooltip content="View Details">
                                 <Button size="sm" variant="outline" onClick={() => { setSelectedViewTeacher(teacher); setViewEditData({ ...teacher }); setIsEditingView(false); setViewModalOpen(true); }} className="rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-700 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-900/50">
                                   <Eye className="h-4 w-4" />
                                 </Button>
                               </CustomTooltip>
                 
                               <CustomTooltip content="Delete Teacher">
                                 <Button size="sm" variant="destructive" onClick={() => handleDelete(teacher.id)} className="rounded-lg"><Trash2 className="h-4 w-4" /></Button>
                               </CustomTooltip>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      </section>

      {/* ── Add Teacher Modal ── */}
      {modalOpen && (
        <div
          ref={overlayRef}
          onMouseDown={(e) => { mouseDownTarget.current = e.target; }}
          onClick={(e) => { if (e.target === overlayRef.current && mouseDownTarget.current === overlayRef.current) closeModal(); }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-2xl mx-4 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto admin-glass-modal">

            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b">
              <div>
                <h2 className="text-xl font-bold">Register New Teacher</h2>
                <p className="text-sm text-muted-foreground">Step {step + 1} of {STEPS.length}</p>
              </div>
              <button onClick={closeModal} className="p-2 rounded-lg hover:bg-muted transition text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-6">
              <Stepper current={step} />

              {/* Step 1: Account */}
              {step === 0 && (
                <div className="space-y-4">
                  <h3 className="text-base font-semibold mb-4">Account Information</h3>
                  <Field label="Email *">
                    <Input type="email" placeholder="teacher@example.com" value={account.email} onChange={(e) => setAccount({ ...account, email: e.target.value })} />
                  </Field>
                  <Field label="Phone *">
                    <Input placeholder="e.g. 9876543210" value={account.phone} onChange={(e) => setAccount({ ...account, phone: e.target.value })} />
                  </Field>
                  <Field label="Password *">
                    <Input type="password" placeholder="Min. 6 characters" value={account.password} onChange={(e) => setAccount({ ...account, password: e.target.value })} />
                  </Field>
                </div>
              )}

              {/* Step 2: Personal */}
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="text-base font-semibold mb-4">Personal Information</h3>
                  <Field label="Full Name *">
                    <Input placeholder="e.g. Rahul Sharma" value={personal.full_name} onChange={(e) => setPersonal({ ...personal, full_name: e.target.value })} />
                  </Field>
                  <Field label="Qualification *">
                    <Input placeholder="e.g. M.Tech, PhD" value={personal.qualification} onChange={(e) => setPersonal({ ...personal, qualification: e.target.value })} />
                  </Field>
                  <Field label="Specialization *">
                    <Input placeholder="e.g. Artificial Intelligence" value={personal.specialization} onChange={(e) => setPersonal({ ...personal, specialization: e.target.value })} />
                  </Field>
                </div>
              )}

              {/* Step 3: Professional */}
              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="text-base font-semibold mb-4">Professional Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Institution ID *">
                      <Input placeholder="e.g. 1" value={professional.institution_id} onChange={(e) => setProfessional({ ...professional, institution_id: e.target.value })} />
                    </Field>
                    <Field label="Employee Code *">
                      <Input placeholder="e.g. EMP-1001" value={professional.employee_code} onChange={(e) => setProfessional({ ...professional, employee_code: e.target.value })} />
                    </Field>
                    <Field label="Experience (Years) *">
                      <Input type="number" placeholder="e.g. 5" value={professional.experience_year} onChange={(e) => setProfessional({ ...professional, experience_year: e.target.value })} />
                    </Field>
                    <Field label="Joining Date *">
                      <Input type="date" value={professional.joining_date} onChange={(e) => setProfessional({ ...professional, joining_date: e.target.value })} />
                    </Field>
                    <Field label="Department *">
                      <Input placeholder="e.g. Computer Science" value={professional.department} onChange={(e) => setProfessional({ ...professional, department: e.target.value })} />
                    </Field>
                    <Field label="Metadata">
                      <Input placeholder="e.g. HOD, Class Coordinator" value={professional.metadata} onChange={(e) => setProfessional({ ...professional, metadata: e.target.value })} />
                    </Field>
                  </div>
                </div>
              )}

              {/* Step 4: Review */}
              {step === 3 && (
                <div className="space-y-4">
                  <h3 className="text-base font-semibold mb-4">Review & Submit</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    {[
                      ["Email", account.email],
                      ["Phone", account.phone],
                      ["Full Name", personal.full_name],
                      ["Qualification", personal.qualification],
                      ["Specialization", personal.specialization],
                      ["Institution ID", professional.institution_id],
                      ["Employee Code", professional.employee_code],
                      ["Department", professional.department],
                      ["Experience (Years)", professional.experience_year],
                      ["Joining Date", professional.joining_date],
                      ["Metadata", professional.metadata],
                    ].map(([label, value]) => (
                      <div key={label} className="flex flex-col gap-0.5 bg-muted/40 rounded-lg px-3 py-2">
                        <span className="text-xs text-muted-foreground font-medium">{label}</span>
                        <span className="font-medium truncate">{value || "—"}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Teacher role will be assigned automatically upon submission.</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-6 pb-6 pt-2 border-t gap-3">
              <Button variant="outline" onClick={() => (step === 0 ? closeModal() : setStep((s) => s - 1))} disabled={loading} className="gap-2 cancel-gray-btn">
                {step === 0 ? "Cancel" : <><ChevronLeft className="h-4 w-4" /> Back</>}
              </Button>
              {step < STEPS.length - 1 ? (
                <Button onClick={handleNext} className="gap-2">Next <ChevronRight className="h-4 w-4" /></Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading} className="gap-2 min-w-[130px]">
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</> : <><Check className="h-4 w-4" /> Submit</>}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── View Details Modal ── */}
      <Dialog open={viewModalOpen && !!selectedViewTeacher} onOpenChange={(open) => { if (!open) { setViewModalOpen(false); setIsEditingView(false); } }}>
        <DialogContent className="sm:max-w-[650px] rounded-2xl border border-white/20 dark:border-white/10 admin-glass-modal p-0 overflow-hidden flex flex-col shadow-2xl">
          {selectedViewTeacher && (
            <>
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
                <DialogTitle className="text-xl font-bold text-primary">Teacher Profile</DialogTitle>
                <p className="text-xs text-muted-foreground mt-1">Detailed teacher information view</p>
              </div>

              {/* Modal Content */}
              <div className="px-6 py-6 overflow-y-auto max-h-[60vh] scrollbar-beautiful bg-background">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {TABLE_COLUMNS.map((col) => (
                    <div key={col.key} className="space-y-1 bg-zinc-50/30 dark:bg-zinc-900/10 p-3 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 block">
                        {col.label}
                      </label>
                      {isEditingView && col.key !== "id" && col.key !== "user_id" && col.key !== "created_at" && col.key !== "created_by" ? (
                        <Input
                          value={String(viewEditData?.[col.key] ?? "")}
                          onChange={(e) => setViewEditData((prev) => prev ? { ...prev, [col.key]: e.target.value } : prev)}
                          className="h-9 mt-1"
                        />
                      ) : (
                        (() => {
                          const val = selectedViewTeacher[col.key];
                          const hasTooltip = val !== undefined && val !== null && String(val).trim() !== "" && String(val) !== "—";
                          const divEl = (
                            <div className="text-sm font-semibold text-foreground pt-0.5 truncate">
                              {String(val ?? "—")}
                            </div>
                          );
                          return hasTooltip ? (
                            <CustomTooltip content={String(val)}>{divEl}</CustomTooltip>
                          ) : (
                            divEl
                          );
                        })()
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
                <Button variant="outline" onClick={() => { setViewModalOpen(false); setIsEditingView(false); }}>Close</Button>
                <div className="flex gap-2">
                  {isEditingView ? (
                    <>
                      <Button variant="outline" onClick={() => setIsEditingView(false)} className="cancel-gray-btn">Cancel</Button>
                      <Button onClick={handleViewSave} className="gap-2"><Save className="h-4 w-4" /> Save</Button>
                    </>
                  ) : (
                    <Button onClick={() => setIsEditingView(true)} className="gap-2"><Pencil className="h-4 w-4" /> Edit Teacher</Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
        title="Delete Teacher"
        description="Are you sure you want to delete this teacher's record? This action cannot be undone."
      />
    </AdminShell>
  );
};

export default TeacherCrud;
