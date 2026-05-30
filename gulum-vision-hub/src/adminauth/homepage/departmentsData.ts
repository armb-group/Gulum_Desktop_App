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
];

export type { Department, YearItem, Section, Subject };
