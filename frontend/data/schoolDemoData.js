const db = {
  institutions: {
    "inst-uy": {
      id: "inst-uy",
      name: "Escuela Demo Uruguay",
      code: "INST-4A",
      teacher_name: "Profe Lucia",
      teacher_email: "lucia@yoaprendo.demo"
    }
  },
  teachers: {
    "teacher-lucia": {
      id: "teacher-lucia",
      institution_id: "inst-uy",
      name: "Profe Lucia",
      email: "lucia@yoaprendo.demo",
      code: "DOC-4A",
      classroom_ids: ["class-4a"]
    }
  },
  classrooms: {
    "class-4a": {
      id: "class-4a",
      institution_id: "inst-uy",
      name: "4.o A",
      grade_label: "4.o de escuela",
      group_code: "AULA-4A",
      student_ids: ["stu-sofi", "stu-mateo", "stu-emma", "stu-benja"],
      assigned_worlds: ["Secuencias", "Bucles", "Decisiones"]
    },
    "class-4b": {
      id: "class-4b",
      institution_id: "inst-uy",
      name: "4.o B",
      grade_label: "4.o de escuela",
      group_code: "AULA-4B",
      student_ids: ["stu-mila", "stu-valen"],
      assigned_worlds: ["Secuencias", "Datos y creacion"]
    }
  },
  students: {
    "stu-sofi": {
      id: "stu-sofi",
      name: "Sofi",
      display_name: "Sofi",
      classroom_id: "class-4a",
      student_code: "Nivel 4",
      streak_days: 3,
      energy: 82,
      weekly_minutes: 42,
      attendance: "Activa",
      completed_missions: 8,
      total_missions: 28,
      strong_concept: "Secuencias",
      needs_support: "Bucles",
      autonomy: "En crecimiento",
      badges: ["Exploradora curiosa", "Ordena secuencias", "Primer faro desbloqueado"],
      focus_tip: "Hoy conviene seguir con una mision corta y sumar otra estrella.",
      next_mission: { world: "Isla de los Bucles", title: "Repite el camino", number: 8 },
      concepts: [
        { title: "Secuencias", completed: 6, total: 7, percent: 86 },
        { title: "Bucles", completed: 1, total: 7, percent: 14 },
        { title: "Decisiones", completed: 1, total: 7, percent: 14 },
        { title: "Datos y creacion", completed: 0, total: 7, percent: 0 }
      ],
      teacher_message: "Le responde muy bien a desafios cortos y visuales."
    },
    "stu-mateo": {
      id: "stu-mateo",
      name: "Mateo",
      display_name: "Mateo",
      classroom_id: "class-4a",
      student_code: "MAT-4A",
      streak_days: 5,
      energy: 88,
      weekly_minutes: 68,
      attendance: "Activa",
      completed_missions: 11,
      total_missions: 28,
      strong_concept: "Bucles",
      needs_support: "Decisiones",
      autonomy: "Alta",
      badges: ["Capitan del ritmo", "Encuentra patrones"],
      focus_tip: "Puede sostener un desafio un poco mas largo.",
      next_mission: { world: "Isla de las Decisiones", title: "Puertas con reglas", number: 12 },
      concepts: [
        { title: "Secuencias", completed: 5, total: 7, percent: 71 },
        { title: "Bucles", completed: 4, total: 7, percent: 57 },
        { title: "Decisiones", completed: 2, total: 7, percent: 29 },
        { title: "Datos y creacion", completed: 0, total: 7, percent: 0 }
      ],
      teacher_message: "Buen avance; necesita verbalizar mas por que elige una condicion."
    },
    "stu-emma": {
      id: "stu-emma",
      name: "Emma",
      display_name: "Emma",
      classroom_id: "class-4a",
      student_code: "EMM-4A",
      streak_days: 2,
      energy: 74,
      weekly_minutes: 51,
      attendance: "Activa",
      completed_missions: 9,
      total_missions: 28,
      strong_concept: "Secuencias",
      needs_support: "Datos y creacion",
      autonomy: "Media",
      badges: ["Ruta segura"],
      focus_tip: "Le sirve repetir una mision con una regla nueva.",
      next_mission: { world: "Isla de las Decisiones", title: "Si pasa, entonces", number: 10 },
      concepts: [
        { title: "Secuencias", completed: 5, total: 7, percent: 71 },
        { title: "Bucles", completed: 2, total: 7, percent: 29 },
        { title: "Decisiones", completed: 2, total: 7, percent: 29 },
        { title: "Datos y creacion", completed: 0, total: 7, percent: 0 }
      ],
      teacher_message: "Participa mejor cuando puede explicar la solucion con dibujos."
    },
    "stu-benja": {
      id: "stu-benja",
      name: "Benja",
      display_name: "Benja",
      classroom_id: "class-4a",
      student_code: "BEN-4A",
      streak_days: 1,
      energy: 53,
      weekly_minutes: 12,
      attendance: "Acompanar",
      completed_missions: 2,
      total_missions: 28,
      strong_concept: "Exploracion inicial",
      needs_support: "Constancia",
      autonomy: "Baja",
      badges: ["Primer desembarco"],
      focus_tip: "Necesita consignas cortas y mucho feedback de logro rapido.",
      next_mission: { world: "Isla de las Secuencias", title: "Ordena los pasos", number: 3 },
      concepts: [
        { title: "Secuencias", completed: 2, total: 7, percent: 29 },
        { title: "Bucles", completed: 0, total: 7, percent: 0 },
        { title: "Decisiones", completed: 0, total: 7, percent: 0 },
        { title: "Datos y creacion", completed: 0, total: 7, percent: 0 }
      ],
      teacher_message: "Conviene acompanar el ingreso y asegurar una mision ganable por sesion."
    },
    "stu-mila": {
      id: "stu-mila",
      name: "Mila",
      display_name: "Mila",
      classroom_id: "class-4b",
      student_code: "MIL-4B",
      streak_days: 6,
      energy: 90,
      weekly_minutes: 74,
      attendance: "Activa",
      completed_missions: 13,
      total_missions: 28,
      strong_concept: "Decisiones",
      needs_support: "Datos y creacion",
      autonomy: "Alta",
      badges: ["Resuelve retos", "Abre caminos"],
      focus_tip: "Puede pasar a consignas de creacion y comparacion.",
      next_mission: { world: "Isla de Datos", title: "Agrupa y crea", number: 15 },
      concepts: [
        { title: "Secuencias", completed: 5, total: 7, percent: 71 },
        { title: "Bucles", completed: 3, total: 7, percent: 43 },
        { title: "Decisiones", completed: 5, total: 7, percent: 71 },
        { title: "Datos y creacion", completed: 0, total: 7, percent: 0 }
      ],
      teacher_message: "Muy buena autonomia. Lista para mas exploracion guiada."
    },
    "stu-valen": {
      id: "stu-valen",
      name: "Valen",
      display_name: "Valen",
      classroom_id: "class-4b",
      student_code: "VAL-4B",
      streak_days: 2,
      energy: 67,
      weekly_minutes: 28,
      attendance: "Inactiva",
      completed_missions: 4,
      total_missions: 28,
      strong_concept: "Secuencias",
      needs_support: "Bucles",
      autonomy: "Media",
      badges: ["Primer mapa"],
      focus_tip: "Necesita volver al ritmo de ingreso semanal.",
      next_mission: { world: "Isla de los Bucles", title: "Atajo repetido", number: 8 },
      concepts: [
        { title: "Secuencias", completed: 4, total: 7, percent: 57 },
        { title: "Bucles", completed: 0, total: 7, percent: 0 },
        { title: "Decisiones", completed: 0, total: 7, percent: 0 },
        { title: "Datos y creacion", completed: 0, total: 7, percent: 0 }
      ],
      teacher_message: "Necesita una reentrada suave con objetivos muy cortos."
    }
  },
  guardians: {
    "guardian-sofi": {
      id: "guardian-sofi",
      name: "Familia de Sofi",
      code: "FAM-404",
      student_ids: ["stu-sofi"],
      contact: "familia.sofi@yoaprendo.demo"
    }
  }
};

function getClassroom(classroomId) {
  return db.classrooms[classroomId];
}

function getStudent(studentId) {
  return db.students[studentId];
}

function percent(student) {
  return Math.round((student.completed_missions / student.total_missions) * 100);
}

function studentSummary(student) {
  const classroom = getClassroom(student.classroom_id);
  const institutionRows = institutions.map((institution) => ({
    id: institution.id,
    name: institution.name,
    plan: "trial",
    status: "trialing",
    students: students.length,
    teachers: teachers.length,
    classrooms: classrooms.length,
    guardians: guardians.length,
    avg_completion: percentValues.length ? Math.round(percentValues.reduce((a, b) => a + b, 0) / percentValues.length) : 0,
    alerts: students.filter((student) => student.attendance !== "Activa").length
  }));

  const conceptOverview = ["Secuencias", "Bucles", "Decisiones", "Datos y creacion"].map((title) => {
    const values = students.flatMap((student) =>
      student.concepts.filter((concept) => concept.title === title).map((concept) => concept.percent)
    );
    return { title, percent: values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0 };
  });

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

function classroomSummary(classroom) {
  const students = classroom.student_ids.map((id) => getStudent(id));
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

export function demoAccess() {
  return {
    student: { name: "Sofi", code: "Nivel 4" },
    parent: { name: "Familia de Sofi", code: "FAM-404" },
    teacher: { name: "Profe Lucia", code: "DOC-4A" },
    institution: { name: "Escuela Demo Uruguay", code: "INST-4A" }
  };
}

export function demoLogin({ role, name = "", code = "" }) {
  const roleName = role.toLowerCase();
  const safeName = name.trim().toLowerCase();
  const safeCode = code.trim().toLowerCase();

  if (roleName === "student") {
    const student = Object.values(db.students).find(
      (item) => item.student_code.toLowerCase() === safeCode || item.name.toLowerCase() === safeName
    );
    if (!student) {
      throw new Error("No encontramos ese acceso de alumno.");
    }
    return {
      role: "student",
      display_name: student.display_name,
      entity_id: student.id,
      redirect_view: "world-map"
    };
  }

  if (roleName === "parent") {
    const guardian = Object.values(db.guardians).find(
      (item) => item.code.toLowerCase() === safeCode || item.name.toLowerCase() === safeName
    );
    if (!guardian) {
      throw new Error("No encontramos ese acceso familiar.");
    }
    return {
      role: "parent",
      display_name: guardian.name,
      entity_id: guardian.id,
      redirect_view: "dashboard"
    };
  }

  if (roleName === "institution") {
    const institution = Object.values(db.institutions).find(
      (item) => item.code.toLowerCase() === safeCode || item.name.toLowerCase() === safeName
    );
    if (!institution) {
      throw new Error("No encontramos ese acceso institucional.");
    }
    return {
      role: "institution",
      display_name: institution.name,
      entity_id: institution.id,
      redirect_view: "dashboard"
    };
  }

  if (roleName === "teacher") {
    const teacher = Object.values(db.teachers).find(
      (item) => item.code.toLowerCase() === safeCode || item.name.toLowerCase() === safeName
    );
    if (!teacher) {
      throw new Error("No encontramos ese acceso docente.");
    }
    return {
      role: "teacher",
      display_name: teacher.name,
      entity_id: teacher.id,
      redirect_view: "dashboard"
    };
  }

  if (roleName === "owner") {
    if (safeName !== "rifranjairo@gmail.com") {
      throw new Error("No encontramos ese acceso de producto.");
    }
    return {
      role: "owner",
      display_name: "Jairo Rifran",
      entity_id: "owner",
      redirect_view: "dashboard"
    };
  }

  throw new Error("Rol no soportado.");
}

export function demoStudentDashboard(studentId) {
  const student = getStudent(studentId);
  return {
    student: studentSummary(student),
    badges: student.badges,
    energy: student.energy,
    streak_days: student.streak_days,
    focus_tip: student.focus_tip,
    teacher_message: student.teacher_message,
    next_mission: student.next_mission,
    concepts: student.concepts
  };
}

export function demoParentDashboard(guardianId) {
  const guardian = db.guardians[guardianId];
  const children = guardian.student_ids.map((id) => getStudent(id));
  const summaries = children.map((student) => studentSummary(student));
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

export function demoInstitutionDashboard(institutionId) {
  const institution = db.institutions[institutionId];
  const classrooms = Object.values(db.classrooms).filter((item) => item.institution_id === institutionId);
  const students = classrooms.flatMap((classroom) => classroom.student_ids.map((id) => getStudent(id)));
  const guardians = Object.values(db.guardians);

  const conceptNames = ["Secuencias", "Bucles", "Decisiones", "Datos y creacion"];
  const conceptOverview = conceptNames.map((conceptName) => {
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
    classrooms: classrooms.map((classroom) => classroomSummary(classroom)),
    students: students.map((student) => studentSummary(student)),
    guardians,
    concept_overview: conceptOverview,
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
      classroom_name: getClassroom(student.classroom_id).name
    }))
  };
}

export function demoTeacherDashboard(teacherId) {
  const teacher = db.teachers[teacherId];
  const institution = db.institutions[teacher.institution_id];
  const classrooms = teacher.classroom_ids.map((id) => db.classrooms[id]);
  const students = classrooms.flatMap((classroom) => classroom.student_ids.map((id) => getStudent(id)));

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
    classrooms: classrooms.map((classroom) => classroomSummary(classroom)),
    students: students.map((student) => studentSummary(student)),
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
      classroom_name: getClassroom(student.classroom_id).name
    }))
  };
}

export function demoOwnerDashboard() {
  const institutions = Object.values(db.institutions);
  const classrooms = Object.values(db.classrooms);
  const students = Object.values(db.students);
  const teachers = Object.values(db.teachers);
  const guardians = Object.values(db.guardians);
  const percentValues = students.map((student) => percent(student));

  return {
    owner: { name: "Jairo Rifran", role: "Product owner" },
    summary: {
      institutions: institutions.length,
      classrooms: classrooms.length,
      students: students.length,
      teachers: teachers.length,
      guardians: guardians.length,
      linked_guardians: guardians.filter((guardian) => guardian.student_ids.length).length,
      active_students: students.filter((student) => student.attendance === "Activa").length,
      avg_completion: percentValues.length ? Math.round(percentValues.reduce((a, b) => a + b, 0) / percentValues.length) : 0,
      weekly_minutes: students.reduce((total, student) => total + student.weekly_minutes, 0),
      at_risk_students: students.filter((student) => student.attendance !== "Activa").length,
      expansion_candidates: 1
    },
    plan_breakdown: { trial: institutions.length, school: 0, enterprise: 0 },
    funnel: {
      registered_institutions: institutions.length,
      with_classrooms: institutions.length,
      with_students: institutions.length,
      with_family_links: guardians.length
    },
    concept_overview: conceptOverview,
    institutions: institutionRows,
    details: {
      institutions: institutionRows,
      students: students.map((student) => ({
        id: student.id,
        name: student.display_name,
        institution: "Escuela Demo Uruguay",
        classroom: db.classrooms[student.classroom_id]?.name || "",
        code: student.student_code,
        attendance: student.attendance,
        progress: percent(student),
        weekly_minutes: student.weekly_minutes,
        needs_support: student.needs_support
      })),
      active: students.filter((student) => student.attendance === "Activa").map((student) => ({
        name: student.display_name,
        institution: "Escuela Demo Uruguay",
        classroom: db.classrooms[student.classroom_id]?.name || "",
        progress: percent(student),
        weekly_minutes: student.weekly_minutes
      })),
      teachers: teachers.map((teacher) => ({
        name: teacher.name,
        email: teacher.email,
        institution: db.institutions[teacher.institution_id]?.name || "",
        classrooms: teacher.classroom_ids.length
      })),
      families: guardians.map((guardian) => ({
        name: guardian.name,
        contact: guardian.contact,
        students: guardian.student_ids.length,
        student_names: guardian.student_ids.map((id) => db.students[id]?.display_name).join(", ")
      })),
      alerts: students.filter((student) => student.attendance !== "Activa").map((student) => ({
        name: student.display_name,
        institution: "Escuela Demo Uruguay",
        classroom: db.classrooms[student.classroom_id]?.name || "",
        attendance: student.attendance,
        needs_support: student.needs_support,
        message: student.teacher_message
      })),
      minutes: [...students].sort((a, b) => b.weekly_minutes - a.weekly_minutes).map((student) => ({
        name: student.display_name,
        institution: "Escuela Demo Uruguay",
        weekly_minutes: student.weekly_minutes,
        progress: percent(student)
      })),
      progress: conceptOverview
    },
    expansion_candidates: [],
    ceibal_evidence: [
      "Modelo institucional: la escuela administra docentes, aulas, alumnos y familias.",
      "Datos agregados para medir adopcion, actividad, progreso y alertas pedagogicas.",
      "Arquitectura portable con PostgreSQL y roles preparados para integracion institucional."
    ]
  };
}

export function demoCreateClassroom(institutionId, payload) {
  const id = `class-${payload.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  db.classrooms[id] = {
    id,
    institution_id: institutionId,
    name: payload.name,
    grade_label: payload.grade_label,
    group_code: `AULA-${payload.name.toUpperCase().replace(/\s+/g, "")}`,
    student_ids: [],
    assigned_worlds: ["Secuencias"]
  };
  return { ok: true, classroom: classroomSummary(db.classrooms[id]) };
}

export function demoCreateStudent(classroomId, payload) {
  const id = `stu-${payload.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  db.students[id] = {
    id,
    name: payload.name,
    display_name: payload.display_name?.trim() || payload.name,
    classroom_id: classroomId,
    student_code: payload.student_code?.trim() || `${payload.name.slice(0, 3).toUpperCase()}-${classroomId.toUpperCase()}`,
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
  db.classrooms[classroomId].student_ids.push(id);
  return { ok: true, student: studentSummary(db.students[id]) };
}

export function demoLinkGuardian(studentId, payload) {
  const existing = Object.values(db.guardians).find(
    (guardian) => guardian.code.toLowerCase() === payload.guardian_code.toLowerCase()
  );

  if (existing) {
    if (!existing.student_ids.includes(studentId)) {
      existing.student_ids.push(studentId);
    }
    return { ok: true, guardian: existing };
  }

  const id = `guardian-${payload.guardian_name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  db.guardians[id] = {
    id,
    name: payload.guardian_name,
    code: payload.guardian_code,
    student_ids: [studentId],
    contact: payload.contact || ""
  };
  return { ok: true, guardian: db.guardians[id] };
}
