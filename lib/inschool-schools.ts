"use client";

import { useSyncExternalStore } from "react";

export const INSCHOOL_LIST_AS_OF = "July 10, 2026";

export const SCHOOL_TYPES = ["ELM", "Scholarnet"] as const;

export type SchoolType = (typeof SCHOOL_TYPES)[number];

export interface InSchoolSchool {
  code: string;
  name: string;
  city: string;
  state: string;
  zip: string;
  branch: string | null;
  type: SchoolType;
  address: string;
}

function school(
  code: string,
  name: string,
  city: string,
  state: string,
  zip: string,
  branch: string | null,
  type: SchoolType,
  address: string,
): InSchoolSchool {
  return { code, name, city, state, zip, branch, type, address };
}

export const INSCHOOL_SCHOOLS: InSchoolSchool[] = [
  school("325800", "DUQUESNE UNIVERSITY OF THE HOLY SPIRIT", "PITTSBURG", "PA", "15282", "1", "ELM", "600 FORBES AVENUE"),
  school("464100", "DUNWOODY COLLEGE OF TECHNOLOGY", "MINNEAPOLIS", "MN", "55403", "1192", "Scholarnet", "818 DUNWOODY BOULEVARD"),
  school("292010", "DUKE UNIVERSITY - SCHOOL OF PUBLIC POLICY", "DURHAM", "NC", "27708", null, "ELM", "PO BOX 90239"),
  school("292007", "DUKE UNIVERSITY - SCHOOL OF NURSING", "DURHAM", "NC", "27710", null, "ELM", "TRENT DRIVE"),
  school("292008", "DUKE UNIVERSITY - SCHOOL OF ENVIRONMENT", "DURHAM", "NC", "27708", null, "ELM", "A142 LEV SCIENCE RESEARCH CENTER"),
  school("292001", "DUKE UNIVERSITY - MEDICAL SCHOOL", "DURHAM", "NC", "27710", null, "ELM", "126 DAVISON"),
  school("292002", "DUKE UNIVERSITY - LAW SCHOOL", "DURHAM", "NC", "27708", null, "ELM", "2025 LAW SCHOOL"),
  school("292003", "DUKE UNIVERSITY - GRADUATE SCHOOL", "DURHAM", "NC", "27708", null, "ELM", "120 ALLEN BUILDING"),
  school("292004", "DUKE UNIVERSITY - FUQUA SCHOOL OF BUSINESS", "DURHAM", "NC", "27708", null, "ELM", "284E FUQUA SCHOOL"),
  school("292006", "DUKE UNIVERSITY - DIVINITY SCHOOL", "DURHAM", "NC", "27708", null, "ELM", "101 NEW DIVINITY"),
  school("292000", "DUKE UNIVERSITY", "DURHAM", "NC", "27708", "397", "ELM", "2127 CAMPUS DRIVE"),
  school("246100", "DRURY UNIVERSITY", "SPRINGFIELD", "MO", "65802", "3731", "ELM", "900 NORTH BENTON AVENUE"),
  school("325602", "Drexel University College of Medicine - Center City", "PHILADELPHIA", "PA", "19102", null, "ELM", "245 N. 15TH STREET"),
  school("325600", "DREXEL UNIVERSITY", "PHILADELPHIA", "PA", "19104", "2875", "ELM", "3141 CHESTNUT STREET"),
  school("260300", "DREW UNIVERSITY", "MADISON", "NJ", "07940", "4063", "ELM", "36 MADISON AVENUE"),
  school("186000", "DRAKE UNIVERSITY", "DES MOINES", "IA", "50311", "4505", "ELM", "2507 UNIVERSITY AVENUE"),
  school("119600", "DOMINICAN UNIVERSITY OF CALIFORNIA", "SAN RAFAEL", "CA", "94901", "2298", "ELM", "50 ACACIA AVENUE"),
  school("21300", "Dominican University New York", "ORANGEBURG", "NY", "10962", "1210", "ELM", "470 WESTERN HIGHWAY"),
  school("17600", "DOMINICAN UNIVERSITY", "RIVER FOREST", "IL", "60305", "1066", "ELM", "7900 WEST DIVISION STREET"),
  school("254400", "DOANE UNIVERSITY", "CRETE", "NE", "68333", "2421", "Scholarnet", "1014 BOSWELL AVENUE"),
  school("3872400", "Divine Mercy University", "ARLINGTON", "VA", "22202", "3609", "ELM", "45154 UNDERWOOD LANE"),
  school("200400", "DILLARD UNIVERSITY", "NEW ORLEANS", "LA", "70122", "3097", "ELM", "2601 GENTILLY BOULEVARD"),
  school("259800", "DICKINSON STATE UNIVERSITY", "DICKINSON", "ND", "58601", "4896", "Scholarnet", "291 CAMPUS DRIVE"),
  school("325300", "DICKINSON COLLEGE", "CARLISLE", "PA", "17013", "2896", "ELM", "COLLEGE AND LOUTHER STREETS"),
  school("398600", "DESALES UNIVERSITY", "CENTER VALLEY", "PA", "18034", "9568", "ELM", "2755 STATION AVENUE"),
  school("185500", "DES MOINES UNIVERSITY - OSTEOPATHIC MEDICAL CENTER", "DES MOINES", "IA", "50312", "4198", "ELM", "3200 GRAND AVENUE"),
];

let schools = INSCHOOL_SCHOOLS.map((row) => ({ ...row }));
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function useInSchoolSchools() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => schools,
    () => schools,
  );
}

export function setSchoolType(code: string, type: SchoolType) {
  schools = schools.map((row) => (row.code === code ? { ...row, type } : row));
  emit();
}
