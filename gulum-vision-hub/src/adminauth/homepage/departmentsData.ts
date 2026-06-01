type Subject = { name: string; code: string };
type Section = { name: string; teachers: string[]; students: string[]; subjects: Subject[] };
type YearItem = { year: string; sections: Section[] };
type Department = { id: string; name: string; years: YearItem[] };

export const initialData: Department[] = [
  {
    id: "cse",
    name: "Computer Science",
    years: [
      {
        year: "1st Year",
        sections: [
          {
            name: "CSE 1",
            teachers: ["Dr. Alice Noor", "Mr. Mohammad Ahmed"],
            students: ["John Doe", "Jane Smith", "Ayesha Khan"],
            subjects: [
              { name: "Programming Basics", code: "CSE101" },
              { name: "Digital Logic", code: "CSE102" },
            ],
          },
          {
            name: "CSE 2",
            teachers: ["Dr. Sarah Malik"],
            students: ["Omar Ali", "Mina Hasan"],
            subjects: [
              { name: "Discrete Mathematics", code: "CSE103" },
              { name: "Physics for CS", code: "CSE104" },
            ],
          },
        ],
      },
      {
        year: "2nd Year",
        sections: [
          {
            name: "CSE 1",
            teachers: ["Dr. Alice Noor"],
            students: ["Bilal Ahmed", "Sara Rahman", "Zara Khan"],
            subjects: [
              { name: "Data Structures", code: "CSE201" },
              { name: "Computer Architecture", code: "CSE202" },
            ],
          },
          {
            name: "CSE 2",
            teachers: ["Mr. Tariq Khan"],
            students: ["Naila Siddiqui", "Fahad Raza"],
            subjects: [
              { name: "Operating Systems", code: "CSE203" },
              { name: "Database Systems", code: "CSE204" },
            ],
          },
        ],
      },
      {
        year: "3rd Year",
        sections: [
          {
            name: "CSE 1",
            teachers: ["Dr. Farah Iqbal"],
            students: ["Nida Hassan", "Khalid Rizvi"],
            subjects: [
              { name: "Software Engineering", code: "CSE301" },
              { name: "Computer Networks", code: "CSE302" },
            ],
          },
          {
            name: "CSE 2",
            teachers: ["Ms. Hina Shah"],
            students: ["Ali Rehman", "Sara Ameen"],
            subjects: [
              { name: "Artificial Intelligence", code: "CSE303" },
              { name: "Theory of Computation", code: "CSE304" },
            ],
          },
        ],
      },
      {
        year: "4th Year",
        sections: [
          {
            name: "CSE 1",
            teachers: ["Dr. Imran Qureshi"],
            students: ["Rida Khan", "Hamza Javed"],
            subjects: [
              { name: "Machine Learning", code: "CSE401" },
              { name: "Cloud Computing", code: "CSE402" },
            ],
          },
          {
            name: "CSE 2",
            teachers: ["Dr. Sana Mir"],
            students: ["Ahsan Ali", "Mehwish Tariq"],
            subjects: [
              { name: "Cyber Security", code: "CSE403" },
              { name: "Project Work", code: "CSE404" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "ece",
    name: "Electronics & Communication",
    years: [
      {
        year: "1st Year",
        sections: [
          {
            name: "ECE 1",
            teachers: ["Dr. Sarah Malik", "Mr. Tariq Khan"],
            students: ["Rohit Sharma", "Priya Patel"],
            subjects: [
              { name: "Basic Electronics", code: "ECE101" },
              { name: "Circuit Theory", code: "ECE102" },
            ],
          },
          {
            name: "ECE 2",
            teachers: ["Ms. Hina Shah"],
            students: ["Amit Kumar", "Sneha Rao"],
            subjects: [
              { name: "Engineering Electromagnetics", code: "ECE103" },
              { name: "Chemistry for Engineers", code: "ECE104" },
            ],
          },
        ],
      },
      {
        year: "2nd Year",
        sections: [
          {
            name: "ECE 1",
            teachers: ["Dr. Alice Noor"],
            students: ["Vikram Singh", "Anjali Gupta"],
            subjects: [
              { name: "Electronic Devices", code: "ECE201" },
              { name: "Signals and Systems", code: "ECE202" },
            ],
          },
          {
            name: "ECE 2",
            teachers: ["Mr. Mohammad Ahmed"],
            students: ["Rohan Verma", "Kirti Sen"],
            subjects: [
              { name: "Network Analysis", code: "ECE203" },
              { name: "Digital System Design", code: "ECE204" },
            ],
          },
        ],
      },
      {
        year: "3rd Year",
        sections: [
          {
            name: "ECE 1",
            teachers: ["Dr. Farah Iqbal"],
            students: ["Arjun Reddy", "Meera Nair"],
            subjects: [
              { name: "Analog Circuits", code: "ECE301" },
              { name: "Microcontrollers", code: "ECE302" },
            ],
          },
          {
            name: "ECE 2",
            teachers: ["Dr. Imran Qureshi"],
            students: ["Karan Johar", "Alia Bhatt"],
            subjects: [
              { name: "Antennas & Propagation", code: "ECE303" },
              { name: "Control Systems", code: "ECE304" },
            ],
          },
        ],
      },
      {
        year: "4th Year",
        sections: [
          {
            name: "ECE 1",
            teachers: ["Dr. Sana Mir"],
            students: ["Vijay Sethupathi", "Samantha Ruth"],
            subjects: [
              { name: "VLSI Design", code: "ECE401" },
              { name: "Digital Signal Processing", code: "ECE402" },
            ],
          },
          {
            name: "ECE 2",
            teachers: ["Dr. Alice Noor"],
            students: ["Yash Gowda", "Rashmika Mandanna"],
            subjects: [
              { name: "Wireless Communication", code: "ECE403" },
              { name: "Embedded Systems", code: "ECE404" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "ee",
    name: "Electrical Engineering",
    years: [
      {
        year: "1st Year",
        sections: [
          {
            name: "EE 1",
            teachers: ["Dr. Sarah Malik", "Mr. Mohammad Ahmed"],
            students: ["Rohan Roy", "Siddharth Sen"],
            subjects: [
              { name: "Basic Electrical Engineering", code: "EE101" },
              { name: "Engineering Mechanics", code: "EE102" },
            ],
          },
          {
            name: "EE 2",
            teachers: ["Dr. Alice Noor"],
            students: ["Aditi Rao", "Neha Sharma"],
            subjects: [
              { name: "Electrical Circuit Analysis", code: "EE103" },
              { name: "Physics for EE", code: "EE104" },
            ],
          },
        ],
      },
      {
        year: "2nd Year",
        sections: [
          {
            name: "EE 1",
            teachers: ["Mr. Tariq Khan"],
            students: ["Sameer Khan", "Pooja Hegde"],
            subjects: [
              { name: "Network Theory", code: "EE201" },
              { name: "Analog Electronics", code: "EE202" },
            ],
          },
          {
            name: "EE 2",
            teachers: ["Ms. Hina Shah"],
            students: ["Kabir Singh", "Kiara Advani"],
            subjects: [
              { name: "Electrical Machines I", code: "EE203" },
              { name: "Digital Electronics", code: "EE204" },
            ],
          },
        ],
      },
      {
        year: "3rd Year",
        sections: [
          {
            name: "EE 1",
            teachers: ["Dr. Farah Iqbal"],
            students: ["Ranveer Singh", "Deepika Padukone"],
            subjects: [
              { name: "Power Electronics", code: "EE301" },
              { name: "Control Systems", code: "EE302" },
            ],
          },
          {
            name: "EE 2",
            teachers: ["Dr. Imran Qureshi"],
            students: ["Ranbir Kapoor", "Katrina Kaif"],
            subjects: [
              { name: "Electrical Machines II", code: "EE303" },
              { name: "Electromagnetic Fields", code: "EE304" },
            ],
          },
        ],
      },
      {
        year: "4th Year",
        sections: [
          {
            name: "EE 1",
            teachers: ["Dr. Sana Mir"],
            students: ["Hrithik Roshan", "Tiger Shroff"],
            subjects: [
              { name: "Power Systems", code: "EE401" },
              { name: "Switchgear and Protection", code: "EE402" },
            ],
          },
          {
            name: "EE 2",
            teachers: ["Dr. Sarah Malik"],
            students: ["Prabhas Raju", "Anushka Shetty"],
            subjects: [
              { name: "Renewable Energy Sources", code: "EE403" },
              { name: "Electric Drives", code: "EE404" },
            ],
          },
        ],
      },
    ],
  },
];

let departmentsState: Department[] = JSON.parse(JSON.stringify(initialData));

export const getDepartmentsInMemory = () => {
  return departmentsState;
};

export const setDepartmentsInMemory = (newDepts: Department[]) => {
  departmentsState = newDepts;
};

export type { Department, YearItem, Section, Subject };
