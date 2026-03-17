import "dotenv/config";
import { PrismaClient, Role, FeeStatus, AttendanceStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";



// ✅ NEW: create adapter
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

// ✅ UPDATED: pass adapter
const prisma = new PrismaClient({ adapter });

function cbcGrade(score: number): string {
  if (score >= 80) return "EE";
  if (score >= 65) return "ME";
  if (score >= 50) return "AE";
  return "BE";
}

function cbcRemark(g: string): string {
  const r: Record<string, string> = {
    EE: "Exceeds Expectations – Outstanding",
    ME: "Meets Expectations – Good",
    AE: "Approaching Expectations – Needs improvement",
    BE: "Below Expectations – Requires support",
  };
  return r[g] ?? "";
}

async function main() {
  console.log("🌱 Seeding EduTrack...");

  // Clean up in dependency order
  await prisma.eventPayment.deleteMany();
  await prisma.userNotification.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.timetableEntry.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.coCurricularActivity.deleteMany();
  await prisma.fee.deleteMany();
  await prisma.performanceMetric.deleteMany();
  await prisma.homeworkSubmission.deleteMany();
  await prisma.homework.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.classSubject.deleteMany();
  await prisma.teacherSubject.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.student.deleteMany();
  await prisma.parent.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.class.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.user.deleteMany();

  const hash = await bcrypt.hash("password123", 10);

  // ── Admin ──────────────────────────────────────────────────────────
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@schoolms.com",
      name: "Dr. Sarah Kimani",
      password: hash,
      role: Role.SUPER_ADMIN,
      phone: "+254712345678",
      admin: { create: {} },
    },
  });

  // ── CBC Subjects ───────────────────────────────────────────────────
  const subjects = await Promise.all([
    prisma.subject.create({ data: { name: "English",              code: "ENG"  } }),
    prisma.subject.create({ data: { name: "Kiswahili",            code: "KSW"  } }),
    prisma.subject.create({ data: { name: "Mathematics",          code: "MATH" } }),
    prisma.subject.create({ data: { name: "Integrated Science",   code: "ISCI" } }),
    prisma.subject.create({ data: { name: "Social Studies",       code: "SS"   } }),
    prisma.subject.create({ data: { name: "Religious Education",  code: "CRE"  } }),
    prisma.subject.create({ data: { name: "Business Studies",     code: "BS"   } }),
    prisma.subject.create({ data: { name: "Agriculture",          code: "AGRI" } }),
    prisma.subject.create({ data: { name: "Pre-Technical Studies",code: "PTS"  } }),
    prisma.subject.create({ data: { name: "Creative Arts & Sports",code:"CAS"  } }),
  ]);
  const [english, kiswahili, math, intSci, ss, cre, bs, agri, pts, cas] = subjects;

  // ── Teachers ───────────────────────────────────────────────────────
  const t1 = await prisma.user.create({
    data: {
      email: "teacher1@schoolms.com", name: "Ms. Grace Wanjiku",
      password: hash, role: Role.TEACHER, phone: "+254734567890",
      teacher: { create: {
        employeeId: "EMP001", department: "Mathematics & Sciences",
        qualification: "B.Ed Mathematics", specialization: "Algebra & Statistics",
        bio: "Dedicated mathematics educator with 8 years of CBC experience.",
        subjects: { create: [{ subjectId: math.id }, { subjectId: intSci.id }] },
      }},
    },
    include: { teacher: true },
  });

  const t2 = await prisma.user.create({
    data: {
      email: "teacher2@schoolms.com", name: "Mr. Peter Mwangi",
      password: hash, role: Role.TEACHER, phone: "+254745678901",
      teacher: { create: {
        employeeId: "EMP002", department: "Sciences & Agriculture",
        qualification: "B.Sc Biology, PGDE", specialization: "Life Sciences & Ecology",
        bio: "Biology and agriculture specialist focused on hands-on learning.",
        subjects: { create: [{ subjectId: intSci.id }, { subjectId: agri.id }] },
      }},
    },
    include: { teacher: true },
  });

  const t3 = await prisma.user.create({
    data: {
      email: "teacher3@schoolms.com", name: "Mrs. Amina Hassan",
      password: hash, role: Role.TEACHER, phone: "+254756789012",
      teacher: { create: {
        employeeId: "EMP003", department: "Languages",
        qualification: "B.A English Literature", specialization: "Creative Writing & Literature",
        bio: "English and Kiswahili educator with a passion for storytelling.",
        subjects: { create: [{ subjectId: english.id }, { subjectId: kiswahili.id }] },
      }},
    },
    include: { teacher: true },
  });

  const t4 = await prisma.user.create({
    data: {
      email: "teacher4@schoolms.com", name: "Mr. Daniel Otieno",
      password: hash, role: Role.TEACHER, phone: "+254767890123",
      teacher: { create: {
        employeeId: "EMP004", department: "Humanities",
        qualification: "B.A History & Geography", specialization: "East African History & Civics",
        bio: "Humanities teacher with deep knowledge of Kenyan history.",
        subjects: { create: [{ subjectId: ss.id }, { subjectId: bs.id }, { subjectId: cre.id }] },
      }},
    },
    include: { teacher: true },
  });

  const t5 = await prisma.user.create({
    data: {
      email: "teacher5@schoolms.com", name: "Ms. Joyce Auma",
      password: hash, role: Role.TEACHER, phone: "+254778901234",
      teacher: { create: {
        employeeId: "EMP005", department: "Technical & Creative",
        qualification: "B.Ed Technology", specialization: "Design Technology & Visual Arts",
        bio: "Creative educator helping students explore innovation and artistic expression.",
        subjects: { create: [{ subjectId: pts.id }, { subjectId: cas.id }] },
      }},
    },
    include: { teacher: true },
  });

  // ── Classes ────────────────────────────────────────────────────────
  const allSubjectIds = subjects.map((s) => ({ subjectId: s.id }));

  const class7A = await prisma.class.create({ data: { name: "Grade 7A", grade: 7, section: "A", capacity: 40, room: "Room 101", classTeacherId: t1.teacher!.id, subjects: { create: allSubjectIds } } });
  const class7B = await prisma.class.create({ data: { name: "Grade 7B", grade: 7, section: "B", capacity: 40, room: "Room 102", classTeacherId: t3.teacher!.id, subjects: { create: allSubjectIds } } });
  const class8A = await prisma.class.create({ data: { name: "Grade 8A", grade: 8, section: "A", capacity: 40, room: "Room 201", classTeacherId: t2.teacher!.id, subjects: { create: allSubjectIds } } });
  const class8B = await prisma.class.create({ data: { name: "Grade 8B", grade: 8, section: "B", capacity: 40, room: "Room 202", classTeacherId: t4.teacher!.id, subjects: { create: allSubjectIds } } });

  // Suppress unused variable warning for t5
  void t5;

  // ── Timetable for teacher 1 ────────────────────────────────────────
  const t1Slots = [
    { day: 1, start: "08:00", end: "09:00", cls: class7A, subj: math },
    { day: 2, start: "08:00", end: "09:00", cls: class7A, subj: math },
    { day: 3, start: "10:00", end: "11:00", cls: class7A, subj: intSci },
    { day: 4, start: "08:00", end: "09:00", cls: class7A, subj: math },
    { day: 5, start: "09:00", end: "10:00", cls: class7A, subj: intSci },
  ];
  for (const slot of t1Slots) {
    await prisma.timetableEntry.create({
      data: {
        teacherId: t1.teacher!.id, classId: slot.cls.id, subjectId: slot.subj.id,
        dayOfWeek: slot.day, startTime: slot.start, endTime: slot.end,
        room: slot.cls.room ?? undefined,
      },
    });
  }

  // ── Parents ────────────────────────────────────────────────────────
  const p1 = await prisma.user.create({ data: { email: "parent1@example.com", name: "Mr. Joseph Njoroge", password: hash, role: Role.PARENT, phone: "+254722345678", parent: { create: { occupation: "Engineer", address: "123 Westlands, Nairobi" } } }, include: { parent: true } });
  const p2 = await prisma.user.create({ data: { email: "parent2@example.com", name: "Dr. Fatuma Ali",     password: hash, role: Role.PARENT, phone: "+254733456789", parent: { create: { occupation: "Doctor",   address: "45 Karen Road, Nairobi" } } }, include: { parent: true } });
  const p3 = await prisma.user.create({ data: { email: "parent3@example.com", name: "Mr. John Kamau",     password: hash, role: Role.PARENT, phone: "+254744567890", parent: { create: { occupation: "Business Owner", address: "78 Kileleshwa, Nairobi" } } }, include: { parent: true } });
  const p4 = await prisma.user.create({ data: { email: "parent4@example.com", name: "Ms. Rose Achieng",   password: hash, role: Role.PARENT, phone: "+254755678901", parent: { create: { occupation: "Teacher", address: "12 Lavington, Nairobi" } } }, include: { parent: true } });

  // ── Students ───────────────────────────────────────────────────────
  const studentsData = [
    { id: "STU001", name: "Brian Njoroge",   gender: "Male",   classId: class7A.id, parentId: p1.parent!.id, dob: new Date("2011-03-15") },
    { id: "STU002", name: "Chloe Njoroge",   gender: "Female", classId: class7B.id, parentId: p1.parent!.id, dob: new Date("2012-07-22") },
    { id: "STU003", name: "Omar Ali",         gender: "Male",   classId: class7A.id, parentId: p2.parent!.id, dob: new Date("2011-05-10") },
    { id: "STU004", name: "Aisha Ali",        gender: "Female", classId: class8A.id, parentId: p2.parent!.id, dob: new Date("2010-01-30") },
    { id: "STU005", name: "Kevin Kamau",      gender: "Male",   classId: class8B.id, parentId: p3.parent!.id, dob: new Date("2010-09-18") },
    { id: "STU006", name: "Linda Kamau",      gender: "Female", classId: class7B.id, parentId: p3.parent!.id, dob: new Date("2011-11-05") },
    { id: "STU007", name: "Faith Achieng",    gender: "Female", classId: class8A.id, parentId: p4.parent!.id, dob: new Date("2010-04-25") },
    { id: "STU008", name: "Moses Odhiambo",   gender: "Male",   classId: class7A.id, parentId: p4.parent!.id, dob: new Date("2011-08-14") },
    { id: "STU009", name: "Diana Mwangi",     gender: "Female", classId: class8B.id, parentId: p1.parent!.id, dob: new Date("2010-02-28") },
    { id: "STU010", name: "Caleb Otieno",     gender: "Male",   classId: class8A.id, parentId: p2.parent!.id, dob: new Date("2010-06-12") },
    { id: "STU011", name: "Purity Wangari",   gender: "Female", classId: class7A.id, parentId: p3.parent!.id, dob: new Date("2011-12-01") },
    { id: "STU012", name: "Emmanuel Kiprop",  gender: "Male",   classId: class8B.id, parentId: p4.parent!.id, dob: new Date("2010-07-19") },
  ];

  const bloodGroups = ["A+", "B+", "O+", "AB+", "O-"];
  const students = await Promise.all(
    studentsData.map((s) =>
      prisma.student.create({
        data: {
          studentId: s.id, name: s.name, gender: s.gender,
          classId: s.classId, parentId: s.parentId, dateOfBirth: s.dob,
          bloodGroup: bloodGroups[Math.floor(Math.random() * bloodGroups.length)],
        },
      })
    )
  );

  // ── Student login accounts ─────────────────────────────────────────
  await prisma.user.create({ data: { email: "student@schoolms.com", name: "Brian Njoroge", password: hash, role: Role.STUDENT, phone: "+254700111222", student: { create: { studentId: students[0].id } } } });
  await prisma.user.create({ data: { email: "aisha@schoolms.com",   name: "Aisha Ali",     password: hash, role: Role.STUDENT, student: { create: { studentId: students[3].id } } } });
  await prisma.user.create({ data: { email: "kevin@schoolms.com",   name: "Kevin Kamau",   password: hash, role: Role.STUDENT, student: { create: { studentId: students[4].id } } } });

  console.log("✅ Users, teachers, classes, students created");

  // ── Performance metrics ────────────────────────────────────────────
  const terms = ["Term 1 2024", "Term 2 2024", "Term 3 2024", "Term 1 2025"];
  const examTypes = ["Formative Assessment 1", "Formative Assessment 2", "Summative Assessment", "End of Term"];
  const coreSubjects = [english, kiswahili, math, intSci, ss, cre, bs];

  for (const student of students) {
    for (const subj of coreSubjects) {
      for (const term of terms) {
        const score = Math.min(100, Math.max(20, 52 + Math.floor(Math.random() * 43)));
        const grade = cbcGrade(score);
        await prisma.performanceMetric.create({
          data: {
            studentId: student.id, subjectId: subj.id, term, score, grade,
            maxScore: 100, examType: examTypes[Math.floor(Math.random() * 4)],
            remarks: cbcRemark(grade),
          },
        });
      }
    }
  }

  console.log("✅ Performance metrics created");

  // ── Attendance records (last 30 school days) ───────────────────────
  const now = new Date();
  const schoolDays: Date[] = [];
  const cursor = new Date(now);
  cursor.setDate(cursor.getDate() - 1);
  while (schoolDays.length < 30) {
    if (cursor.getDay() !== 0 && cursor.getDay() !== 6) {
      schoolDays.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  for (const student of students) {
    for (const day of schoolDays) {
      const r = Math.random();
      const status =
        r > 0.92 ? AttendanceStatus.ABSENT :
        r > 0.87 ? AttendanceStatus.LATE :
        AttendanceStatus.PRESENT;
      await prisma.attendanceRecord.create({
        data: {
          studentId: student.id, classId: student.classId, date: day, status,
          note: status === AttendanceStatus.ABSENT ? "Parent notified" :
                status === AttendanceStatus.LATE   ? "Arrived 15 min late" : null,
        },
      }).catch(() => { /* skip duplicate */ });
    }
  }

  console.log("✅ Attendance records created");

  // ── Homework & submissions ─────────────────────────────────────────
  const tomorrow  = new Date(now.getTime() + 86400000);
  const nextWeek  = new Date(now.getTime() + 7 * 86400000);
  const yesterday = new Date(now.getTime() - 86400000);

  const hwList = await Promise.all([
    prisma.homework.create({ data: { title: "Algebra – Linear Equations Worksheet", description: "Solve exercises 1–20 on page 87. Show all working steps clearly.", instructions: "1. Attempt all questions\n2. Show full working\n3. Write your name and student ID at the top", dueDate: tomorrow,  classId: class7A.id, subjectId: math.id,     teacherId: t1.teacher!.id, maxScore: 100 } }),
    prisma.homework.create({ data: { title: "Reading Comprehension – 'A Grain of Wheat'", description: "Read chapters 3–4 and write a 300-word summary focusing on characterisation.", instructions: "Your summary must:\n- Identify main characters\n- Describe key events\n- Quote at least one line\n- Be written in your own words", dueDate: nextWeek,  classId: class7A.id, subjectId: english.id, teacherId: t3.teacher!.id, isWeekly: true, maxScore: 50 } }),
    prisma.homework.create({ data: { title: "Photosynthesis Diagram & Notes", description: "Draw and fully label the process of photosynthesis.", instructions: "Use a full A4 page. Label all inputs, outputs, and organelles.", dueDate: tomorrow,  classId: class8A.id, subjectId: intSci.id,  teacherId: t2.teacher!.id, maxScore: 100 } }),
    prisma.homework.create({ data: { title: "Business Plan Draft", description: "Draft a simple business plan for a small enterprise of your choice.", instructions: "Include:\n1. Business idea\n2. Target market\n3. Pricing strategy\n4. Marketing plan\nMinimum 400 words", dueDate: nextWeek,  classId: class8B.id, subjectId: bs.id,      teacherId: t4.teacher!.id, isWeekly: true, maxScore: 100 } }),
    prisma.homework.create({ data: { title: "Kiswahili Insha", description: "Andika insha ya maneno 250-300 kuhusu umuhimu wa elimu.", dueDate: yesterday, classId: class7B.id, subjectId: kiswahili.id, teacherId: t3.teacher!.id, maxScore: 80 } }),
  ]);

  for (const hw of hwList) {
    const classStudents = students.filter((s) => s.classId === hw.classId);
    for (const student of classStudents) {
      const isOverdue = new Date(hw.dueDate) < now;
      const submitted = isOverdue ? Math.random() > 0.25 : Math.random() > 0.55;
      const grade     = submitted ? 50 + Math.floor(Math.random() * 45) : null;
      await prisma.homeworkSubmission.create({
        data: {
          homeworkId: hw.id, studentId: student.id,
          status:      submitted ? (grade && grade >= 50 ? "GRADED" : "SUBMITTED") : "PENDING",
          submittedAt: submitted ? new Date(hw.dueDate.getTime() - Math.random() * 12 * 3600000) : null,
          grade,
          content:     submitted ? "I have completed this assignment as instructed." : null,
          feedback:    grade
            ? grade >= 80 ? "Excellent work!"
            : grade >= 65 ? "Good effort. Review highlights."
            : grade >= 50 ? "Adequate. More practice needed."
            : "Please seek extra support."
            : null,
        },
      });
    }
  }

  console.log("✅ Homework + submissions created");

  // ── Fees ───────────────────────────────────────────────────────────
  const feeTerms = [
    { term: "Term 1", year: "2024", amount: 45000, due: new Date("2024-02-15") },
    { term: "Term 2", year: "2024", amount: 42000, due: new Date("2024-05-31") },
    { term: "Term 3", year: "2024", amount: 43000, due: new Date("2024-09-30") },
    { term: "Term 1", year: "2025", amount: 47000, due: new Date("2025-02-28") },
  ];

  for (const student of students) {
    for (const fee of feeTerms) {
      const r       = Math.random();
      const paid    = r > 0.6 ? fee.amount : r > 0.3 ? Math.floor(fee.amount * (0.3 + Math.random() * 0.5)) : 0;
      const status: FeeStatus =
        paid >= fee.amount ? FeeStatus.PAID :
        paid > 0           ? FeeStatus.PARTIAL :
        new Date(fee.due) < now ? FeeStatus.OVERDUE :
        FeeStatus.PENDING;
      await prisma.fee.create({
        data: {
          studentId: student.id, classId: student.classId,
          term: fee.term, academicYear: fee.year,
          totalAmount: fee.amount, paidAmount: paid,
          dueDate: fee.due, status,
          description: `${fee.term} ${fee.year} – Tuition and facilities`,
        },
      });
    }
  }

  // ── Co-curricular activities ───────────────────────────────────────
  await prisma.coCurricularActivity.createMany({
    data: [
      { studentId: students[0].id, name: "Football Club",       category: "Sports",          role: "Team Captain",  achievement: "Zone Champions",                startDate: new Date("2024-01-15") },
      { studentId: students[0].id, name: "Mathematics Club",    category: "Academic",                               achievement: "2nd Place – County Math Olympiad", startDate: new Date("2024-03-01") },
      { studentId: students[0].id, name: "Drama Club",          category: "Performing Arts", role: "Lead Actor",                                                    startDate: new Date("2024-01-15") },
      { studentId: students[2].id, name: "Debate Club",         category: "Academic",        role: "Team Member",   achievement: "Best Speaker",                  startDate: new Date("2024-02-01") },
      { studentId: students[3].id, name: "Science Club",        category: "Academic",        role: "Secretary",                                                    startDate: new Date("2024-01-15") },
      { studentId: students[4].id, name: "Young Entrepreneurs", category: "Business",        role: "Chairperson",   achievement: "Best Business Idea Award",       startDate: new Date("2024-02-15") },
      { studentId: students[6].id, name: "Debate Club",         category: "Academic",        role: "Team Captain",  achievement: "County Champions",               startDate: new Date("2024-01-15") },
      { studentId: students[7].id, name: "Music Band",          category: "Performing Arts", role: "Lead Vocalist",                                                startDate: new Date("2024-01-15") },
    ],
  });

  // ── Calendar events ────────────────────────────────────────────────
  const events = await Promise.all([
    prisma.calendarEvent.create({ data: { title: "Mathematics – Grade 7A",          startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(),  8, 0), endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(),  9, 0), type: "CLASS",   classId: class7A.id, teacherId: t1.teacher!.id, color: "#3b82f6", isPublic: false } }),
    prisma.calendarEvent.create({ data: { title: "Parent-Teacher Conference",        startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 14, 0), endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 17, 0), type: "MEETING", color: "#f59e0b", isPublic: true } }),
    prisma.calendarEvent.create({ data: { title: "Nairobi Museum Educational Trip",  startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7), endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7), type: "TRIP",  allDay: true, classId: class8A.id, color: "#8b5cf6", isPublic: true, requiresPayment: true, amount: 1500, paymentDeadline: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5) } }),
    prisma.calendarEvent.create({ data: { title: "End of Term Summative Assessments",startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14), endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 17), type: "EXAM",  allDay: true, color: "#ef4444", isPublic: true } }),
    prisma.calendarEvent.create({ data: { title: "CBC Inter-School Sports Day",       startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 21), endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 21), type: "EVENT", allDay: true, color: "#f97316", isPublic: true, requiresPayment: true, amount: 500, paymentDeadline: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 18) } }),
    prisma.calendarEvent.create({ data: { title: "School Science Fair",               startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 28), endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 28), type: "EVENT", allDay: true, color: "#10b981", isPublic: true } }),
  ]);

  // Event payments for trip (Grade 8A students)
  const tripEvent = events[2];
  const class8AStudents = students.filter((s) => s.classId === class8A.id);
  for (const student of class8AStudents) {
    const parent = await prisma.parent.findUnique({ where: { id: student.parentId } });
    if (parent) {
      const paid = Math.random() > 0.5;
      await prisma.eventPayment.create({
        data: {
          eventId: tripEvent.id, studentId: student.id, parentId: parent.id,
          amount: 1500, status: paid ? FeeStatus.PAID : FeeStatus.PENDING,
          paidAt: paid ? new Date() : null,
        },
      });
    }
  }

  console.log("✅ Events + fees + activities created");

  // ── Notifications ──────────────────────────────────────────────────
  const n1 = await prisma.notification.create({ data: { title: "Term 1 2025 Fees Due",                message: "Term 1 2025 fees of KES 47,000 are due by 28th February 2025. Pay via M-PESA Paybill 123456, Account: Student ID.", type: "FEE",          senderId: adminUser.id, isGlobal: true } });
  const n2 = await prisma.notification.create({ data: { title: "Museum Trip – Payment Required",       message: "Grade 8A: The Nairobi Museum trip requires a payment of KES 1,500 per learner. Please pay by Wednesday.",             type: "EVENT",        senderId: adminUser.id, classId: class8A.id, linkType: "EVENT",    linkId: tripEvent.id } });
  const n3 = await prisma.notification.create({ data: { title: "Algebra Homework Due Tomorrow",        message: "Reminder: The Algebra Linear Equations worksheet is due tomorrow at the start of class.",                              type: "HOMEWORK",     senderId: t1.id,        classId: class7A.id, linkType: "HOMEWORK", linkId: hwList[0].id } });
  const n4 = await prisma.notification.create({ data: { title: "End of Term Assessments – 2 Weeks",   message: "Summative assessments start in 2 weeks. Ensure all coursework is completed and submitted.",                            type: "ANNOUNCEMENT", senderId: adminUser.id, isGlobal: true } });

  for (const parent of [p1, p2, p3, p4]) {
    await prisma.userNotification.createMany({
      data: [
        { userId: parent.id, notificationId: n1.id },
        { userId: parent.id, notificationId: n4.id },
      ],
    }).catch(() => {});
  }
  await prisma.userNotification.create({ data: { userId: p2.id, notificationId: n2.id } }).catch(() => {});

  const studentUser = await prisma.user.findUnique({ where: { email: "student@schoolms.com" } });
  if (studentUser) {
    await prisma.userNotification.createMany({
      data: [
        { userId: studentUser.id, notificationId: n3.id },
        { userId: studentUser.id, notificationId: n4.id },
      ],
    }).catch(() => {});
  }

  console.log("\n✅ Seeding complete!");
  console.log("─────────────────────────────────────────");
  console.log("Demo accounts (password: password123)");
  console.log("  Admin:    admin@schoolms.com");
  console.log("  Teacher:  teacher1@schoolms.com");
  console.log("  Parent:   parent1@example.com");
  console.log("  Student:  student@schoolms.com");
  console.log("─────────────────────────────────────────");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
