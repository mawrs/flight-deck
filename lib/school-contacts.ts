export interface SchoolContact {
  school: string;
  name: string;
  email: string;
}

const CONTACTS: Record<string, SchoolContact> = {
  "001381": { school: "Midwest State University", name: "Midwest State Certification", email: "certification@midweststate.edu" },
  "001564": { school: "Emory University", name: "Emory Financial Aid", email: "certification@emory.edu" },
  "001598": { school: "University of Georgia", name: "UGA Certification", email: "certification@uga.edu" },
  "002077": { school: "Johns Hopkins University", name: "Johns Hopkins Financial Aid", email: "certification@jhu.edu" },
  "002219": { school: "Tufts University", name: "Tufts Certification", email: "certification@tufts.edu" },
  "002325": { school: "University of Michigan", name: "Michigan Financial Aid", email: "certification@umich.edu" },
  "003156": { school: "Medical College of Wisconsin", name: "MCW Certification", email: "certification@mcw.edu" },
  "003456": { school: "Northridge College", name: "Northridge Certification", email: "certification@northridge.edu" },
  "003535": { school: "Vanderbilt University", name: "Vanderbilt Financial Aid", email: "certification@vanderbilt.edu" },
  "009100": { school: "Certification office", name: "School Certification", email: "certification@school.edu" },
};

export function contactForSchool(school: string, code = ""): SchoolContact {
  const named = Object.values(CONTACTS).find((item) => item.school === school);
  if (named) return named;
  return schoolContact(code, school);
}

export function schoolContact(code: string, school: string): SchoolContact {
  const known = CONTACTS[code];
  if (known) return { ...known, school: school || known.school };
  const slug = school.toLowerCase().replace(/[^a-z0-9]+/g, "") || "school";
  return {
    school: school || "School",
    name: `${school || "School"} Certification`,
    email: `certification@${slug}.edu`,
  };
}

export function schoolFileName(school: string, subject: string) {
  const short = school.replace(/\s+University$/, "") || school;
  const reason = subject.replace(/\.pdf$/i, "").trim() || "certification follow-up";
  return `Email to ${short} — ${reason}.pdf`;
}
