import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { getTeachers, createUser, createTeacher, updateTeacher } from "@/services/teacherCrudAPI";
import { AdminShell } from "./AdminShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, Pencil, Save, Trash2, Plus, X,
  ChevronRight, ChevronLeft, Check, Loader2, Copy, Eye
} from "lucide-react";

// ─── Interfaces ────────────────────────────────────────────────────────────────

interface Teacher {
  id: number;
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
}

interface AccountForm { email: string; phone: string; password: string; }
interface PersonalForm { full_name: string; qualification: string; specialization: string; }
interface ProfessionalForm {
  institution_id: string;
  employee_code: string;
  experience_year: string;
  joining_date: string;
  metadata: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const STEPS = ["Account", "Personal", "Professional", "Review & Submit"];

const emptyAccount: AccountForm = { email: "", phone: "", password: "" };
const emptyPersonal: PersonalForm = { full_name: "", qualification: "", specialization: "" };
const emptyProfessional: ProfessionalForm = {
  institution_id: "", employee_code: "", experience_year: "", joining_date: "", metadata: "",
};

const emptyTeacher: Teacher = {
  id: 0, user_id: 0, institution_id: 0, employee_code: "", full_name: "",
  qualification: "", specialization: "", experience_year: 0, joining_date: "",
  metadata: "", is_active: true, created_at: "", created_by: "", email: "", phone: "",
};

const truncate = (val: string, len = 10) =>
  val && val.length > len ? val.slice(0, len) + "..." : val;

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
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [tableLoading, setTableLoading] = useState(true);

  useEffect(() => {
    getTeachers()
      .then((data) => setTeachers(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Failed to load teachers."))
      .finally(() => setTableLoading(false));
  }, []);

  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedTeacher, setEditedTeacher] = useState<Teacher | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedViewTeacher, setSelectedViewTeacher] = useState<Teacher | null>(null);

  const [account, setAccount] = useState<AccountForm>(emptyAccount);
  const [personal, setPersonal] = useState<PersonalForm>(emptyPersonal);
  const [professional, setProfessional] = useState<ProfessionalForm>(emptyProfessional);

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
      const { institution_id, employee_code, experience_year, joining_date } = professional;
      if (!institution_id || !employee_code || !experience_year || !joining_date) {
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
      // Step 1: Create User
      const userData = await createUser({ email: account.email, phone: account.phone, password: account.password });
      const userId = userData?.user_id ?? userData?.id ?? userData?.data?.user_id ?? userData?.data?.id;
      if (!userId) throw new Error(`User creation failed: no user_id returned. Received: ${JSON.stringify(userData)}`);

      // Step 2: Create Teacher
      const teacherData = await createTeacher({
        user_id: userId,
        institution_id: professional.institution_id,
        employee_code: professional.employee_code,
        full_name: personal.full_name,
        qualification: personal.qualification,
        specialization: personal.specialization,
        experience_year: professional.experience_year,
        joining_date: professional.joining_date,
        metadata: professional.metadata,
        email: account.email,
        phone: account.phone,
        created_by: "Admin",
      });

      const newTeacher: Teacher = {
        ...emptyTeacher,
        ...teacherData,
        id: teacherData?.id ?? teachers.length + 1,
        user_id: userId,
        institution_id: professional.institution_id,
        employee_code: professional.employee_code,
        full_name: personal.full_name,
        qualification: personal.qualification,
        specialization: personal.specialization,
        experience_year: professional.experience_year,
        joining_date: professional.joining_date,
        metadata: professional.metadata,
        email: account.email,
        phone: account.phone,
        created_by: "Admin",
        created_at: new Date().toISOString().split("T")[0],
      };

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
    () => teachers.filter((t) => Object.values(t).join(" ").toLowerCase().includes(search.toLowerCase())),
    [teachers, search]
  );

  const handleEdit = (teacher: Teacher) => { setEditingId(teacher.id); setEditedTeacher({ ...teacher }); };

  const handleSave = async () => {
    if (!editedTeacher) return;
    try {
      await updateTeacher(editingId, editedTeacher);
      setTeachers((prev) => prev.map((t) => (t.id === editingId ? editedTeacher : t)));
      toast.success("Teacher updated successfully!");
    } catch {
      toast.error("Failed to update teacher.");
    } finally {
      setEditingId(null);
      setEditedTeacher(null);
    }
  };

  const handleDelete = (id: number) => setTeachers((prev) => prev.filter((t) => t.id !== id));

  const handleCopy = (value: string) => {
    if (!value || value === "—") return;
    navigator.clipboard.writeText(value);
    toast.success("Copied to clipboard");
  };

  const handleChange = (field: keyof Teacher, value: string) => {
    if (!editedTeacher) return;
    setEditedTeacher({ ...editedTeacher, [field]: value });
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <AdminShell title="Teacher Management">
      <section className="container py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
              Teacher Management
            </h1>
            <p className="text-muted-foreground mt-2">Manage all teachers with advanced CRUD operations.</p>
          </div>
          <Button onClick={() => setModalOpen(true)} className="shadow-md hover:scale-105 transition-transform gap-2">
            <Plus className="h-4 w-4" /> Add Teacher
          </Button>
        </div>

        {/* Search */}
        <Card className="p-5 rounded-2xl border-0 shadow-md bg-gradient-to-r from-background to-muted/40">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, employee code, email, specialization..."
              className="pl-10 h-12 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </Card>

        {/* Table */}
        <Card className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-xl">
          <div className="flex flex-col gap-4 p-4 lg:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Teacher Directory</p>
                <h2 className="text-2xl font-semibold text-foreground">{filteredTeachers.length} teachers found</h2>
              </div>
              <div className="text-sm text-muted-foreground">Latest updates appear automatically.</div>
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
              <div className="min-w-[800px] overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-0 text-xs">
                  <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-left text-xs uppercase tracking-[0.12em] text-white border-b border-blue-700">
                    <tr>
                      {TABLE_COLUMNS.map((col) => (
                        <th key={col.key} className="px-4 py-3 font-semibold text-white border-r border-blue-500 last:border-r-0">
                          {col.label}
                        </th>
                      ))}
                      <th className="px-4 py-3 font-semibold text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeachers.map((teacher, index) => {
                      const isEditing = editingId === teacher.id;
                      return (
                        <tr key={teacher.id} className={`border-b border-slate-100 transition-colors hover:bg-indigo-50 ${index % 2 === 0 ? "bg-white" : "bg-gradient-to-r from-blue-50/60 to-indigo-50/40"}`}>
                          {TABLE_COLUMNS.map((col) => {
                            const value = teacher[col.key];
                            return (
                              <td key={col.key} className="px-4 py-4 align-top max-w-[15rem] border-r border-slate-200 last:border-r-0">
                                {isEditing ? (
                                  <Input
                                    value={String(editedTeacher?.[col.key] ?? "")}
                                    onChange={(e) => handleChange(col.key, e.target.value)}
                                    className="h-9"
                                  />
                                ) : (
                                  <div className="flex items-center justify-between gap-2 group/cell">
                                    {col.key === "full_name" ? (
                                      <span title={String(value ?? "")} className="font-semibold text-indigo-700">{truncate(String(value ?? "—"), 14)}</span>
                                    ) : col.key === "email" ? (
                                      <span title={String(value ?? "")} className="text-blue-600 text-xs">{truncate(String(value ?? "—"), 16)}</span>
                                    ) : col.key === "employee_code" ? (
                                      <span title={String(value ?? "")} className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">{truncate(String(value ?? "—"))}</span>
                                    ) : col.key === "is_active" ? (
                                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${value ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                                        {value ? "Active" : "Inactive"}
                                      </span>
                                    ) : (
                                      <span title={String(value ?? "")} className="text-slate-700 text-xs">{truncate(String(value ?? "—"))}</span>
                                    )}
                                    {value !== undefined && value !== "—" && (
                                      <button
                                        onClick={() => handleCopy(String(value))}
                                        className="opacity-0 group-hover/cell:opacity-100 text-muted-foreground hover:text-primary transition-opacity p-1"
                                        title="Copy"
                                      >
                                        <Copy className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-4 py-4 align-top">
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" onClick={() => { setSelectedViewTeacher(teacher); setViewModalOpen(true); }} className="rounded-lg hover:bg-indigo-100 hover:text-indigo-700">
                                <Eye className="h-4 w-4" />
                              </Button>
                              {isEditing ? (
                                <Button size="sm" onClick={handleSave} className="rounded-lg"><Save className="h-4 w-4" /></Button>
                              ) : (
                                <Button size="sm" variant="outline" onClick={() => handleEdit(teacher)} className="rounded-lg"><Pencil className="h-4 w-4" /></Button>
                              )}
                              <Button size="sm" variant="destructive" onClick={() => handleDelete(teacher.id)} className="rounded-lg"><Trash2 className="h-4 w-4" /></Button>
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
          <div className="relative w-full max-w-2xl mx-4 bg-background rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">

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
              <Button variant="outline" onClick={() => (step === 0 ? closeModal() : setStep((s) => s - 1))} disabled={loading} className="gap-2">
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
      {viewModalOpen && selectedViewTeacher && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setViewModalOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl mx-4 bg-background rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h2 className="text-xl font-bold text-primary">Teacher Profile</h2>
                <p className="text-xs text-muted-foreground">Detailed information view</p>
              </div>
              <button onClick={() => setViewModalOpen(false)} className="p-2 rounded-lg hover:bg-muted transition text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-6 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {TABLE_COLUMNS.map((col) => (
                  <div key={col.key} className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{col.label}</label>
                    <div className="text-sm font-medium border-b border-muted/30 pb-1.5 truncate" title={String(selectedViewTeacher[col.key] ?? "—")}>
                      {String(selectedViewTeacher[col.key] ?? "—")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-end px-6 py-4 border-t bg-muted/20">
              <Button onClick={() => setViewModalOpen(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
};

export default TeacherCrud;
