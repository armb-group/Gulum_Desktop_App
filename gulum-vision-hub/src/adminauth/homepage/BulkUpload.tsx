import { useState, useEffect, useRef, useMemo } from "react";
import * as XLSX from "xlsx";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Upload, FileText, Download, CheckCircle2, GraduationCap, UserCog, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "./AdminShell";
import { useGetRoles } from "@/services/roleAPI";
import { useUploadBulkFile } from "@/services/uploadAPI";
import { useAuth } from "@/contexts/AuthContext";
import { useGetDepartments, useGetAcademicBatchesByDepartment } from "@/services/departmentAPI";
import { initialData as deptData } from "./departmentsData";

type Row = Record<string, string>;
type UploadRole = "student" | "teacher";

interface RoleData {
  id: string;
  name?: string;
  roleName?: string;
  title?: string;
}

const SAMPLES: Record<UploadRole, string> = {
  student: `name,email,role,department
Aisha Khan,aisha@example.edu,student,Computer Science
Ravi Patel,ravi@example.edu,student,Mathematics`,
  teacher: `name,email,role,department
Dr. Mei Lin,mei@example.edu,teacher,Physics
Prof. John Doe,john@example.edu,teacher,Chemistry`,
};

const getSampleCSV = (roleName: string) => {
  const normalized = roleName.toLowerCase();
  if (normalized === "student") {
    return SAMPLES.student;
  }
  if (normalized === "teacher") {
    return SAMPLES.teacher;
  }
  return `name,email,role,department\nJohn Doe,john@example.edu,${normalized},Computer Science`;
};

const getRoleIcon = (name: string) => {
  const norm = name.toLowerCase();
  if (norm === "student") return <GraduationCap className="h-4 w-4" />;
  if (norm === "teacher") return <UserCog className="h-4 w-4" />;
  return <User className="h-4 w-4" />;
};

const BulkUpload = () => {
  const { user } = useAuth();
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [fileName, setFileName] = useState("");
  const [completed, setCompleted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Selector states
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedSectionName, setSelectedSectionName] = useState<string>("");

  // TanStack Query Hooks for roles
  const { data: rawRoles, isLoading: loading } = useGetRoles();
  const roles = useMemo(() => {
    const rawList = Array.isArray(rawRoles) ? rawRoles : [];
    if (rawList.length === 0 && !loading) {
      return [
        { id: "student-fallback", name: "Student" },
        { id: "teacher-fallback", name: "Teacher" },
      ];
    }
    return rawList
      .map((r, index) => {
        if (typeof r === "string") {
          return { id: r, name: r };
        }
        if (r && typeof r === "object") {
          const id = r.id ?? r.roleId ?? `role-${index}`;
          const name = r.name ?? r.roleName ?? r.title ?? "";
          return { id: String(id), name: String(name) };
        }
        return { id: `role-${index}`, name: "" };
      })
      .filter((r) => r.name.toLowerCase() !== "admin");
  }, [rawRoles, loading]);

  const selectedRole = roles.find((r) => r.id === selectedRoleId);
  const rawRoleName = selectedRole ? (selectedRole.name ?? "") : "";
  const roleName = rawRoleName.toLowerCase() === "user" ? "Student" : rawRoleName;

  // TanStack Query for departments
  const { data: rawDepts, isLoading: loadingDepts } = useGetDepartments();
  const departments = useMemo(() => {
    const list = Array.isArray(rawDepts) ? rawDepts.map((d: any) => ({
      id: String(d.id ?? d.departmentId ?? d.department_id ?? ""),
      name: d.name ?? d.departmentName ?? d.department_name ?? "Unknown Department",
    })) : [];
    return list.length > 0 ? list : deptData;
  }, [rawDepts]);

  // TanStack Query for batches
  const { data: rawBatches, isLoading: loadingBatches } = useGetAcademicBatchesByDepartment(selectedDeptId, {
    enabled: !!selectedDeptId
  });
  const batches = useMemo(() => {
    if (!rawBatches) return [];
    return Array.isArray(rawBatches) ? rawBatches : (rawBatches.responseData ?? rawBatches.data ?? []);
  }, [rawBatches]);

  // Reset dependent selector states
  useEffect(() => {
    setSelectedYear("");
    setSelectedSectionName("");
  }, [selectedDeptId]);

  useEffect(() => {
    setSelectedSectionName("");
  }, [selectedYear]);

  // Derived available Years and Sections
  const availableYears = useMemo(() => {
    if (batches.length > 0) {
      const list = Array.from(new Set(batches.map((b: any) => b.year).filter(Boolean))) as string[];
      return [...list].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    } else {
      const dept = deptData.find(d => d.id === selectedDeptId);
      return dept?.years.map(y => y.year) || [];
    }
  }, [batches, selectedDeptId]);

  const availableSections = useMemo(() => {
    if (batches.length > 0) {
      const matchingBatches = batches.filter((b: any) => b.year === selectedYear);
      const sections: string[] = [];
      matchingBatches.forEach((b: any) => {
        if (b.classes && Array.isArray(b.classes)) {
          b.classes.forEach((c: any) => {
            if (c.name) sections.push(c.name);
          });
        }
      });
      return Array.from(new Set(sections));
    } else {
      const dept = deptData.find(d => d.id === selectedDeptId);
      const yearObj = dept?.years.find(y => y.year === selectedYear);
      return yearObj?.sections.map(s => s.name) || [];
    }
  }, [batches, selectedDeptId, selectedYear]);

  // Find selected batchId and classId
  const { batchId, classId } = useMemo(() => {
    if (!selectedDeptId || !selectedYear) return { batchId: "", classId: "" };
    const selectedBatch = batches.find((b: any) => b.year === selectedYear);
    const batchId = selectedBatch?.batchId ?? selectedBatch?.id ?? "";
    const matchingClass = selectedBatch?.classes?.find(
      (c: any) => c.name === selectedSectionName
    );
    const classId = matchingClass?.id ?? "";
    return { batchId, classId };
  }, [batches, selectedDeptId, selectedYear, selectedSectionName]);

  const uploadMutation = useUploadBulkFile();
  const uploading = uploadMutation.isPending;

  const isUploadEnabled = !!roleName && !!selectedDeptId && !!selectedYear && !!selectedSectionName;

  const handleFile = (file: File) => {
    if (!roleName) {
      toast.error("Please select a role before uploading.");
      return;
    }
    if (!selectedDeptId || !selectedYear || !selectedSectionName) {
      toast.error("Please select department, year, and section first.");
      return;
    }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx' && ext !== 'xls') {
      toast.error("Invalid file format. Please upload an Excel file (.xlsx or .xls).");
      return;
    }

    setFileName(file.name);

    const rawRole = selectedRole ? (selectedRole.name ?? "").toLowerCase() : "";

    uploadMutation.mutate(
      {
        role: rawRole,
        file,
        params: {
          institutionId: user?.institutionId ?? "",
          batchId,
          createdBy: user?.name ?? "",
          departmentId: selectedDeptId,
          classesId: classId, // for student
          classId: classId,   // for teacher
        }
      },
      {
        onSuccess: () => {
          toast.success(`Bulk upload for ${roleName} completed successfully!`);
          setCompleted(true);
        },
        onError: (err: any) => {
          console.error("Bulk upload error:", err);
          const errorMsg = err.response?.data?.message ?? err.message ?? "Upload failed";
          toast.error(`Upload failed: ${errorMsg}`);
        }
      }
    );
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isUploadEnabled) {
      toast.error("Please select department, year, and section first.");
      return;
    }
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const downloadSampleForRole = (role: string) => {
    let headers: string[] = [];
    let sampleData: Record<string, any>[] = [];

    const norm = role.toLowerCase();
    if (norm === "student") {
      headers = ["admissionNo", "dob", "emailId", "fullName", "gender", "metadata", "phoneNumber", "rollNo", "parentEmail"];
      sampleData = [
        {
          admissionNo: "ADM0025",
          dob: "23-05-2004",
          emailId: "asde12@gmail.com",
          fullName: "Sudhir Das",
          gender: "Male",
          metadata: "student",
          phoneNumber: "9856314752",
          rollNo: "112",
          parentEmail: "parentD1@gmail.com"
        }
      ];
    } else if (norm === "teacher") {
      headers = ["employeeCode", "fullName", "email", "phone", "qualification", "specialization", "experienceYears", "joiningDate", "metadata", "isActive"];
      sampleData = [
        {
          employeeCode: "EMP0011",
          fullName: "Ananya Sen",
          email: "ananya.sen@gmail.com",
          phone: "9876543210",
          qualification: "M.Sc",
          specialization: "Mathematics",
          experienceYears: 5,
          joiningDate: "2022-07-01",
          metadata: "Assistante Teacher",
          isActive: true
        }
      ];
    } else {
      headers = ["fullName", "email", "role", "department"];
      sampleData = [
        {
          fullName: "John Doe",
          email: "john@example.edu",
          role: norm,
          department: "Computer Science"
        }
      ];
    }

    const worksheet = XLSX.utils.json_to_sheet(sampleData, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, `gulum-${norm}-template.xlsx`);
  };


  const reset = () => {
    setCompleted(false);
    setFileName("");
    setSelectedDeptId("");
    setSelectedYear("");
    setSelectedSectionName("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <AdminShell title="Bulk Upload">
      <section className="container py-10 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Bulk Upload</h1>
            <p className="text-muted-foreground mt-1">
              Select a role, then upload an Excel sheet (.xlsx, .xls) to import records.
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" /> Download template
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 admin-glass border border-border/40 backdrop-blur-md">
              <DropdownMenuItem onClick={() => downloadSampleForRole("student")} className="cursor-pointer flex items-center gap-2">
                <GraduationCap className="h-4 w-4" /> Student Template
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => downloadSampleForRole("teacher")} className="cursor-pointer flex items-center gap-2">
                <UserCog className="h-4 w-4" /> Teacher Template
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Card className="p-6 rounded-2xl admin-glass">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Role Selector */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Role</Label>
              <Select
                value={selectedRoleId}
                onValueChange={(v) => {
                  setSelectedRoleId(v);
                  reset();
                }}
                disabled={loading}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder={loading ? "Loading roles…" : "Choose a role…"} />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => {
                    const name = r.name ? (r.name.toLowerCase() === "user" ? "STUDENT" : r.name) : "";
                    return (
                      <SelectItem key={r.id} value={r.id}>
                        <span className="inline-flex items-center gap-2">
                          {getRoleIcon(name)} {name}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Department Selector */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Department</Label>
              {loadingDepts ? (
                <div className="h-11 w-full bg-muted animate-pulse rounded-xl flex items-center justify-center text-xs text-muted-foreground">
                  Loading departments...
                </div>
              ) : (
                <Select
                  value={selectedDeptId}
                  onValueChange={setSelectedDeptId}
                  disabled={!roleName}
                >
                  <SelectTrigger className="h-11 rounded-xl disabled:opacity-50">
                    <SelectValue placeholder={roleName ? "Choose Department" : "Select role first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Year Selector */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Year</Label>
              {loadingBatches ? (
                <div className="h-11 w-full bg-muted animate-pulse rounded-xl flex items-center justify-center text-xs text-muted-foreground">
                  Loading years...
                </div>
              ) : (
                <Select
                  value={selectedYear}
                  onValueChange={setSelectedYear}
                  disabled={!selectedDeptId}
                >
                  <SelectTrigger className="h-11 rounded-xl disabled:opacity-50">
                    <SelectValue placeholder={selectedDeptId ? "Choose Year" : "Select department first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Section Selector */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Section</Label>
              <Select
                value={selectedSectionName}
                onValueChange={setSelectedSectionName}
                disabled={!selectedYear}
              >
                <SelectTrigger className="h-11 rounded-xl disabled:opacity-50">
                  <SelectValue placeholder={selectedYear ? "Choose Section" : "Select year first"} />
                </SelectTrigger>
                <SelectContent>
                  {availableSections.map((sec) => (
                    <SelectItem key={sec} value={sec}>
                      {sec}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {completed ? (
          <Card className="p-10 rounded-2xl text-center admin-glass">
            <div className="mx-auto h-14 w-14 rounded-full bg-success/15 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-7 w-7 text-success" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              Bulk Upload Completed
            </h2>
            {fileName && (
              <p className="mt-2 text-sm text-muted-foreground inline-flex items-center gap-2">
                <FileText className="h-4 w-4" /> {fileName}
              </p>
            )}
            <Button className="mt-6" onClick={reset}>
              Upload another file
            </Button>
          </Card>
        ) : uploading ? (
          <Card className="p-10 text-center rounded-2xl admin-glass flex flex-col items-center justify-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-primary/15 flex items-center justify-center mb-4">
              <Loader2 className="h-7 w-7 text-primary animate-spin" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              Uploading {fileName || "file"}...
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Please wait while the bulk records are being imported.
            </p>
          </Card>
        ) : (
          <Card
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className={`p-10 border-2 border-dashed transition-colors text-center rounded-2xl admin-glass ${isUploadEnabled ? "hover:border-primary/50" : "opacity-60"
              }`}
          >
            <div className="mx-auto h-14 w-14 rounded-full brand-gradient flex items-center justify-center mb-4">
              <Upload className="h-7 w-7 text-brand-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              Drag & drop an Excel file (.xlsx, .xls) here
            </h2>
            <p className="text-sm text-muted-foreground mt-1">or</p>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              className="hidden"
              onChange={onPick}
              disabled={!isUploadEnabled}
            />
            <Button
              className="mt-4"
              onClick={() => {
                if (!roleName) {
                  toast.error("Please select a role first.");
                  return;
                }
                if (!selectedDeptId || !selectedYear || !selectedSectionName) {
                  toast.error("Please select department, year, and section first.");
                  return;
                }
                inputRef.current?.click();
              }}
              disabled={!isUploadEnabled || uploading}
            >
              Choose Excel file
            </Button>
            {!isUploadEnabled && (
              <p className="mt-3 text-xs text-muted-foreground">
                {!roleName 
                  ? "Select a role above to enable upload selectors." 
                  : "Select department, year, and section above to enable upload."}
              </p>
            )}
          </Card>
        )}
      </section>
    </AdminShell>
  );
};

export default BulkUpload;
