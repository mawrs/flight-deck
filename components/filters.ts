export type CustomFilter = {
  id: string;
  label: string;
  selected: string[];
  createdFrom: string;
  createdTo: string;
  updatedFrom: string;
  updatedTo: string;
};

export type FilterState = {
  selected: string[];
  createdFrom: string;
  createdTo: string;
  updatedFrom: string;
  updatedTo: string;
  customs: CustomFilter[];
};

export const emptyFilters: FilterState = {
  selected: [],
  createdFrom: "",
  createdTo: "",
  updatedFrom: "",
  updatedTo: "",
  customs: [],
};

export type FilterTag = {
  id: string;
  label: string;
  details?: string[];
};

type Leaf = { id: string; label: string };

type ProductGroup = { id: string; label: string; children: Leaf[] };

const PRODUCT_GROUPS: ProductGroup[] = [
  {
    id: "all-checking",
    label: "All Checking",
    children: [
      { id: "rewards-checking", label: "Rewards Checking" },
      { id: "thrive-checking", label: "Thrive Checking" },
    ],
  },
  {
    id: "all-savings",
    label: "All Savings",
    children: [{ id: "minor-savings", label: "Minor Savings" }],
  },
  {
    id: "all-certificates",
    label: "All Certificates",
    children: [
      { id: "6-month", label: "6-Month CD Special" },
      { id: "12-month", label: "12-Month CD Special" },
    ],
  },
];

const ASSIGNEES = ["Kate Hendrickson", "Caleb", "Aniko Brewer"];
const REQUESTS = ["New Account", "Add Joint", "Add Beneficiary", "Overdraft Opt In"];
const STATUSES = ["Pending", "Approved", "Declined", "In Review", "Withdrawn", "Expired"];
const KYC = ["Pass", "Fail", "Review", "Pending", "Not Started"];
const TASKS = ["Information Required", "Attestations Required", "Documents Required", "Missing Initial Deposit"];
const KYC_TAGS = [
  "Any Account in Account History",
  "Core Person Flag: Decline",
  "Core Person Flag: No Auto Approval",
];
const BRANCHES = ["Online"];

const CUSTOM = [
  {
    id: "incomplete",
    label: "Incomplete Applications",
    chips: ["Pending", "In Review", "Information Required", "Attestations Required", "Documents Required", "Signatures Required"],
  },
  {
    id: "deposits",
    label: "Approved but missing deposits",
    chips: ["All Checking", "All Savings", "Approved", "Missing Initial Deposit"],
  },
] as const;

export const FILTER_SECTIONS = [
  { id: "custom", label: "Custom Filters" },
  { id: "assignee", label: "Assignees" },
  { id: "product", label: "Products" },
  { id: "request", label: "Request Type" },
  { id: "status", label: "Application Status" },
  { id: "kyc", label: "KYC Outcome" },
  { id: "task", label: "Checklist Tasks" },
  { id: "created", label: "Created Date" },
  { id: "updated", label: "Last Updated" },
  { id: "kycTag", label: "KYC Tag" },
  { id: "branch", label: "Branch" },
] as const;

export type FilterSectionId = (typeof FILTER_SECTIONS)[number]["id"];

const FLAT: Record<string, readonly string[]> = {
  assignee: ASSIGNEES,
  request: REQUESTS,
  status: STATUSES,
  kyc: KYC,
  task: TASKS,
  kycTag: KYC_TAGS,
  branch: BRANCHES,
};

const PRODUCT_LEAVES = PRODUCT_GROUPS.flatMap((group) => group.children);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function productGroups() {
  return PRODUCT_GROUPS;
}

export function customFilters() {
  return CUSTOM;
}

const BUILTIN_CUSTOM_IDS = ["custom:incomplete", "custom:deposits"];

export function hasGroupableFilters(state: FilterState) {
  return state.selected.length > 0 || Boolean(state.createdFrom || state.createdTo || state.updatedFrom || state.updatedTo);
}

function snapshotFilters(state: FilterState): Omit<CustomFilter, "id" | "label"> {
  const selected = new Set<string>();
  state.selected.forEach((id) => {
    if (!id.startsWith("custom:") || BUILTIN_CUSTOM_IDS.includes(id)) selected.add(id);
  });

  let createdFrom = state.createdFrom;
  let createdTo = state.createdTo;
  let updatedFrom = state.updatedFrom;
  let updatedTo = state.updatedTo;

  state.customs.forEach((custom) => {
    if (!state.selected.includes(optionId("custom", custom.id))) return;
    custom.selected.forEach((id) => selected.add(id));
    if (!createdFrom && !createdTo) {
      createdFrom = custom.createdFrom;
      createdTo = custom.createdTo;
    }
    if (!updatedFrom && !updatedTo) {
      updatedFrom = custom.updatedFrom;
      updatedTo = custom.updatedTo;
    }
  });

  return { selected: [...selected], createdFrom, createdTo, updatedFrom, updatedTo };
}

export function customChips(custom: Pick<CustomFilter, "selected" | "createdFrom" | "createdTo" | "updatedFrom" | "updatedTo">) {
  return filterTags({ ...custom, customs: [] }).map((tag) => tag.label);
}

export function groupedChips(state: FilterState) {
  return customChips(snapshotFilters(state));
}

export function saveCustomFilter(state: FilterState, label: string): FilterState {
  const name = label.trim();
  const snapshot = snapshotFilters(state);
  const id = `user-${Date.now().toString(36)}`;
  return {
    customs: [...state.customs, { id, label: name, ...snapshot }],
    selected: [optionId("custom", id)],
    createdFrom: "",
    createdTo: "",
    updatedFrom: "",
    updatedTo: "",
  };
}

export function flatOptions(section: string) {
  return FLAT[section] ?? [];
}

export function optionId(group: string, value: string) {
  return `${group}:${value}`;
}

function has(selected: string[], id: string) {
  return selected.includes(id);
}

export function toggleValue(state: FilterState, id: string): FilterState {
  const selected = has(state.selected, id) ? state.selected.filter((item) => item !== id) : [...state.selected, id];
  return { ...state, selected };
}

export function toggleMany(state: FilterState, ids: string[], on: boolean): FilterState {
  const next = new Set(state.selected);
  ids.forEach((id) => (on ? next.add(id) : next.delete(id)));
  return { ...state, selected: [...next] };
}

export function productLeafIds(groupId?: string) {
  const groups = groupId ? PRODUCT_GROUPS.filter((group) => group.id === groupId) : PRODUCT_GROUPS;
  return groups.flatMap((group) => group.children.map((leaf) => optionId("product", leaf.id)));
}

export function filterTags(state: FilterState): FilterTag[] {
  const tags: FilterTag[] = [];

  CUSTOM.forEach((custom) => {
    const id = optionId("custom", custom.id);
    if (has(state.selected, id)) tags.push({ id, label: custom.label, details: [...custom.chips] });
  });

  state.customs.forEach((custom) => {
    const id = optionId("custom", custom.id);
    if (has(state.selected, id)) tags.push({ id, label: custom.label, details: customChips(custom) });
  });

  ASSIGNEES.forEach((name) => {
    const id = optionId("assignee", name);
    if (has(state.selected, id)) tags.push({ id, label: name });
  });

  PRODUCT_GROUPS.forEach((group) => {
    const childIds = group.children.map((leaf) => optionId("product", leaf.id));
    const selectedChildren = childIds.filter((id) => has(state.selected, id));
    if (selectedChildren.length === childIds.length) {
      tags.push({ id: `product-group:${group.id}`, label: group.label });
      return;
    }
    group.children.forEach((leaf) => {
      const id = optionId("product", leaf.id);
      if (has(state.selected, id)) tags.push({ id, label: leaf.label });
    });
  });

  for (const group of ["request", "status", "kyc", "task", "kycTag", "branch"] as const) {
    FLAT[group].forEach((label) => {
      const id = optionId(group, label);
      if (has(state.selected, id)) tags.push({ id, label });
    });
  }

  if (state.createdFrom || state.createdTo) {
    tags.push({ id: "date:created", label: `Created Date: ${rangeLabel(state.createdFrom, state.createdTo)}` });
  }
  if (state.updatedFrom || state.updatedTo) {
    tags.push({ id: "date:updated", label: `Last Updated: ${rangeLabel(state.updatedFrom, state.updatedTo)}` });
  }

  return tags;
}

export function removeTag(state: FilterState, id: string): FilterState {
  if (id === "date:created") return { ...state, createdFrom: "", createdTo: "" };
  if (id === "date:updated") return { ...state, updatedFrom: "", updatedTo: "" };
  if (id.startsWith("product-group:")) return toggleMany(state, productLeafIds(id.slice("product-group:".length)), false);
  return toggleValue(state, id);
}

export function formatInputDate(iso: string) {
  if (!iso) return "";
  const [year, month, day] = iso.split("-").map(Number);
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}

function rangeLabel(from: string, to: string) {
  if (from && to) return `${formatInputDate(from)} – ${formatInputDate(to)}`;
  if (from) return `From ${formatInputDate(from)}`;
  return `Through ${formatInputDate(to)}`;
}

function displayToIso(value: string) {
  const [month, day, year] = value.replace(",", "").split(" ");
  const index = MONTHS.indexOf(month);
  if (index < 0 || !day || !year) return "";
  return `${year}-${String(index + 1).padStart(2, "0")}-${day.padStart(2, "0")}`;
}

const REQUEST_KEY: Record<string, string> = {
  "Open New Account": "New Account",
  "Add a Joint Owner": "Add Joint",
  "Add a POD Beneficiary": "Add Beneficiary",
};

const STATUS_KEY: Record<string, string> = {
  review: "In Review",
  booked: "Approved",
  canceled: "Expired",
  rejected: "Declined",
};

const PRODUCT_KEY: Record<string, string> = {
  "6-Month CD": "6-month",
  "12-Month CD": "12-month",
  "Rewards Savings": "minor-savings",
};

export type FilterableRequest = {
  type: string;
  assignee: string;
  product: string;
  status: string;
  created: string;
  updated: string;
  kyc: string;
  tasks: string[];
  kycTags: string[];
  branch: string;
};

function selectedValues(selected: string[], group: string) {
  const prefix = `${group}:`;
  return selected.filter((id) => id.startsWith(prefix)).map((id) => id.slice(prefix.length));
}

function inRange(display: string, from: string, to: string) {
  if (!from && !to) return true;
  const iso = displayToIso(display);
  if (!iso) return false;
  if (from && iso < from) return false;
  if (to && iso > to) return false;
  return true;
}

function matchesIncomplete(row: FilterableRequest) {
  const status = STATUS_KEY[row.status];
  const tasks = ["Information Required", "Attestations Required", "Documents Required", "Signatures Required"];
  return status === "Pending" || status === "In Review" || row.tasks.some((task) => tasks.includes(task));
}

function matchesDeposits(row: FilterableRequest) {
  const product = PRODUCT_KEY[row.product];
  const depositProducts = ["rewards-checking", "thrive-checking", "minor-savings"];
  return STATUS_KEY[row.status] === "Approved" && depositProducts.includes(product) && row.tasks.includes("Missing Initial Deposit");
}

export function requestMatches(row: FilterableRequest, state: FilterState) {
  const checks: [string, string[]][] = [
    ["assignee", [row.assignee]],
    ["product", [PRODUCT_KEY[row.product]].filter(Boolean)],
    ["request", [REQUEST_KEY[row.type]].filter(Boolean)],
    ["status", [STATUS_KEY[row.status]].filter(Boolean)],
    ["kyc", [row.kyc]],
    ["task", row.tasks],
    ["kycTag", row.kycTags],
    ["branch", [row.branch]],
  ];

  for (const [group, values] of checks) {
    const picked = selectedValues(state.selected, group);
    if (picked.length && !picked.some((value) => values.includes(value))) return false;
  }

  if (has(state.selected, optionId("custom", "incomplete")) && !matchesIncomplete(row)) return false;
  if (has(state.selected, optionId("custom", "deposits")) && !matchesDeposits(row)) return false;

  for (const custom of state.customs) {
    if (!has(state.selected, optionId("custom", custom.id))) continue;
    if (!requestMatches(row, { ...custom, customs: [] })) return false;
  }

  if (!inRange(row.created, state.createdFrom, state.createdTo)) return false;
  if (!inRange(row.updated, state.updatedFrom, state.updatedTo)) return false;
  return true;
}

export function sectionMatches(section: FilterSectionId, query: string, customs: readonly CustomFilter[] = []) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const title = FILTER_SECTIONS.find((item) => item.id === section)?.label.toLowerCase() ?? "";
  if (title.includes(needle)) return true;
  if (section === "custom") {
    const saved = customs.map((item) => ({ label: item.label, chips: customChips(item) }));
    return [...CUSTOM, ...saved].some(
      (item) => item.label.toLowerCase().includes(needle) || item.chips.some((chip) => chip.toLowerCase().includes(needle)),
    );
  }
  if (section === "product") {
    return PRODUCT_GROUPS.some(
      (group) => group.label.toLowerCase().includes(needle) || group.children.some((leaf) => leaf.label.toLowerCase().includes(needle)),
    );
  }
  if (section === "created" || section === "updated") return false;
  return (FLAT[section] ?? []).some((label) => label.toLowerCase().includes(needle));
}

export function visibleLeaves(group: ProductGroup, query: string) {
  const needle = query.trim().toLowerCase();
  const titleMatch = !needle || "products".startsWith(needle);
  if (titleMatch || group.label.toLowerCase().includes(needle)) return group.children;
  return group.children.filter((leaf) => leaf.label.toLowerCase().includes(needle));
}

export { PRODUCT_LEAVES };
