import { RoleShell } from "@/components/RoleShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogOut, MoreVertical } from "lucide-react";

const TeacherProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <RoleShell role="teacher" title="Profile" subtitle="Faculty information">
      <div className="text-right">
        <button aria-label="More" className="text-muted-foreground">
          <MoreVertical className="h-5 w-5 inline" />
        </button>
      </div>
      <div className="flex flex-col items-center text-center">
        <div className="h-28 w-28 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-4xl font-display">
          {user?.name?.[0]?.toUpperCase() ?? "T"}
        </div>
        <h2 className="text-3xl mt-3 text-foreground">{user?.name}</h2>
        <p className="text-muted-foreground">Faculty ID: FAC2024042</p>
      </div>

      <Card className="p-4 bg-surface border-border space-y-3">
        <h3 className="text-xl text-primary">Faculty Information</h3>
        <div>
          <p className="text-xs text-muted-foreground">Name</p>
          <p className="font-bold text-foreground">{user?.name}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Faculty ID</p>
          <p className="font-bold text-foreground">FAC2024042</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Department</p>
          <p className="font-bold text-foreground">Computer Applications</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Email</p>
          <p className="font-bold text-foreground break-all">{user?.email}</p>
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

export default TeacherProfile;
