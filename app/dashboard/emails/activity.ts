export type EmailStatus = "Delivered" | "Opened" | "Bounced" | "Blocked" | "Unsubscribed";

export type EmailActivity = {
  id: string;
  template: string;
  subject: string;
  email: string;
  customer: string;
  status: EmailStatus;
  sent: string;
};

export const EMAIL_ACTIVITY: EmailActivity[] = [
  {
    id: "general-rejection",
    template: "Rejection/Decline - General Rejection",
    subject: "Your SouthEast Bank Application",
    email: "john.doe@email.com",
    customer: "John Doe",
    status: "Delivered",
    sent: "Jun 6, 2026 12:15pm",
  },
  {
    id: "welcome",
    template: "New Account Open - Welcome",
    subject: "Your account is now open",
    email: "jane.doe@email.com",
    customer: "Jane Doe",
    status: "Opened",
    sent: "Jun 6, 2026 12:15pm",
  },
  {
    id: "drop-off",
    template: "Follow up - Application Drop Off",
    subject: "We Miss You Already! Complete Your Application Today.",
    email: "jane.tarzan@email.com",
    customer: "Jane Tarzan",
    status: "Bounced",
    sent: "Jun 6, 2026 10:15am",
  },
  {
    id: "qualifile",
    template: "Rejection/Decline - Qualifile",
    subject: "Your SouthEast Bank Application",
    email: "jane.smith@email.com",
    customer: "Jane Smith",
    status: "Opened",
    sent: "Jun 6, 2026 8:15am",
  },
  {
    id: "joint",
    template: "Joint Owner - Application Invitation",
    subject: "You're invited to join John's account",
    email: "olivia.harper@example.com",
    customer: "Olivia Harper",
    status: "Blocked",
    sent: "Jun 6, 2026 6:10am",
  },
  {
    id: "drop-off-2",
    template: "Follow up - Application Drop Off 2",
    subject: "We Haven't Seen You in a While!",
    email: "noah.simmons@example.com",
    customer: "Noah Simmons",
    status: "Unsubscribed",
    sent: "Jun 5, 2026 8:22pm",
  },
  {
    id: "otp-priya",
    template: "Security/Verification - Self Serve OTP",
    subject: "Your Security Code",
    email: "priya.patel@example.com",
    customer: "Priya Patel",
    status: "Delivered",
    sent: "Jun 5, 2026 7:43pm",
  },
  {
    id: "otp-ava",
    template: "Security/Verification - Self Serve OTP",
    subject: "Your Security Code",
    email: "ava.rodrigo@example.com",
    customer: "Ava Rodrigo",
    status: "Opened",
    sent: "Jun 5, 2026 7:42pm",
  },
  {
    id: "reset",
    template: "Security/Verification - Password Reset",
    subject: "Your Password Reset Request",
    email: "liam.foster@example.com",
    customer: "Liam Foster",
    status: "Opened",
    sent: "Jun 5, 2026 7:41pm",
  },
  {
    id: "otp-daniel",
    template: "Security/Verification - Self Serve OTP",
    subject: "Your Security Code",
    email: "daniel.ross@example.com",
    customer: "Daniel Ross",
    status: "Delivered",
    sent: "Jun 5, 2026 7:40pm",
  },
];

export const SUPPRESSION = [
  { email: "jane.doe@example.com", source: "User Request", reason: "Unsubscribed", date: "Jun 8, 2026" },
  { email: "alex.smith@samplemail.com", source: "Auto", reason: "Hard Bounce", date: "Jun 5, 2026" },
  { email: "contact@demoemail.com", source: "ISP Report", reason: "Spam Complaint", date: "Jun 3, 2026" },
  { email: "info@placeholder.com", source: "User Request", reason: "Unsubscribed", date: "May 30, 2026" },
];

export const CONFIGURE = ["Automations", "Headers & Footers", "Placeholders", "Settings", "Templates"];
