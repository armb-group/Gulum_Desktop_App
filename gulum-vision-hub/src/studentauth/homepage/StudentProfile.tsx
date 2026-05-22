import { useEffect, useState } from "react";
import { getStudentProfile } from "@/services/studentprofileAPI";
import { RoleShell } from "@/components/RoleShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogOut, MoreVertical } from "lucide-react";

const StudentProfile = () => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const fetchStudentProfile = async () => {
    try {
      const data = await getStudentProfile();

      console.log("Student API Data:", data);

      setStudent(data);
    } catch (error) {
      console.log("API Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentProfile();
  }, []);

  if (loading) {
    return (
      <p className="text-center mt-10">
        Loading Student Profile...
      </p>
    );
  }

  return (
    <RoleShell
      role="student"
      title="Student Info"
      subtitle="Personal information"
    >
      {/* Top Menu */}
      <div className="text-right">
        <button
          aria-label="More"
          className="text-muted-foreground"
        >
          <MoreVertical className="h-5 w-5 inline" />
        </button>
      </div>

      {/* Profile Section */}
      <div className="flex flex-col items-center text-center">
        <div className="h-28 w-28 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-4xl font-display italic">
          {student?.fullName?.[0]?.toUpperCase() ?? "S"}
        </div>

        <h2 className="text-3xl mt-3 text-foreground">
          {student?.fullName}
        </h2>

        <p className="text-muted-foreground italic">
          Roll No: {student?.rollNo}
        </p>
      </div>

      {/* Student Information */}
      <Card className="p-4 bg-surface border-border space-y-3">
        <h3 className="text-xl text-primary">
          Student Information
        </h3>

        <div>
          <p className="text-xs text-muted-foreground italic">
            Name
          </p>

          <p className="font-bold text-foreground">
            {student?.fullName}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground italic">
            Roll Number
          </p>

          <p className="font-bold text-foreground">
            {student?.rollNo}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground italic">
            Admission Number
          </p>

          <p className="font-bold text-foreground">
            {student?.admissionNo}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground italic">
            Gender
          </p>

          <p className="font-bold text-foreground">
            {student?.gender}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground italic">
            Date of Birth
          </p>

          <p className="font-bold text-foreground">
            {student?.dob}
          </p>
        </div>
      </Card>

      {/* Contact Information */}
      <Card className="p-4 bg-surface border-border space-y-2">
        <h3 className="text-xl text-primary">
          Contact Information
        </h3>

        <div>
          <p className="text-xs text-muted-foreground italic">
            Email
          </p>

          <p className="font-bold text-foreground">
            {student?.emailId}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground italic">
            Phone Number
          </p>

          <p className="font-bold text-foreground">
            {student?.phoneNumber}
          </p>
        </div>
      </Card>

      {/* Institution */}
      <Card className="p-4 bg-surface border-border">
        <h3 className="text-xl text-primary">
          Institution
        </h3>

        <p className="font-bold text-foreground mt-2">
          {student?.institutionId}
        </p>
      </Card>

      {/* Logout Button */}
      <Button
        onClick={handleLogout}
        variant="outline"
        className="w-full h-12 rounded-full border-destructive/40 text-destructive hover:bg-destructive/10"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Logout
      </Button>
    </RoleShell>
  );
};

export default StudentProfile;