import { useEffect, useState } from "react";
import { getStudentProfile } from "@/services/studentprofileAPI";
import { RoleShell } from "@/components/RoleShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogOut, MoreVertical } from "lucide-react";

const Field = ({ label, value }: { label: string; value?: string }) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="font-semibold text-foreground">{value}</p>
  </div>
);

const StudentProfile = () => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/"); };

  useEffect(() => {
    getStudentProfile()
      .then(setStudent)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-center mt-10 text-sm text-muted-foreground">Loading profile…</p>;

  return (
    <RoleShell role="student" title="Student Info" subtitle="Personal information">
      <div className="text-right">
        <button aria-label="More" className="text-muted-foreground">
          <MoreVertical className="h-5 w-5 inline" />
        </button>
      </div>

      <div className="flex flex-col items-center text-center gap-2">
        <div className="h-24 w-24 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-3xl font-bold">
          {student?.fullName?.[0]?.toUpperCase() ?? "S"}
        </div>
        <p className="text-lg font-bold text-foreground">{student?.fullName}</p>
        <p className="text-sm text-muted-foreground">Roll No: {student?.rollNo}</p>
      </div>

      <Card className="p-4 bg-surface border-border space-y-3">
        <p className="text-sm font-semibold text-primary">Student Information</p>
        <Field label="Name" value={student?.fullName} />
        <Field label="Roll Number" value={student?.rollNo} />
        <Field label="Admission Number" value={student?.admissionNo} />
        <Field label="Gender" value={student?.gender} />
        <Field label="Date of Birth" value={student?.dob} />
      </Card>

      <Card className="p-4 bg-surface border-border space-y-3">
        <p className="text-sm font-semibold text-primary">Contact Information</p>
        <Field label="Email" value={student?.emailId} />
        <Field label="Phone Number" value={student?.phoneNumber} />
      </Card>

      {/* <Card className="p-4 bg-surface border-border space-y-2">
        <p className="text-sm font-semibold text-primary">Institution</p>
        <p className="font-semibold text-foreground">{student?.institutionId}</p>
      </Card> */}

      <Button onClick={handleLogout} variant="outline" className="w-full h-11 rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10">
        <LogOut className="h-4 w-4 mr-2" /> Logout
      </Button>
    </RoleShell>
  );
};

export default StudentProfile;
