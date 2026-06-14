import { useState, useEffect, useRef, useMemo } from "react";
import Papa from "papaparse";
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
import { Upload, FileText, Download, CheckCircle2, GraduationCap, UserCog, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "./AdminShell";
import { useGetRoles } from "@/services/roleAPI";
import { useUploadBulkFile } from "@/services/uploadAPI";

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
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [fileName, setFileName] = useState("");
  const [completed, setCompleted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // TanStack Query Hooks
  const { data: rawRoles, isLoading: loading } = useGetRoles();
  const roles = useMemo(() => {
    const rawList = Array.isArray(rawRoles) ? rawRoles : [];
    if (rawList.length === 0 && !loading) {
      return [
        { id: "student-fallback", name: "Student" },
        { id: "teacher-fallback", name: "Teacher" },
      ];
    }
    return rawList.map((r, index) => {
      if (typeof r === "string") {
        return { id: r, name: r };
      }
      if (r && typeof r === "object") {
        const id = r.id ?? r.roleId ?? `role-${index}`;
        const name = r.name ?? r.roleName ?? r.title ?? "";
        return { id: String(id), name: String(name) };
      }
      return { id: `role-${index}`, name: "" };
    });
  }, [rawRoles, loading]);

  const selectedRole = roles.find((r) => r.id === selectedRoleId);
  const rawRoleName = selectedRole ? (selectedRole.name ?? "") : "";
  const roleName = rawRoleName.toLowerCase() === "user" ? "Student" : rawRoleName;

  const uploadMutation = useUploadBulkFile();
  const uploading = uploadMutation.isPending;

  const handleFile = (file: File) => {
    if (!roleName) {
      toast.error("Please select a role before uploading.");
      return;
    }
    setFileName(file.name);

    const rawRole = selectedRole ? (selectedRole.name ?? selectedRole.roleName ?? "").toLowerCase() : "";

    uploadMutation.mutate(
      { role: rawRole, file },
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
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const downloadSample = () => {
    if (!roleName) {
      toast.error("Please select a role first.");
      return;
    }
    const csvContent = getSampleCSV(roleName);
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gulum-${roleName.toLowerCase()}-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setCompleted(false);
    setFileName("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <AdminShell title="Bulk Upload">
      <section className="container py-10 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Bulk Upload</h1>
            <p className="text-muted-foreground mt-1">
              Select a role, then upload a CSV to import records.
            </p>
          </div>
          <Button variant="outline" onClick={downloadSample} disabled={!roleName}>
            <Download className="h-4 w-4" /> Download template
          </Button>
        </div>

        <Card className="p-5 rounded-2xl admin-glass">
          <Label className="text-sm font-semibold">Select role to upload</Label>
          <Select
            value={selectedRoleId}
            onValueChange={(v) => {
              setSelectedRoleId(v);
              reset();
            }}
            disabled={loading}
          >
            <SelectTrigger className="mt-2 h-12 rounded-xl">
              <SelectValue placeholder={loading ? "Loading roles…" : "Choose a role…"} />
            </SelectTrigger>
            <SelectContent>
              {roles.map((r) => {
                const name = r.name ? (r.name.toLowerCase() === "user" ? "Student" : r.name) : "";
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
            className={`p-10 border-2 border-dashed transition-colors text-center rounded-2xl admin-glass ${
              roleName ? "hover:border-primary/50" : "opacity-60"
            }`}
          >
            <div className="mx-auto h-14 w-14 rounded-full brand-gradient flex items-center justify-center mb-4">
              <Upload className="h-7 w-7 text-brand-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              Drag & drop a CSV file here
            </h2>
            <p className="text-sm text-muted-foreground mt-1">or</p>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={onPick}
            />
            <Button
              className="mt-4"
              onClick={() => {
                if (!roleName) {
                  toast.error("Please select a role first.");
                  return;
                }
                inputRef.current?.click();
              }}
              disabled={!roleName || uploading}
            >
              Choose CSV file
            </Button>
            {!roleName && (
              <p className="mt-3 text-xs text-muted-foreground">
                Select a role above to enable upload.
              </p>
            )}
          </Card>
        )}
      </section>
    </AdminShell>
  );
};

export default BulkUpload;
