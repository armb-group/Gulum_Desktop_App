import { useEffect, useState } from "react";
import { getStudentProfile } from "@/services/studentprofileAPI";
import { RoleShell } from "@/components/RoleShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogOut, Mail, Phone, Calendar, User, Hash, BadgeInfo } from "lucide-react";

const InfoItem = ({ icon: Icon, label, value }: { icon: any; label: string; value?: string }) => (
  <div className="flex items-start gap-4 py-4 border-b border-border/50 last:border-0">
    <div className="mt-0.5 p-2 rounded-lg bg-brand/5 text-brand">
      <Icon className="w-4 h-4" />
    </div>
    <div className="flex-1">
      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value || "—"}</p>
    </div>
  </div>
);

const StudentProfile = () => {
  const [student, setStudent] = useState<any>(null);
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

  if (loading) {
    return (
      <RoleShell role="student" title="Profile" subtitle="Loading your information...">
        <div className="flex justify-center items-center h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
        </div>
      </RoleShell>
    );
  }

  return (
    <RoleShell role="student" title="Profile" subtitle="Personal details">
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10 mt-2">
        
        {/* Top Profile Card - sleek, horizontal */}
        <Card className="overflow-hidden border-none shadow-md">
          <div className="brand-gradient px-6 py-8 text-brand-foreground flex items-center gap-6 relative overflow-hidden">
            {/* Background pattern/glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            
            <div className="relative z-10 flex-shrink-0">
              <div className="h-24 w-24 rounded-full border-4 border-white/20 bg-white/10 backdrop-blur-md flex items-center justify-center text-4xl font-bold shadow-lg">
                {student?.fullName?.[0]?.toUpperCase() ?? "S"}
              </div>
            </div>
            
            <div className="relative z-10 flex-1">
              <h2 className="text-2xl font-bold mb-1">{student?.fullName || "Student Name"}</h2>
              <div className="flex flex-wrap items-center gap-2 text-brand-foreground/90 text-sm font-medium mt-2">
                <span className="bg-black/20 px-3 py-1.5 rounded-md backdrop-blur-sm flex items-center shadow-sm">
                  <Hash className="w-3.5 h-3.5 mr-1.5 opacity-80" />
                  Roll: {student?.rollNo || "N/A"}
                </span>
                {student?.admissionNo && (
                  <span className="bg-black/10 px-3 py-1.5 rounded-md backdrop-blur-sm flex items-center shadow-sm border border-white/10">
                    Admin No: {student?.admissionNo}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Detailed Info */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-border/60 shadow-sm bg-surface overflow-hidden">
            <div className="px-6 py-4 border-b border-border/60 bg-muted/30">
              <h3 className="font-semibold flex items-center gap-2 text-foreground">
                <User className="w-4 h-4 text-brand" /> Personal Info
              </h3>
            </div>
            <div className="px-6 pb-2">
              <InfoItem icon={User} label="Full Name" value={student?.fullName} />
              <InfoItem icon={BadgeInfo} label="Gender" value={student?.gender} />
              <InfoItem icon={Calendar} label="Date of Birth" value={student?.dob} />
            </div>
          </Card>

          <Card className="border-border/60 shadow-sm bg-surface overflow-hidden">
            <div className="px-6 py-4 border-b border-border/60 bg-muted/30">
              <h3 className="font-semibold flex items-center gap-2 text-foreground">
                <Mail className="w-4 h-4 text-brand" /> Contact
              </h3>
            </div>
            <div className="px-6 pb-2">
              <InfoItem icon={Mail} label="Email Address" value={student?.emailId} />
              <InfoItem icon={Phone} label="Phone Number" value={student?.phoneNumber} />
              <InfoItem icon={Hash} label="Admission Number" value={student?.admissionNo} />
            </div>
          </Card>
        </div>

        {/* Actions */}
        <div className="pt-2">
          <Button 
            onClick={handleLogout} 
            variant="outline" 
            className="w-full h-12 rounded-xl text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors border-destructive/20 bg-surface shadow-sm font-medium"
          >
            <LogOut className="h-4 w-4 mr-2" /> Log out of account
          </Button>
        </div>
        
      </div>
    </RoleShell>
  );
};

export default StudentProfile;
