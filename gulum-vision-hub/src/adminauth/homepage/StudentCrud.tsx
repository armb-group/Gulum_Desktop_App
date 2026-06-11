import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { createStudent, getStudents, updateStudent } from "@/services/studentCrudAPI";
import { useAuth } from "@/contexts/AuthContext";
import { AdminShell } from "./AdminShell";
import { Badge } from "@/components/ui/badge";
import { ConfirmModal } from "@/components/ConfirmModal";
import { CustomTooltip } from "@/components/CustomTooltip";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Pencil,
  Save,
  Trash2,
  Plus,
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  Copy,
  Eye
} from "lucide-react";

// ─── Interfaces ────────────────────────────────────────────────────────────────

interface Student {
  id: number;
  institution_id: string | number;
  admission_no: string;
  roll_no: string;
  full_name: string;
  dob: string;
  gender: string;
  metadata: string;
  created_at: string;
  created_by: string;
  email_id: string;
  phone_number: string;
  batch_id: string | number;
  user_id: string | number;
  classess_id: string | number;
  department_id: string | number;
}

interface AccountForm {
  email: string;
  phone: string;
  password: string;
}

interface PersonalForm {
  full_name: string;
  dob: string;
  gender: string;
}

interface AcademicForm {
  institution_id: string;
  admission_no: string;
  roll_no: string;
  batch_id: string;
  classess_id: string;
  department_id: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const STEPS = ["Account", "Personal", "Academic", "Review & Submit"];

const emptyAccount: AccountForm = { email: "", phone: "", password: "" };
const emptyPersonal: PersonalForm = { full_name: "", dob: "", gender: "" };
const emptyAcademic: AcademicForm = {
  institution_id: "",
  admission_no: "",
  roll_no: "",
  batch_id: "",
  classess_id: "",
  department_id: "",
};

const emptyStudent: Student = {
  id: 0,
  institution_id: 0,
  admission_no: "",
  roll_no: "",
  full_name: "",
  dob: "",
  gender: "",
  metadata: "",
  created_at: "",
  created_by: "",
  email_id: "",
  phone_number: "",
  batch_id: 0,
  user_id: 0,
  classess_id: 0,
  department_id: 0,
};

const HIDDEN_IN_ROW = new Set<keyof Student>(["classess_id", "batch_id", "created_by", "created_at", "metadata", "dob", "institution_id", "admission_no", "department_id"]);

const TABLE_COLUMNS: Array<{ key: keyof Student; label: string }> = [
  { key: "id", label: "ID" },
  { key: "user_id", label: "User ID" },
  { key: "institution_id", label: "Institution ID" },
  { key: "admission_no", label: "Admission No" },
  { key: "roll_no", label: "Roll No" },
  { key: "full_name", label: "Full Name" },
  { key: "dob", label: "DOB" },
  { key: "gender", label: "Gender" },
  { key: "metadata", label: "Metadata" },
  { key: "created_at", label: "Created At" },
  { key: "created_by", label: "Created By" },
  { key: "email_id", label: "Email ID" },
  { key: "phone_number", label: "Phone No" },
  { key: "batch_id", label: "Batch ID" },
  { key: "classess_id", label: "Classess ID" },
  { key: "department_id", label: "Department ID" },
];

// ─── Stepper Component ─────────────────────────────────────────────────────────

const Stepper = ({ current }: { current: number }) => (
  <div className="flex items-center justify-between mb-8 px-2">
    {STEPS.map((label, i) => (
      <div key={i} className="flex items-center flex-1 last:flex-none">
        <div className="flex flex-col items-center gap-1">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all duration-300 ${
              i < current
                ? "bg-primary border-primary text-primary-foreground"
                : i === current
                ? "border-primary text-primary bg-primary/10"
                : "border-muted-foreground/30 text-muted-foreground bg-muted/30"
            }`}
          >
            {i < current ? <Check className="h-4 w-4" /> : i + 1}
          </div>
          <span
            className={`text-xs font-medium whitespace-nowrap ${
              i === current ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {label}
          </span>
        </div>
        {i < STEPS.length - 1 && (
          <div
            className={`flex-1 h-0.5 mx-2 mb-5 transition-all duration-300 ${
              i < current ? "bg-primary" : "bg-muted-foreground/20"
            }`}
          />
        )}
      </div>
    ))}
  </div>
);

// ─── Field Component ───────────────────────────────────────────────────────────

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-medium text-foreground">{label}</label>
    {children}
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

const StudentCrud = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [tableLoading, setTableLoading] = useState(true);

  useEffect(() => {
    getStudents()
      .then((data) => setStudents(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Failed to load students."))
      .finally(() => setTableLoading(false));
  }, []);
  const [search, setSearch] = useState("");
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // View detail state
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedViewStudent, setSelectedViewStudent] = useState<Student | null>(null);
  const [isEditingView, setIsEditingView] = useState(false);
  const [viewEditData, setViewEditData] = useState<Student | null>(null);

  // Form state
  const [account, setAccount] = useState<AccountForm>(emptyAccount);
  const [personal, setPersonal] = useState<PersonalForm>(emptyPersonal);
  const [academic, setAcademic] = useState<AcademicForm>(emptyAcademic);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const overlayRef = useRef<HTMLDivElement>(null);
  const mouseDownTarget = useRef<EventTarget | null>(null);

  // ESC key to close modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && modalOpen) closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  const closeModal = () => {
    setModalOpen(false);
    setStep(0);
    setAccount(emptyAccount);
    setPersonal(emptyPersonal);
    setAcademic(emptyAcademic);
  };

  const handleViewDetails = (student: Student) => {
    setSelectedViewStudent(student);
    setViewEditData({ ...student });
    setIsEditingView(false);
    setViewModalOpen(true);
  };

  const handleViewSave = async () => {
    if (!viewEditData) return;
    try {
      await updateStudent(viewEditData.id, viewEditData);
      setStudents((prev) => prev.map((s) => (s.id === viewEditData.id ? viewEditData : s)));
      setSelectedViewStudent(viewEditData);
      setIsEditingView(false);
      toast.success("Student updated successfully!");
    } catch {
      toast.error("Failed to update student.");
    }
  };

  // ── Validation ──────────────────────────────────────────────────────────────

  const validateStep = (): boolean => {
    if (step === 0) {
      if (!account.email || !/\S+@\S+\.\S+/.test(account.email)) {
        toast.error("Enter a valid email address.");
        return false;
      }
      if (!account.phone || account.phone.length < 7) {
        toast.error("Enter a valid phone number.");
        return false;
      }
      if (!account.password || account.password.length < 6) {
        toast.error("Password must be at least 6 characters.");
        return false;
      }
    }
    if (step === 1) {
      if (!personal.full_name.trim()) {
        toast.error("Full name is required.");
        return false;
      }
      if (!personal.dob) {
        toast.error("Date of birth is required.");
        return false;
      }
      if (!personal.gender) {
        toast.error("Gender is required.");
        return false;
      }
    }
    if (step === 2) {
      const { institution_id, admission_no, roll_no, batch_id, classess_id, department_id } = academic;
      if (!institution_id || !admission_no || !roll_no || !batch_id || !classess_id || !department_id) {
        toast.error("All academic fields are required.");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) setStep((s) => s + 1);
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);

    try {
      // Create Student (registers user credentials and profile details in one call)
      await createStudent({
        institution_id: academic.institution_id,
        admission_no: academic.admission_no,
        roll_no: academic.roll_no,
        full_name: personal.full_name,
        dob: personal.dob,
        gender: personal.gender,
        email_id: account.email,
        phone_number: account.phone,
        password: account.password,
        batch_id: academic.batch_id,
        classess_id: academic.classess_id,
        department_id: academic.department_id,
        created_by: user?.name ?? "Admin",
        metadata: "",
      });

      toast.success("Student registered successfully!");
      closeModal();
      getStudents()
        .then((data) => setStudents(Array.isArray(data) ? data : []))
        .catch(() => {});
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ??
        (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ??
        "An unexpected error occurred.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Table handlers ──────────────────────────────────────────────────────────

  const filteredStudents = useMemo(
    () =>
      students.filter((s) =>
        Object.values(s).join(" ").toLowerCase().includes(search.toLowerCase())
      ),
    [students, search]
  );

  const handleCopy = (value: string) => {
    if (!value || value === "—") return;
    navigator.clipboard.writeText(value);
    toast.success("Copied to clipboard");
  };

  const handleDelete = (id: number) => {
    setDeleteTargetId(id);
  };

  const confirmDelete = () => {
    if (deleteTargetId !== null) {
      setStudents((prev) => prev.filter((s) => s.id !== deleteTargetId));
      toast.success("Student deleted successfully");
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <AdminShell title="Student Management">
      <section className="container py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Student Management</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage all students with advanced CRUD operations.</p>
          </div>

          <Button
            onClick={() => setModalOpen(true)}
            className="shadow-md hover:scale-105 transition-transform gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Student
          </Button>
        </div>

        {/* Search */}
        <Card className="p-5 rounded-2xl admin-glass">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, roll no, admission no, email..."
              className="pl-10 h-12 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </Card>
        {/* Table */}
        <Card className="overflow-x-auto rounded-2xl admin-glass-strong">
          <div className="flex flex-col gap-4 p-4 lg:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Student Directory</p>
                <h2 className="text-base font-semibold text-foreground">{filteredStudents.length} students found</h2>
              </div>
              <div className="text-sm text-muted-foreground">Latest updates appear automatically.</div>
            </div>

            {/* Search Bar in between */}
            <div className="relative my-2">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, roll no, admission no, email..."
                className="pl-10 h-11 rounded-xl bg-card border-border shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {tableLoading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                <Loader2 className="h-5 w-5 animate-spin" /> Loading students...
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <p className="text-sm">No students match your search.</p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto rounded-lg border border-slate-300">
                <table className="w-full border-collapse text-sm">
                  <thead style={{ background: "#752B2A" }} className="text-left text-xs font-bold uppercase tracking-wider text-white">
                    <tr>
                      {TABLE_COLUMNS.filter((col) => !HIDDEN_IN_ROW.has(col.key)).map((column) => (
                        <th key={column.key} className="px-3 py-2 border-b border-slate-500" style={column.key === "id" || column.key === "user_id" ? { width: "140px", minWidth: "140px" } : {}}>
                          {column.label}
                        </th>
                      ))}
                      <th className="px-3 py-2 border-b border-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student, index) => (
                      <tr key={student.id} className={`border-b border-slate-300 transition-colors duration-200 hover:bg-slate-50 ${index % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                        {TABLE_COLUMNS.filter((col) => !HIDDEN_IN_ROW.has(col.key)).map((column) => {
                          const value = student[column.key];
                          return (
                            <td key={column.key} className={`px-3 py-2 align-middle border-r border-slate-300 last:border-r-0 ${column.key === "id" || column.key === "user_id" ? "w-36" : "max-w-[15rem]"}`}>
                              <div className="flex items-center justify-between gap-2 group/cell">
                                {(() => {
                                  const hasTooltip = value !== undefined && value !== null && String(value).trim() !== "" && String(value) !== "—";
                                  const contentStr = String(value ?? "");

                                  const getElement = () => {
                                    if (column.key === "full_name") {
                                      return <span className="font-semibold text-indigo-700">{String(value ?? "—")}</span>;
                                    } else if (column.key === "email_id") {
                                      return <span className="text-blue-600 text-xs">{String(value ?? "—")}</span>;
                                    } else if (column.key === "admission_no") {
                                      return <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">{String(value ?? "—")}</span>;
                                    } else if (column.key === "roll_no") {
                                      return <span className="bg-emerald-100 text-emerald-700 text-xs font-medium px-2 py-0.5 rounded-full">{String(value ?? "—")}</span>;
                                    } else if (column.key === "gender") {
                                      return (
                                        <Badge className={String(value).toLowerCase() === "female" ? "bg-pink-100 text-pink-700 hover:bg-pink-100" : String(value).toLowerCase() === "male" ? "bg-sky-100 text-sky-700 hover:bg-sky-100" : "bg-slate-100 text-slate-600 hover:bg-slate-100"}>
                                          {String(value || "—")}
                                        </Badge>
                                      );
                                    } else if (column.key === "id" || column.key === "user_id") {
                                      return <span className="text-slate-500 text-xs font-mono">{String(value ?? "—").slice(0, 8) + (String(value ?? "").length > 8 ? "..." : "")}</span>;
                                    } else {
                                      return <span className="text-slate-700 text-xs">{String(value ?? "—")}</span>;
                                    }
                                  };

                                  const element = getElement();
                                  if (hasTooltip && column.key !== "gender") {
                                    return <CustomTooltip content={contentStr}>{element}</CustomTooltip>;
                                  }
                                  return element;
                                })()}
                                {value && value !== "—" && (
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
                              <Button size="sm" variant="outline" onClick={() => handleViewDetails(student)} className="rounded-lg hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </CustomTooltip>
                            <CustomTooltip content="Delete Student">
                              <Button size="sm" variant="destructive" onClick={() => handleDelete(student.id)} className="rounded-lg">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </CustomTooltip>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      </section>

      {/* ── Modal ── */}
      {modalOpen && (
        <div
          ref={overlayRef}
          onMouseDown={(e) => { mouseDownTarget.current = e.target; }}
          onClick={(e) => { if (e.target === overlayRef.current && mouseDownTarget.current === overlayRef.current) closeModal(); }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-2xl mx-4 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto admin-glass-modal">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b">
              <div>
                <h2 className="text-xl font-bold">Register New Student</h2>
                <p className="text-sm text-muted-foreground">Step {step + 1} of {STEPS.length}</p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-muted transition text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-6">
              <Stepper current={step} />

              {/* Step 1: Account Information */}
              {step === 0 && (
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-foreground mb-4">Account Information</h3>
                  <Field label="Email *">
                    <Input
                      type="email"
                      placeholder="student@example.com"
                      value={account.email}
                      onChange={(e) => setAccount({ ...account, email: e.target.value })}
                    />
                  </Field>
                  <Field label="Phone *">
                    <Input
                      placeholder="e.g. 9876543210"
                      value={account.phone}
                      onChange={(e) => setAccount({ ...account, phone: e.target.value })}
                    />
                  </Field>
                  <Field label="Password *">
                    <Input
                      type="password"
                      placeholder="Min. 6 characters"
                      value={account.password}
                      onChange={(e) => setAccount({ ...account, password: e.target.value })}
                    />
                  </Field>
                </div>
              )}

              {/* Step 2: Personal Information */}
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-foreground mb-4">Personal Information</h3>
                  <Field label="Full Name *">
                    <Input
                      placeholder="e.g. Amit Kumar"
                      value={personal.full_name}
                      onChange={(e) => setPersonal({ ...personal, full_name: e.target.value })}
                    />
                  </Field>
                  <Field label="Date of Birth *">
                    <Input
                      type="date"
                      value={personal.dob}
                      onChange={(e) => setPersonal({ ...personal, dob: e.target.value })}
                    />
                  </Field>
                  <Field label="Gender *">
                    <select
                      value={personal.gender}
                      onChange={(e) => setPersonal({ ...personal, gender: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </Field>
                </div>
              )}

              {/* Step 3: Academic Information */}
              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-foreground mb-4">Academic Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Institution ID *">
                      <Input
                        placeholder="e.g. 1"
                        value={academic.institution_id}
                        onChange={(e) => setAcademic({ ...academic, institution_id: e.target.value })}
                      />
                    </Field>
                    <Field label="Admission No *">
                      <Input
                        placeholder="e.g. ADM-1001"
                        value={academic.admission_no}
                        onChange={(e) => setAcademic({ ...academic, admission_no: e.target.value })}
                      />
                    </Field>
                    <Field label="Roll No *">
                      <Input
                        placeholder="e.g. ROLL-01"
                        value={academic.roll_no}
                        onChange={(e) => setAcademic({ ...academic, roll_no: e.target.value })}
                      />
                    </Field>
                    <Field label="Batch ID *">
                      <Input
                        placeholder="e.g. 101"
                        value={academic.batch_id}
                        onChange={(e) => setAcademic({ ...academic, batch_id: e.target.value })}
                      />
                    </Field>
                    <Field label="Classess ID *">
                      <Input
                        placeholder="e.g. 1"
                        value={academic.classess_id}
                        onChange={(e) => setAcademic({ ...academic, classess_id: e.target.value })}
                      />
                    </Field>
                    <Field label="Department ID *">
                      <Input
                        placeholder="e.g. 10"
                        value={academic.department_id}
                        onChange={(e) => setAcademic({ ...academic, department_id: e.target.value })}
                      />
                    </Field>
                  </div>
                </div>
              )}

              {/* Step 4: Review & Submit */}
              {step === 3 && (
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-foreground mb-4">Review & Submit</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    {[
                      ["Email", account.email],
                      ["Phone", account.phone],
                      ["Full Name", personal.full_name],
                      ["Date of Birth", personal.dob],
                      ["Gender", personal.gender],
                      ["Institution ID", academic.institution_id],
                      ["Admission No", academic.admission_no],
                      ["Roll No", academic.roll_no],
                      ["Batch ID", academic.batch_id],
                      ["Classess ID", academic.classess_id],
                      ["Department ID", academic.department_id],
                    ].map(([label, value]) => (
                      <div key={label} className="flex flex-col gap-0.5 bg-muted/40 rounded-lg px-3 py-2">
                        <span className="text-xs text-muted-foreground font-medium">{label}</span>
                        <span className="font-medium truncate">{value || "—"}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Student role will be assigned automatically upon submission.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 pb-6 pt-2 border-t gap-3">
              <Button
                variant="outline"
                onClick={() => (step === 0 ? closeModal() : setStep((s) => s - 1))}
                disabled={loading}
                className="gap-2"
              >
                {step === 0 ? (
                  "Cancel"
                ) : (
                  <><ChevronLeft className="h-4 w-4" /> Back</>
                )}
              </Button>

              {step < STEPS.length - 1 ? (
                <Button onClick={handleNext} className="gap-2">
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading} className="gap-2 min-w-[130px]">
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
                  ) : (
                    <><Check className="h-4 w-4" /> Submit</>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── View Details Modal ── */}
      {viewModalOpen && selectedViewStudent && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setViewModalOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl mx-4 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-hidden flex flex-col admin-glass-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h2 className="text-xl font-bold text-primary">Student Profile</h2>
                <p className="text-xs text-muted-foreground">Detailed information view</p>
              </div>
              <button
                onClick={() => setViewModalOpen(false)}
                className="p-2 rounded-lg hover:bg-muted transition text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-6 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {TABLE_COLUMNS.map((column) => (
                  <div key={column.key} className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {column.label}
                    </label>
                    {isEditingView ? (
                      <Input
                        value={String(viewEditData?.[column.key] ?? "")}
                        onChange={(e) => setViewEditData((prev) => prev ? { ...prev, [column.key]: e.target.value } : prev)}
                        className="h-9"
                      />
                    ) : (
                      (() => {
                        const val = selectedViewStudent[column.key];
                        const hasTooltip = val !== undefined && val !== null && String(val).trim() !== "" && String(val) !== "—";
                        const divEl = (
                          <div className="text-sm font-medium border-b border-muted/30 pb-1.5 truncate">
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
            <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/20">
              <Button variant="outline" onClick={() => { setViewModalOpen(false); setIsEditingView(false); }}>Close</Button>
              <div className="flex gap-2">
                {isEditingView ? (
                  <>
                    <Button variant="outline" onClick={() => setIsEditingView(false)}>Cancel</Button>
                    <Button onClick={handleViewSave} className="gap-2"><Save className="h-4 w-4" /> Save</Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditingView(true)} className="gap-2"><Pencil className="h-4 w-4" /> Edit</Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
        title="Delete Student"
        description="Are you sure you want to delete this student's record? This action cannot be undone."
      />
    </AdminShell>
  );
};

export default StudentCrud;
