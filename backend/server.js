const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 8000;
const DATA_PATH = path.join(__dirname, "data.json");

function readDb() {
  return JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
}

function writeDb(db) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(db, null, 2), "utf8");
}

function sendJson(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(body);
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "item";
}

function getClassroom(db, classroomId) {
  const classroom = db.classrooms[classroomId];
  if (!classroom) {
    const error = new Error("Classroom not found");
    error.statusCode = 404;
    throw error;
  }
  return classroom;
}

function getStudent(db, studentId) {
  const student = db.students[studentId];
  if (!student) {
    const error = new Error("Student not found");
    error.statusCode = 404;
    throw error;
  }
  return student;
}

function getTeacher(db, teacherId) {
  const teacher = db.teachers?.[teacherId];
  if (!teacher) {
    const error = new Error("Teacher not found");
    error.statusCode = 404;
    throw error;
  }
  return teacher;
}

function percent(student) {
  return Math.round((student.completed_missions / student.total_missions) * 100);
}

function studentSummary(db, student) {
  const classroom = getClassroom(db, student.classroom_id);
  return {
    id: student.id,
    name: student.name,
    display_name: student.display_name,
    grade_label: classroom.grade_label,
    classroom_name: classroom.name,
    student_code: student.student_code,
    completed_missions: student.completed_missions,
    total_missions: student.total_missions,
    progress_percent: percent(student),
    weekly_minutes: student.weekly_minutes,
    strong_concept: student.strong_concept,
    needs_support: student.needs_support,
    attendance: student.attendance,
    autonomy: student.autonomy
  };
}

function classroomSummary(db, classroom) {
  const students = classroom.student_ids.map((id) => getStudent(db, id));
  const activeToday = students.filter((student) => student.attendance === "Activa").length;
  const avgCompletion = students.length
    ? Math.round(students.reduce((acc, student) => acc + percent(student), 0) / students.length)
    : 0;

  return {
    id: classroom.id,
    name: classroom.name,
    grade_label: classroom.grade_label,
    group_code: classroom.group_code,
    student_count: students.length,
    active_today: activeToday,
    avg_completion: avgCompletion,
    assigned_worlds: classroom.assigned_worlds
  };
}

function buildStudentDashboard(db, studentId) {
  const student = getStudent(db, studentId);
  return {
    student: studentSummary(db, student),
    badges: student.badges,
    energy: student.energy,
    streak_days: student.streak_days,
    focus_tip: student.focus_tip,
    teacher_message: student.teacher_message,
    next_mission: student.next_mission,
    concepts: student.concepts
  };
}

function buildParentDashboard(db, guardianId) {
  const guardian = db.guardians[guardianId];
  if (!guardian) {
    const error = new Error("Guardian not found");
    error.statusCode = 404;
    throw error;
  }

  const children = guardian.student_ids.map((id) => getStudent(db, id));
  const summaries = children.map((student) => studentSummary(db, student));
  const selectedStudent = children[0];

  return {
    guardian,
    summary: {
      children_count: children.length,
      weekly_minutes: children.reduce((acc, child) => acc + child.weekly_minutes, 0),
      strongest: selectedStudent?.strong_concept || "Exploracion inicial",
      needs_support: selectedStudent?.needs_support || "Sin datos"
    },
    children: summaries,
    selected_child: {
      student: summaries[0],
      teacher_message: selectedStudent?.teacher_message || "",
      home_actions: [
        "Pedirle que explique en voz alta como llegaria un personaje a una meta.",
        "Jugar a ordenar pasos cotidianos antes de empezar una tarea.",
        "Celebrar el intento correcto aunque todavia necesite ayuda."
      ],
      observations: [
        "Se engancha mejor cuando la consigna parece una mision.",
        "Conviene acompanar con preguntas cortas en vez de resolver por el nino."
      ]
    }
  };
}

function buildInstitutionDashboard(db, institutionId) {
  const institution = db.institutions[institutionId];
  if (!institution) {
    const error = new Error("Institution not found");
    error.statusCode = 404;
    throw error;
  }

  const classrooms = Object.values(db.classrooms).filter((item) => item.institution_id === institutionId);
  const students = classrooms.flatMap((classroom) => classroom.student_ids.map((id) => getStudent(db, id)));
  const guardians = Object.values(db.guardians);
  const conceptNames = ["Secuencias", "Bucles", "Decisiones", "Datos y creacion"];
  const concept_overview = conceptNames.map((conceptName) => {
    const values = students.flatMap((student) =>
      student.concepts.filter((concept) => concept.title === conceptName).map((concept) => concept.percent)
    );
    const avg = values.length ? Math.round(values.reduce((acc, value) => acc + value, 0) / values.length) : 0;
    return { title: conceptName, percent: avg };
  });

  return {
    institution,
    teacher: {
      name: institution.teacher_name,
      email: institution.teacher_email
    },
    summary: {
      classroom_count: classrooms.length,
      student_count: students.length,
      active_today: students.filter((student) => student.attendance === "Activa").length,
      linked_guardians: guardians.length,
      avg_weekly_minutes: students.length
        ? Math.round(students.reduce((acc, student) => acc + student.weekly_minutes, 0) / students.length)
        : 0,
      avg_completion: students.length
        ? Math.round(students.reduce((acc, student) => acc + percent(student), 0) / students.length)
        : 0
    },
    classrooms: classrooms.map((classroom) => classroomSummary(db, classroom)),
    students: students.map((student) => studentSummary(db, student)),
    guardians,
    concept_overview,
    alerts: students
      .filter((student) => student.attendance !== "Activa")
      .map((student) => ({
        student_name: student.name,
        reason: student.needs_support,
        attendance: student.attendance,
        teacher_message: student.teacher_message
      })),
    available_students: students.map((student) => ({
      id: student.id,
      name: student.name,
      classroom_name: getClassroom(db, student.classroom_id).name
    }))
  };
}

function buildTeacherDashboard(db, teacherId) {
  const teacher = getTeacher(db, teacherId);
  const institution = db.institutions[teacher.institution_id];
  const classrooms = teacher.classroom_ids.map((id) => getClassroom(db, id));
  const students = classrooms.flatMap((classroom) => classroom.student_ids.map((id) => getStudent(db, id)));

  return {
    teacher,
    institution: {
      id: institution.id,
      name: institution.name
    },
    summary: {
      classroom_count: classrooms.length,
      student_count: students.length,
      active_today: students.filter((student) => student.attendance === "Activa").length,
      avg_completion: students.length
        ? Math.round(students.reduce((acc, student) => acc + percent(student), 0) / students.length)
        : 0
    },
    classrooms: classrooms.map((classroom) => classroomSummary(db, classroom)),
    students: students.map((student) => studentSummary(db, student)),
    alerts: students
      .filter((student) => student.attendance !== "Activa")
      .map((student) => ({
        student_name: student.name,
        reason: student.needs_support,
        attendance: student.attendance,
        teacher_message: student.teacher_message
      })),
    available_students: students.map((student) => ({
      id: student.id,
      name: student.name,
      classroom_name: getClassroom(db, student.classroom_id).name
    }))
  };
}

function resolveLogin(db, payload) {
  const role = String(payload.role || "").toLowerCase();
  const safeName = String(payload.name || "").trim().toLowerCase();
  const safeCode = String(payload.code || "").trim().toLowerCase();

  if (role === "student") {
    const student = Object.values(db.students).find(
      (item) => item.student_code.toLowerCase() === safeCode || item.name.toLowerCase() === safeName
    );
    if (!student) {
      const error = new Error("Student access not found");
      error.statusCode = 404;
      throw error;
    }
    return {
      role: "student",
      display_name: student.display_name,
      entity_id: student.id,
      redirect_view: "world-map"
    };
  }

  if (role === "parent") {
    const guardian = Object.values(db.guardians).find(
      (item) => item.code.toLowerCase() === safeCode || item.name.toLowerCase() === safeName
    );
    if (!guardian) {
      const error = new Error("Guardian access not found");
      error.statusCode = 404;
      throw error;
    }
    return {
      role: "parent",
      display_name: guardian.name,
      entity_id: guardian.id,
      redirect_view: "dashboard"
    };
  }

  if (role === "institution") {
    const institution = Object.values(db.institutions).find(
      (item) => item.code.toLowerCase() === safeCode || item.name.toLowerCase() === safeName
    );
    if (!institution) {
      const error = new Error("Institution access not found");
      error.statusCode = 404;
      throw error;
    }
    return {
      role: "institution",
      display_name: institution.name,
      entity_id: institution.id,
      redirect_view: "dashboard"
    };
  }

  if (role === "teacher") {
    const teacher = Object.values(db.teachers || {}).find(
      (item) => item.code.toLowerCase() === safeCode || item.name.toLowerCase() === safeName
    );
    if (!teacher) {
      const error = new Error("Teacher access not found");
      error.statusCode = 404;
      throw error;
    }
    return {
      role: "teacher",
      display_name: teacher.name,
      entity_id: teacher.id,
      redirect_view: "dashboard"
    };
  }

  const error = new Error("Unsupported role");
  error.statusCode = 400;
  throw error;
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    sendJson(res, 400, { detail: "Bad request" });
    return;
  }

  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const { pathname } = url;

  if (req.method === "OPTIONS") {
    sendJson(res, 200, { ok: true });
    return;
  }

  try {
    if (req.method === "GET" && pathname === "/api/health") {
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === "GET" && pathname === "/api/access/demo") {
      sendJson(res, 200, {
        student: { name: "", code: "" },
        parent: { name: "", code: "" },
        teacher: { name: "", code: "" },
        institution: { name: "", code: "" },
        owner: { name: "rifranjairo@gmail.com", code: "" }
      });
      return;
    }

    if (req.method === "POST" && pathname === "/api/access/login") {
      const db = readDb();
      const payload = await parseBody(req);
      sendJson(res, 200, resolveLogin(db, payload));
      return;
    }

    if (req.method === "GET" && pathname.startsWith("/api/dashboard/student/")) {
      const db = readDb();
      const studentId = pathname.split("/").pop();
      sendJson(res, 200, buildStudentDashboard(db, studentId));
      return;
    }

    if (req.method === "GET" && pathname.startsWith("/api/dashboard/parent/")) {
      const db = readDb();
      const guardianId = pathname.split("/").pop();
      sendJson(res, 200, buildParentDashboard(db, guardianId));
      return;
    }

    if (req.method === "GET" && pathname.startsWith("/api/dashboard/institution/")) {
      const db = readDb();
      const institutionId = pathname.split("/").pop();
      sendJson(res, 200, buildInstitutionDashboard(db, institutionId));
      return;
    }

    if (req.method === "GET" && pathname.startsWith("/api/dashboard/teacher/")) {
      const db = readDb();
      const teacherId = pathname.split("/").pop();
      sendJson(res, 200, buildTeacherDashboard(db, teacherId));
      return;
    }

    if (req.method === "POST" && pathname.startsWith("/api/institutions/") && pathname.endsWith("/classrooms")) {
      const db = readDb();
      const institutionId = pathname.split("/")[3];
      const payload = await parseBody(req);
      const classroomIdBase = `class-${slugify(payload.name)}`;
      let classroomId = classroomIdBase;
      let suffix = 1;
      while (db.classrooms[classroomId]) {
        suffix += 1;
        classroomId = `${classroomIdBase}-${suffix}`;
      }
      db.classrooms[classroomId] = {
        id: classroomId,
        institution_id: institutionId,
        name: payload.name,
        grade_label: payload.grade_label,
        group_code: `AULA-${String(payload.name || "").toUpperCase().replace(/\s+/g, "")}`,
        student_ids: [],
        assigned_worlds: ["Secuencias"]
      };
      writeDb(db);
      sendJson(res, 200, { ok: true, classroom: classroomSummary(db, db.classrooms[classroomId]) });
      return;
    }

    if (req.method === "POST" && pathname.startsWith("/api/classrooms/") && pathname.endsWith("/students")) {
      const db = readDb();
      const classroomId = pathname.split("/")[3];
      const classroom = getClassroom(db, classroomId);
      const payload = await parseBody(req);
      const idBase = `stu-${slugify(payload.name)}`;
      let studentId = idBase;
      let suffix = 1;
      while (db.students[studentId]) {
        suffix += 1;
        studentId = `${idBase}-${suffix}`;
      }
      db.students[studentId] = {
        id: studentId,
        name: payload.name,
        display_name: String(payload.display_name || "").trim() || payload.name,
        avatar: "Nuevo tripulante",
        classroom_id: classroomId,
        student_code: String(payload.student_code || "").trim() || `${payload.name.slice(0, 3).toUpperCase()}-${classroom.name.replace(/\s+/g, "")}`,
        streak_days: 0,
        energy: 70,
        weekly_minutes: 0,
        attendance: "Nueva",
        completed_missions: 0,
        total_missions: 28,
        strong_concept: "Inicio",
        needs_support: "Exploracion inicial",
        autonomy: "Acompanada",
        badges: ["Nuevo ingreso"],
        focus_tip: "Conviene empezar por secuencias con una mision breve.",
        next_mission: { world: "Isla de las Secuencias", title: "Primeros pasos", number: 1 },
        concepts: [
          { title: "Secuencias", completed: 0, total: 7, percent: 0 },
          { title: "Bucles", completed: 0, total: 7, percent: 0 },
          { title: "Decisiones", completed: 0, total: 7, percent: 0 },
          { title: "Datos y creacion", completed: 0, total: 7, percent: 0 }
        ],
        teacher_message: "Nuevo alumno. Conviene acompanar el primer acceso."
      };
      classroom.student_ids.push(studentId);
      writeDb(db);
      sendJson(res, 200, { ok: true, student: studentSummary(db, db.students[studentId]) });
      return;
    }

    if (req.method === "POST" && pathname.startsWith("/api/students/") && pathname.endsWith("/guardians")) {
      const db = readDb();
      const studentId = pathname.split("/")[3];
      getStudent(db, studentId);
      const payload = await parseBody(req);
      const guardian = Object.values(db.guardians).find(
        (item) => item.code.toLowerCase() === String(payload.guardian_code || "").toLowerCase()
      );

      if (guardian) {
        if (!guardian.student_ids.includes(studentId)) {
          guardian.student_ids.push(studentId);
        }
        writeDb(db);
        sendJson(res, 200, { ok: true, guardian });
        return;
      }

      const guardianIdBase = `guardian-${slugify(payload.guardian_name)}`;
      let guardianId = guardianIdBase;
      let suffix = 1;
      while (db.guardians[guardianId]) {
        suffix += 1;
        guardianId = `${guardianIdBase}-${suffix}`;
      }

      db.guardians[guardianId] = {
        id: guardianId,
        name: payload.guardian_name,
        code: payload.guardian_code,
        student_ids: [studentId],
        contact: payload.contact || ""
      };
      writeDb(db);
      sendJson(res, 200, { ok: true, guardian: db.guardians[guardianId] });
      return;
    }

    sendJson(res, 404, { detail: "Not found" });
  } catch (error) {
    sendJson(res, error.statusCode || 500, { detail: error.message || "Internal error" });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`YoAprendo backend running at http://127.0.0.1:${PORT}`);
});
