"use client";

import { useSyncExternalStore } from "react";
import { CURRENT_ACCOUNT, ROLES } from "@/lib/account";

export { ROLES };

export type UserRecord = {
  username: string;
  email: string;
  fullName: string;
  personNumber: string;
  verifiedEmail: boolean;
  lockedOut: boolean;
  roles: string[];
  dnaPersonNumber: string;
  nmlsId: string;
};

const SEED: UserRecord[] = [
  user(CURRENT_ACCOUNT.username, CURRENT_ACCOUNT.email, CURRENT_ACCOUNT.fullName, "1", true, [...CURRENT_ACCOUNT.roles]),
  user("aauser", "jhart@southeastbank.com", "Aardvark User", "294", true),
  user("abotts", "abotts@southeastbank.com", "Amanda Botts", "37", true),
  user("abrewer", "abrewer@southeastbank.com", "Aniko Brewer", "3", true, ["Admin", "Viewer"]),
  user("aeads", "aeads@southeastbank.com", "Alice Eads", "10", true),
  user("agardner", "rgardner@southeastbank.com", "Randi Gardner", "359", false),
  user("apiservice", "apiservice@southeastbank.com", "API Service", "5", true, ["Viewer"]),
  user("atest", "jhart@southeastbank.com", "Aaron Test", "247", false, ["Underwriter"]),
  user("avermette", "avermette@southeastbank.com", "Austen Vermette", "331", true, ["Underwriter"]),
  user("ayork", "ayork@southeastbank.com", "Ashley York", "164", true),
  user("bbTest", "jhart@southeastbank.com", "bb Test", "309", false),
];

const EXTRA: Array<[string, string]> = [
  ["Chris", "Chen"],
  ["Dana", "Nguyen"],
  ["Elena", "Vasquez"],
  ["Frank", "Okoye"],
  ["Gina", "Patel"],
  ["Hugo", "Schmidt"],
  ["Iris", "Walker"],
  ["Jonah", "Reed"],
  ["Kara", "Singh"],
  ["Leo", "Martinez"],
  ["Mina", "Cho"],
  ["Nate", "Brooks"],
  ["Opal", "Hughes"],
  ["Paul", "Ibarra"],
  ["Quinn", "Foster"],
  ["Rosa", "Klein"],
  ["Sam", "Diaz"],
  ["Tara", "Bennett"],
  ["Uma", "Shah"],
  ["Victor", "Lane"],
  ["Willa", "Grant"],
  ["Xavier", "Moss"],
  ["Yara", "Cole"],
  ["Zach", "Perry"],
  ["Maren", "Burns"],
  ["Brett", "Hale"],
  ["Celia", "Nash"],
  ["Derek", "Owen"],
  ["Faith", "Quincy"],
  ["Glenn", "Russo"],
  ["Helen", "Shaw"],
  ["Ivan", "Todd"],
  ["Jade", "Underwood"],
  ["Kyle", "Vaughn"],
  ["Lila", "West"],
  ["Marc", "Young"],
  ["Nora", "Zimmer"],
  ["Omar", "Abbott"],
  ["Priya", "Blake"],
  ["Reed", "Caldwell"],
  ["Sofia", "Dalton"],
  ["Theo", "Ellison"],
  ["Vera", "Fletcher"],
  ["Wade", "Griffin"],
  ["Xena", "Holloway"],
  ["Yuri", "Ingram"],
];

function user(
  username: string,
  email: string,
  fullName: string,
  personNumber: string,
  verifiedEmail: boolean,
  roles: string[] = ["Viewer"],
): UserRecord {
  return {
    username,
    email,
    fullName,
    personNumber,
    verifiedEmail,
    lockedOut: false,
    roles,
    dnaPersonNumber: "0",
    nmlsId: "",
  };
}

const extras: UserRecord[] = EXTRA.map(([first, last], index) =>
  user(
    `${first[0]}${last}`.toLowerCase(),
    `${first[0]}${last}@southeastbank.com`.toLowerCase(),
    `${first} ${last}`,
    String(400 + index),
    index % 4 !== 0,
    index % 7 === 0 ? ["SLA"] : index % 5 === 0 ? ["Underwriter"] : ["Viewer"],
  ),
);

extras[3].lockedOut = true;
extras[11].lockedOut = true;
extras[22].lockedOut = true;

let users: UserRecord[] = [...SEED, ...extras];
let pendingNotice = "";
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function useUsers() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => users,
    () => users,
  );
}

export function blankUser(): UserRecord {
  return {
    username: "",
    email: "",
    fullName: "",
    personNumber: "",
    verifiedEmail: false,
    lockedOut: false,
    roles: ["Viewer"],
    dnaPersonNumber: "0",
    nmlsId: "",
  };
}

export function consumeNotice() {
  const notice = pendingNotice;
  pendingNotice = "";
  return notice;
}

export function saveUser(originalUsername: string | null, next: UserRecord) {
  pendingNotice = "Changes saved.";
  if (!originalUsername) {
    users = [...users, next];
  } else {
    users = users.map((record) => (record.username === originalUsername ? next : record));
  }
  emit();
}

export function deleteUser(username: string) {
  users = users.filter((record) => record.username !== username);
  emit();
}
