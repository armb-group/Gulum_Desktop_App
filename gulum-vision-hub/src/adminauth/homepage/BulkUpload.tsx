import { useState, useRef } from "react";
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
import { Upload, FileText, Download, CheckCircle2, GraduationCap, UserCog } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "./AdminShell";

type Row = Record<string, string>;
type UploadRole = "student" | "teacher";

const SAMPLES: Record<UploadRole, string> = {
  student: `name,email,role,department
Aisha Khan,aisha@example.edu,student,Computer Science
Ravi Patel,ravi@example.edu,student,Mathematics`,
  teacher: `name,email,role,department
Dr. Mei Lin,mei@example.edu,teacher,Physics
Prof. John Doe,john@example.edu,teacher,Chemistry`,
};

const BulkUpload = () => {
  const [role, setRole] = useState<UploadRole | "">("");
  const [fileName, setFileName] = useState("");
  const [completed, setCompleted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!role) {
      toast.error("Please select a role before uploading.");
      return;
    }
    setFileName(file.name);
    Papa.parse<Row>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const data = res.data.filter((r) => Object.values(r).some((v) => v));
        toast.success(`Uploaded ${data.length} ${role} records`);
        setCompleted(true);
      },
      error: (err) => toast.error(`Parse error: ${err.message}`),
    });
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
    if (!role) {
      toast.error("Please select a role first.");
      return;
    }
    const blob = new Blob([SAMPLES[role]], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gulum-${role}-template.csv`;
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
          <Button variant="outline" onClick={downloadSample} disabled={!role}>
            <Download className="h-4 w-4" /> Download template
          </Button>
        </div>

        <Card className="p-5 rounded-2xl admin-glass">
          <Label className="text-sm font-semibold">Select role to upload</Label>
          <Select
            value={role}
            onValueChange={(v) => {
              setRole(v as UploadRole);
              reset();
            }}
          >
            <SelectTrigger className="mt-2 h-12 rounded-xl">
              <SelectValue placeholder="Choose a role…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="student">
                <span className="inline-flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" /> Student
                </span>
              </SelectItem>
              <SelectItem value="teacher">
                <span className="inline-flex items-center gap-2">
                  <UserCog className="h-4 w-4" /> Teacher
                </span>
              </SelectItem>
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
        ) : (
          <Card
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className={`p-10 border-2 border-dashed transition-colors text-center rounded-2xl admin-glass ${
              role ? "hover:border-primary/50" : "opacity-60"
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
                if (!role) {
                  toast.error("Please select a role first.");
                  return;
                }
                inputRef.current?.click();
              }}
              disabled={!role}
            >
              Choose CSV file
            </Button>
            {!role && (
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
