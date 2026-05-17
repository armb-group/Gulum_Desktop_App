import { RoleShell } from "@/components/RoleShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogOut, MoreVertical } from "lucide-react";

const StudentProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <RoleShell role="student" title="Student Info" subtitle="Personal information">
      <div className="text-right">
        <button aria-label="More" className="text-muted-foreground">
          <MoreVertical className="h-5 w-5 inline" />
        </button>
      </div>

      <div className="flex flex-col items-center text-center">
        <div className="h-28 w-28 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-4xl font-display italic">
          {user?.name?.[0]?.toUpperCase() ?? "S"}
        </div>
        <h2 className="text-3xl mt-3 text-foreground">{user?.name}</h2>
        <p className="text-muted-foreground italic">Roll No: BCA2024001</p>
      </div>

      <Card className="p-4 bg-surface border-border space-y-3">
        <h3 className="text-xl text-primary">Student Information</h3>
        <div>
          <p className="text-xs text-muted-foreground italic">Name</p>
          <p className="font-bold text-foreground">{user?.name}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground italic">Roll Number</p>
          <p className="font-bold text-foreground">BCA2024001</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground italic">Attendance</p>
          <p className="font-bold text-foreground">92%</p>
        </div>
      </Card>

      <Card className="p-4 bg-surface border-border space-y-2">
        <h3 className="text-xl text-primary">Parent Contact</h3>
        <div>
          <p className="text-xs text-muted-foreground italic">Contact Number</p>
          <p className="font-bold text-foreground">+91 98765 43210</p>
        </div>
      </Card>

      <Card className="p-4 bg-surface border-border">
        <h3 className="text-xl text-primary">Institution</h3>
        <p className="font-bold text-foreground mt-2">{user?.institution}</p>
      </Card>

      <Button
        onClick={handleLogout}
        variant="outline"
        className="w-full h-12 rounded-full border-destructive/40 text-destructive hover:bg-destructive/10"
      >
        <LogOut className="h-4 w-4" /> Logout
      </Button>
    </RoleShell>
  );
};

export default StudentProfile;
