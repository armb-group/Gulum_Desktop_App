import { useState, useEffect } from "react";
import { AdminShell } from "./AdminShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogOut, User, Mail, ShieldAlert, Building2, Phone, CheckCircle } from "lucide-react";
import { getAdminProfile } from "@/services/adminProfileAPI";

interface ProfileFieldProps {
  label: string;
  value?: string;
  icon: any;
}

const ProfileField = ({ label, value, icon: Icon }: ProfileFieldProps) => (
  <div className="flex items-center gap-4 p-3 rounded-xl border border-border/40 bg-muted/20">
    <div className="p-2 rounded-lg bg-primary/10 text-primary">
      <Icon className="h-5 w-5" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="font-semibold text-foreground text-sm truncate mt-0.5">{value || "N/A"}</p>
    </div>
  </div>
);

const AdminProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (user?.id) {
      setLoading(true);
      getAdminProfile(user.id)
        .then((data) => {
          if (active) {
            setProfileData(data);
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch admin profile:", err);
          if (active) {
            setLoading(false);
          }
        });
    } else {
      setLoading(false);
    }
    return () => {
      active = false;
    };
  }, [user?.id]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const displayName = profileData?.name || profileData?.fullName || user?.name || "Administrator";
  const displayEmail = profileData?.email || user?.email;
  const displayPhone = profileData?.phone || profileData?.phoneNumber || "N/A";
  const displayRole = profileData?.role || user?.role?.toUpperCase() || "ADMIN";
  const displayInstitution = user?.institutionName || (user as any)?.institution || "N/A";
  const displayStatus = profileData?.isActive !== undefined ? (profileData.isActive ? "Active" : "Inactive") : "Active";

  return (
    <AdminShell title="Admin Profile">
      <div className="max-w-2xl mx-auto w-full px-4 py-8 space-y-6">
        {/* Header Avatar card */}
        <Card className="p-8 bg-card border-border shadow-md rounded-2xl flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-110" />
            <div className="relative h-24 w-24 rounded-full border-4 border-primary/20 bg-primary text-primary-foreground flex items-center justify-center text-3xl font-black shadow-lg">
              {displayName[0]?.toUpperCase() ?? "A"}
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-foreground">{displayName}</h2>
            <p className="text-xs font-bold text-primary uppercase tracking-widest">System Administrator</p>
          </div>
        </Card>

        {/* Details Card */}
        <Card className="p-6 bg-card border-border shadow-md rounded-2xl space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground border-b pb-2 mb-2">
            Account Details {loading && <span className="text-xs normal-case text-muted-foreground animate-pulse ml-2">(Updating...)</span>}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ProfileField label="Full Name" value={displayName} icon={User} />
            <ProfileField label="Email Address" value={displayEmail} icon={Mail} />
            <ProfileField label="Phone Number" value={displayPhone} icon={Phone} />
            <ProfileField label="System Role" value={displayRole} icon={ShieldAlert} />
            <ProfileField label="Institution" value={displayInstitution} icon={Building2} />
            <ProfileField label="Status" value={displayStatus} icon={CheckCircle} />
          </div>
        </Card>

        {/* Actions */}
        <Button
          onClick={handleLogout}
          variant="destructive"
          className="w-full h-12 rounded-xl text-sm font-bold shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sign Out of Admin Console
        </Button>
      </div>
    </AdminShell>
  );
};

export default AdminProfile;

