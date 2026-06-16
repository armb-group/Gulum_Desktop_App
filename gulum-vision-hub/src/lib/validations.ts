import { z } from "zod";

// Admin Login
export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(4, "Password must be at least 4 characters"),
});

// Departments
export const departmentSchema = z.object({
  name: z.string().min(1, "Department name is required").max(100, "Department name is too long"),
});

// Classes
export const classFormSchema = z.object({
  name: z.string().min(1, "Class/Section Name is required").max(50, "Class name is too long"),
  semester: z.preprocess(
    (val) => Number(val),
    z.number({ invalid_type_error: "Semester must be a number" })
     .int("Semester must be an integer")
     .min(1, "Semester must be at least 1")
     .max(12, "Semester cannot exceed 12")
  ),
  isNewBatch: z.boolean(),
  batchId: z.string().optional(),
  batchYear: z.string().optional(),
}).refine((data) => {
  if (data.isNewBatch) {
    return !!data.batchYear && data.batchYear.trim().length > 0;
  } else {
    return !!data.batchId && data.batchId.trim().length > 0;
  }
}, {
  message: "Academic batch selection or new batch year is required",
  path: ["batchId"]
});

// Subjects
export const subjectFormSchema = z.object({
  name: z.string().min(1, "Subject Name is required").max(100, "Subject name is too long"),
  code: z.string().min(2, "Subject Code must be at least 2 characters").max(20, "Subject code is too long"),
});

// Notices
export const noticeSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  description: z.string().min(1, "Description is required").max(2000, "Description is too long"),
  level: z.enum(["ADMIN", "STUDENT"]),
  courseCode: z.string().max(20, "Course code is too long").optional(),
});

// Teacher CRUD Stepper steps
export const teacherAccountSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const teacherPersonalSchema = z.object({
  full_name: z.string().min(5, "Full name must be at least 5 characters").max(100, "Full name is too long").regex(/^[A-Za-z\s]+$/, "Full name must contain only letters and spaces"),
  qualification: z.string().min(1, "Qualification is required").max(100, "Qualification is too long"),
  specialization: z.string().min(1, "Specialization is required").max(100, "Specialization is too long"),
});

export const teacherProfessionalSchema = z.object({
  institution_id: z.string().min(1, "Institution ID is required"),
  employee_code: z.string().min(1, "Employee code is required"),
  experience_year: z.preprocess(
    (val) => Number(val),
    z.number({ invalid_type_error: "Experience must be a number" })
     .int("Experience must be an integer")
     .min(0, "Experience cannot be negative")
  ),
  joining_date: z.string().min(1, "Joining date is required"),
  department: z.string().min(1, "Department is required"),
  metadata: z.string().optional(),
});

export const teacherEditSchema = z.object({
  full_name: z.string().min(5, "Full name must be at least 5 characters").max(100, "Full name is too long").regex(/^[A-Za-z\s]+$/, "Full name must contain only letters and spaces"),
  qualification: z.string().min(1, "Qualification is required").max(100, "Qualification is too long"),
  specialization: z.string().min(1, "Specialization is required").max(100, "Specialization is too long"),
  employee_code: z.string().min(1, "Employee code is required"),
  experience_year: z.preprocess(
    (val) => Number(val),
    z.number({ invalid_type_error: "Experience must be a number" })
     .int("Experience must be an integer")
     .min(0, "Experience cannot be negative")
  ),
  joining_date: z.string().min(1, "Joining date is required"),
  department: z.string().min(1, "Department is required"),
});

// Student CRUD Stepper steps
export const studentAccountSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const studentPersonalSchema = z.object({
  full_name: z.string().min(5, "Full name must be at least 5 characters").max(100, "Full name is too long").regex(/^[A-Za-z\s]+$/, "Full name must contain only letters and spaces"),
  dob: z.string().min(1, "Date of birth is required"),
  gender: z.string().min(1, "Gender is required"),
});

export const studentAcademicSchema = z.object({
  institution_id: z.string().min(1, "Institution ID is required"),
  admission_no: z.string().min(1, "Admission No is required"),
  roll_no: z.string().min(1, "Roll No is required"),
  batch_id: z.string().min(1, "Batch ID is required"),
  classess_id: z.string().min(1, "Classes ID is required"),
  department_id: z.string().min(1, "Department ID is required"),
});

export const studentEditSchema = z.object({
  full_name: z.string().min(5, "Full name must be at least 5 characters").max(100, "Full name is too long").regex(/^[A-Za-z\s]+$/, "Full name must contain only letters and spaces"),
  dob: z.string().min(1, "Date of birth is required"),
  gender: z.string().min(1, "Gender is required"),
  admission_no: z.string().min(1, "Admission No is required"),
  roll_no: z.string().min(1, "Roll No is required"),
  email_id: z.string().min(1, "Email is required").email("Enter a valid email address"),
  phone_number: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
});
