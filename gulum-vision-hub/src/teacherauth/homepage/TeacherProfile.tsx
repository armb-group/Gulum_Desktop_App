import { useEffect, useState } from "react";
import { getTeacherProfile } from "@/services/teacherprofileapi";
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

const TeacherProfile = () => {
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/"); };

  useEffect(() => {
    getTeacherProfile()
      .then(setTeacher)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-center mt-10 text-sm text-muted-foreground">Loading profile…</p>;

  return (
    <RoleShell role="teacher" title="Profile" subtitle="Faculty information">
      <div className="text-right">
        <button aria-label="More" className="text-muted-foreground">
          <MoreVertical className="h-5 w-5 inline" />
        </button>
      </div>

      <div className="flex flex-col items-center text-center gap-2">
        <div className="h-24 w-24 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-3xl font-bold">
          {teacher?.fullName?.[0]?.toUpperCase() ?? "T"}
        </div>
        <p className="text-lg font-bold text-foreground">{teacher?.fullName}</p>
        <p className="text-sm text-muted-foreground">Employee Code: {teacher?.employeeCode}</p>
      </div>

      <Card className="p-4 bg-surface border-border space-y-3">
        <p className="text-sm font-semibold text-primary">Faculty Information</p>
        <Field label="Full Name" value={teacher?.fullName} />
        <Field label="Employee Code" value={teacher?.employeeCode} />
        <Field label="Qualification" value={teacher?.qualification} />
        <Field label="Specialization" value={teacher?.specialization} />
        <Field label="Experience" value={teacher?.experienceYears ? `${teacher.experienceYears} Years` : undefined} />
        <Field label="Joining Date" value={teacher?.joiningDate} />
        <Field label="Designation" value={teacher?.metadata} />
      </Card>

      <Card className="p-4 bg-surface border-border space-y-3">
        <p className="text-sm font-semibold text-primary">Contact Information</p>
        <Field label="Email" value={teacher?.email} />
        <Field label="Phone Number" value={teacher?.phone} />
      </Card>

      <Card className="p-4 bg-surface border-border space-y-2">
        <p className="text-sm font-semibold text-primary">Institution</p>
        <p className="font-semibold text-foreground">{teacher?.institutionId}</p>
      </Card>

      <Card className="p-4 bg-surface border-border space-y-2">
        <p className="text-sm font-semibold text-primary">Status</p>
        <p className="font-semibold text-foreground">{teacher?.isActive ? "Active" : "Inactive"}</p>
      </Card>

      <Button onClick={handleLogout} variant="outline" className="w-full h-11 rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10">
        <LogOut className="h-4 w-4 mr-2" /> Logout
      </Button>
    </RoleShell>
  );
};

export default TeacherProfile;
