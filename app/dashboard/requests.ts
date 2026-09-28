import type { PanelNote } from "@/components";

export type Status = "review" | "booked" | "canceled" | "rejected";

export type RequestRow = {
  id: string;
  type: string;
  created: string;
  customer: string;
  assignee: string;
  account: string;
  product: string;
  status: Status;
  statusLabel: string;
  updated: string;
  notes: PanelNote[];
};

export const REQUESTS: RequestRow[] = [
  {
    id: "john-smith",
    type: "Open New Account",
    created: "Jan 4, 2026",
    customer: "John Smith",
    assignee: "Kate Hendrickson",
    account: "N/A",
    product: "6-Month CD",
    status: "review",
    statusLabel: "Manual Review",
    updated: "Mar 9, 2026",
    notes: [
      {
        author: "Aniko Brewer",
        at: "Mar 9, 2026 9:15 AM",
        body: "Customer submitted an internal ID and address...",
      },
    ],
  },
  {
    id: "alvaro-rose",
    type: "Add a Joint Owner",
    created: "Jan 4, 2026",
    customer: "Alvaro Rose",
    assignee: "Caleb",
    account: "1721122334",
    product: "6-Month CD",
    status: "booked",
    statusLabel: "Successfully Booked",
    updated: "Mar 9, 2026",
    notes: [
      {
        author: "Aniko Brewer",
        at: "Mar 9, 2026 11:02 AM",
        body: "Customer was contacted to update their Driver’s Licen...",
      },
    ],
  },
  {
    id: "willis-grimes",
    type: "Open New Account",
    created: "Jan 4, 2026",
    customer: "Willis Grimes",
    assignee: "Aniko Brewer",
    account: "N/A",
    product: "Rewards Savings",
    status: "canceled",
    statusLabel: "Canceled - Expired Not Submitted",
    updated: "Mar 9, 2026",
    notes: [
      {
        author: "Aniko Brewer",
        at: "Mar 9, 2026 3:40 PM",
        body: "Customer did not come back to finish the applica...",
      },
    ],
  },
  {
    id: "ricardo-weathers",
    type: "Add a POD Beneficiary",
    created: "Jan 4, 2026",
    customer: "Ricardo Weathers",
    assignee: "Aniko Brewer",
    account: "1725551234",
    product: "12-Month CD",
    status: "canceled",
    statusLabel: "Canceled - Expired Not Submitted",
    updated: "Mar 9, 2026",
    notes: [
      {
        author: "Aniko Brewer",
        at: "Mar 10, 2026 9:01 AM",
        body: "Joint owner email was updated",
      },
      {
        author: "Aniko Brewer",
        at: "Mar 8, 2026 2:40 PM",
        body: "Customer called in wanting to update the joint owner email",
      },
    ],
  },
  {
    id: "mohammad-bloom",
    type: "Open New Account",
    created: "Jan 4, 2026",
    customer: "Mohammad Bloom",
    assignee: "Kate Hendrickson",
    account: "1724455667",
    product: "Rewards Savings",
    status: "booked",
    statusLabel: "Successfully Booked",
    updated: "Mar 9, 2026",
    notes: [],
  },
  {
    id: "armand-sparks",
    type: "Open New Account",
    created: "Jan 4, 2026",
    customer: "Armand Sparks",
    assignee: "Kate Hendrickson",
    account: "1729876543",
    product: "Rewards Savings",
    status: "booked",
    statusLabel: "Successfully Booked",
    updated: "Mar 9, 2026",
    notes: [],
  },
  {
    id: "kobe-kate",
    type: "Add a Joint Owner",
    created: "Jan 4, 2026",
    customer: "Kobe Harrell",
    assignee: "Kate Hendrickson",
    account: "1728964712",
    product: "6-Month CD",
    status: "booked",
    statusLabel: "Successfully Booked",
    updated: "Mar 9, 2026",
    notes: [],
  },
  {
    id: "kobe-caleb",
    type: "Add a Joint Owner",
    created: "Jan 4, 2026",
    customer: "Kobe Harrell",
    assignee: "Caleb",
    account: "1728964712",
    product: "6-Month CD",
    status: "rejected",
    statusLabel: "Rejected",
    updated: "Mar 9, 2026",
    notes: [],
  },
];

export function getRequest(id: string) {
  return REQUESTS.find((row) => row.id === id);
}
