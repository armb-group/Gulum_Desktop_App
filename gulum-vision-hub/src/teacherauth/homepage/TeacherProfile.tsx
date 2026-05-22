// src/pages/TeacherProfile.tsx

import { useEffect, useState } from "react";
import { getTeacherProfile } from "@/services/teacherprofileapi";

import { RoleShell } from "@/components/RoleShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

import { LogOut, MoreVertical } from "lucide-react";

const TeacherProfile = () => {

  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);

  const { logout } = useAuth();

  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const fetchTeacherProfile = async () => {

    try {

      const data = await getTeacherProfile();

      console.log("Teacher API Data:", data);

      setTeacher(data);

    } catch (error) {

      console.log("API Error:", error);

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {
    fetchTeacherProfile();
  }, []);

  if (loading) {
    return (
      <p className="text-center mt-10">
        Loading Teacher Profile...
      </p>
    );
  }

  return (

    <RoleShell
      role="teacher"
      title="Profile"
      subtitle="Faculty information"
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

        <div className="h-28 w-28 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-4xl font-display">

          {teacher?.fullName?.[0]?.toUpperCase() ?? "T"}

        </div>

        <h2 className="text-3xl mt-3 text-foreground">
          {teacher?.fullName}
        </h2>

        <p className="text-muted-foreground">
          Employee Code: {teacher?.employeeCode}
        </p>

      </div>

      {/* Teacher Information */}
      <Card className="p-4 bg-surface border-border space-y-3">

        <h3 className="text-xl text-primary">
          Faculty Information
        </h3>

        <div>
          <p className="text-xs text-muted-foreground">
            Full Name
          </p>

          <p className="font-bold text-foreground">
            {teacher?.fullName}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">
            Employee Code
          </p>

          <p className="font-bold text-foreground">
            {teacher?.employeeCode}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">
            Qualification
          </p>

          <p className="font-bold text-foreground">
            {teacher?.qualification}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">
            Specialization
          </p>

          <p className="font-bold text-foreground">
            {teacher?.specialization}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">
            Experience
          </p>

          <p className="font-bold text-foreground">
            {teacher?.experienceYears} Years
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">
            Joining Date
          </p>

          <p className="font-bold text-foreground">
            {teacher?.joiningDate}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">
            Designation
          </p>

          <p className="font-bold text-foreground">
            {teacher?.metadata}
          </p>
        </div>

      </Card>

      {/* Contact Information */}
      <Card className="p-4 bg-surface border-border space-y-3">

        <h3 className="text-xl text-primary">
          Contact Information
        </h3>

        <div>
          <p className="text-xs text-muted-foreground">
            Email
          </p>

          <p className="font-bold text-foreground break-all">
            {teacher?.email}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">
            Phone Number
          </p>

          <p className="font-bold text-foreground">
            {teacher?.phone}
          </p>
        </div>

      </Card>

      {/* Institution */}
      <Card className="p-4 bg-surface border-border">

        <h3 className="text-xl text-primary">
          Institution
        </h3>

        <p className="font-bold text-foreground mt-2">
          {teacher?.institutionId}
        </p>

      </Card>

      {/* Status */}
      <Card className="p-4 bg-surface border-border">

        <h3 className="text-xl text-primary">
          Status
        </h3>

        <p className="font-bold text-foreground mt-2">
          {teacher?.isActive ? "Active" : "Inactive"}
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

export default TeacherProfile;