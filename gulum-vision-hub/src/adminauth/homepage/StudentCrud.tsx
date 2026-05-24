import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { createUser, createStudent } from "@/services/studentCrudAPI";
import { AdminShell } from "./AdminShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Copy, Pencil, Save, Trash2, Plus, X, ChevronRight, ChevronLeft, Check, Loader2 } from "lucide-react";

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

const initialStudents: Student[] = [
  {
    id: 1,
    institution_id: 1,
    admission_no: "ADM-1001",
    roll_no: "ROLL-01",
    full_name: "Amit Kumar",
    dob: "2003-04-12",
    gender: "Male",
    metadata: "Topper",
    created_at: "2026-05-18",
    created_by: "Admin",
    email_id: "amit@example.com",
    phone_number: "9876543210",
    batch_id: 101,
    user_id: 201,
    classess_id: 1,
    department_id: 10,
  },
  {
    id: 2,
    institution_id: 1,
    admission_no: "ADM-1002",
    roll_no: "ROLL-02",
    full_name: "Priya Sharma",
    dob: "2004-08-20",
    gender: "Female",
    metadata: "Class Representative",
    created_at: "2026-05-18",
    created_by: "Admin",
    email_id: "priya@example.com",
    phone_number: "9123456780",
    batch_id: 102,
    user_id: 202,
    classess_id: 2,
    department_id: 11,
  },
];

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
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedStudent, setEditedStudent] = useState<Student | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Form state
  const [account, setAccount] = useState<AccountForm>(emptyAccount);
  const [personal, setPersonal] = useState<PersonalForm>(emptyPersonal);
  const [academic, setAcademic] = useState<AcademicForm>(emptyAcademic);

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
      // Step 1: Create User
      const userData = await createUser({
        email: account.email,
        phone: account.phone,
        password: account.password,
      });

      const userId: string | number =
        userData?.user_id ??
        userData?.id ??
        userData?.data?.user_id ??
        userData?.data?.id;
      if (!userId)
        throw new Error(
          `User creation failed: no user_id returned. Received: ${JSON.stringify(userData)}`
        );

      // Step 2: Create Student Record
      const studentData = await createStudent({
        institution_id: academic.institution_id,
        admission_no: academic.admission_no,
        roll_no: academic.roll_no,
        full_name: personal.full_name,
        dob: personal.dob,
        gender: personal.gender,
        email_id: account.email,
        phone_number: account.phone,
        batch_id: academic.batch_id,
        classess_id: academic.classess_id,
        department_id: academic.department_id,
        user_id: userId,
        created_by: "Admin",
        metadata: "",
      });

      const newStudent: Student = {
        ...emptyStudent,
        ...studentData,
        id: studentData?.id ?? students.length + 1,
        institution_id: academic.institution_id,
        admission_no: academic.admission_no,
        roll_no: academic.roll_no,
        full_name: personal.full_name,
        dob: personal.dob,
        gender: personal.gender,
        email_id: account.email,
        phone_number: account.phone,
        batch_id: academic.batch_id,
        classess_id: academic.classess_id,
        department_id: academic.department_id,
        user_id: userId,
        created_by: "Admin",
        created_at: new Date().toISOString().split("T")[0],
      };

      setStudents((prev) => [...prev, newStudent]);
      toast.success("Student registered successfully!");
      closeModal();
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

  const handleEdit = (student: Student) => {
    setEditingId(student.id);
    setEditedStudent({ ...student });
  };

  const handleSave = () => {
    if (!editedStudent) return;
    setStudents((prev) => prev.map((s) => (s.id === editingId ? editedStudent : s)));
    setEditingId(null);
    setEditedStudent(null);
  };

  const handleDelete = (id: number) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
  };

  const handleCopy = (value: string) => navigator.clipboard.writeText(value);

  const handleChange = (field: keyof Student, value: string) => {
    if (!editedStudent) return;
    setEditedStudent({ ...editedStudent, [field]: value });
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <AdminShell title="Student Management">
      <section className="container py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
              Student Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage all students with advanced CRUD operations.
            </p>
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
        <Card className="p-5 rounded-2xl border-0 shadow-md bg-gradient-to-r from-background to-muted/40">
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
        <Card className="overflow-auto rounded-2xl border-0 shadow-xl">
          <table className="w-full min-w-[1900px] text-sm">
            <thead className="bg-primary text-primary-foreground">
              <tr>
                {[
                  "ID", "Institution ID", "Admission No", "Roll No", "Full Name",
                  "DOB", "Gender", "Metadata", "Created At", "Created By",
                  "Email ID", "Phone Number", "Batch ID", "User ID", "Classess ID",
                  "Department ID", "Actions",
                ].map((head) => (
                  <th key={head} className="px-4 py-4 text-left whitespace-nowrap font-semibold">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, index) => {
                const isEditing = editingId === student.id;
                return (
                  <tr
                    key={student.id}
                    className={`border-b hover:bg-muted/40 transition ${
                      index % 2 === 0 ? "bg-background" : "bg-muted/20"
                    }`}
                  >
                    {Object.entries(student).map(([key, value]) => (
                      <td key={key} className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <Input
                              value={String(editedStudent?.[key as keyof Student] ?? "")}
                              onChange={(e) => handleChange(key as keyof Student, e.target.value)}
                              className="h-9"
                            />
                          ) : (
                            <span>{String(value)}</span>
                          )}
                          <button
                            onClick={() => handleCopy(String(value))}
                            className="text-muted-foreground hover:text-primary transition"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <Button size="sm" onClick={handleSave} className="rounded-lg">
                            <Save className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => handleEdit(student)} className="rounded-lg">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(student.id)} className="rounded-lg">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
          <div className="relative w-full max-w-2xl mx-4 bg-background rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">

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
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
    </AdminShell>
  );
};

export default StudentCrud;
