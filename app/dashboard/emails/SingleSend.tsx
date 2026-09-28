"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button } from "@/components";
import styles from "./emails.module.css";

const INITIAL_HTML = `<p>Hi John Smith,</p><p>Thank you for applying for a 6-Month CD with SouthEast Bank. Unfortunately, we are unable to open your account at this time. We apologize for any inconvenience and appreciate your understanding.</p><p>If you believe you have received this message in error, please contact our Client Care Team at 1-844-732-2657.</p>`;

const PLACEHOLDERS = ["{{Customer name}}", "{{Product name}}", "{{Application number}}", "{{Client care phone}}"];
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type Mode = "edit" | "preview" | "sending" | "scheduled";

function Chevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M11.94 5 8 8.9 4.06 5 3 6.05 8 11l5-4.95L11.94 5Z" fill="currentColor" />
    </svg>
  );
}

function daysInMonth(year: number, month: number) {
  const first = new Date(year, month, 1).getDay();
  const count = new Date(year, month + 1, 0).getDate();
  const cells: Array<number | null> = Array.from({ length: first }, () => null);
  for (let day = 1; day <= count; day += 1) cells.push(day);
  while (cells.length % 7) cells.push(null);
  return cells;
}

export function SingleSend() {
  const router = useRouter();
  const editorRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef(INITIAL_HTML);
  const [mode, setMode] = useState<Mode>("edit");
  const [subject, setSubject] = useState("Your SouthEast Bank Application");
  const [preheader, setPreheader] = useState("");
  const [bodyHtml, setBodyHtml] = useState(INITIAL_HTML);
  const [sendOpen, setSendOpen] = useState(false);
  const [placeholdersOpen, setPlaceholdersOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [seconds, setSeconds] = useState(59);
  const [cursor, setCursor] = useState({ year: 2026, month: 8 });
  const [day, setDay] = useState(21);
  const [hour, setHour] = useState("8");
  const [minute, setMinute] = useState("30");
  const [meridiem, setMeridiem] = useState("AM");
  const [zone, setZone] = useState("");
  const [scheduledLabel, setScheduledLabel] = useState("");

  useEffect(() => {
    if (mode === "edit" && editorRef.current) editorRef.current.innerHTML = bodyRef.current;
  }, [mode]);

  useEffect(() => {
    if (mode !== "sending") return;
    const id = window.setInterval(() => setSeconds((value) => (value > 0 ? value - 1 : 0)), 1000);
    return () => window.clearInterval(id);
  }, [mode]);

  function syncBody() {
    if (!editorRef.current) return;
    bodyRef.current = editorRef.current.innerHTML;
    setBodyHtml(editorRef.current.innerHTML);
  }

  function format(command: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    syncBody();
  }

  function insertPlaceholder(token: string) {
    editorRef.current?.focus();
    document.execCommand("insertText", false, token);
    setPlaceholdersOpen(false);
    syncBody();
  }

  function applySchedule() {
    const label = `${MONTHS_SHORT[cursor.month]} ${day}, ${cursor.year} ${hour}:${minute}${meridiem}`;
    setScheduledLabel(zone ? `${label} ${zone}` : label);
    setScheduleOpen(false);
    setMode("scheduled");
  }

  const stamp = `${String(cursor.month + 1).padStart(2, "0")}/${String(day).padStart(2, "0")}/${cursor.year}`;

  return (
    <main className={styles.page}>
      {mode === "edit" || mode === "preview" ? (
        <>
          {mode === "edit" ? (
            <section className={styles.profile}>
              <div>
                <h2>John Smith</h2>
                <p>Email</p>
                <strong>jsmith@email.com</strong>
              </div>
              <span className={styles.rule} />
              <div>
                <h2>6-Month CD</h2>
                <div className={styles.facts}>
                  <div>
                    <p>Initial Deposit</p>
                    <strong>$10,000.00</strong>
                  </div>
                  <div>
                    <p>Application Number</p>
                    <strong>138701283</strong>
                  </div>
                  <div>
                    <p>Status</p>
                    <Badge tone="warning">Manual Review</Badge>
                  </div>
                  <div>
                    <p>Assigned to</p>
                    <button className={styles.assign} type="button">
                      Unassigned
                    </button>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          <div className={mode === "preview" ? styles.previewTitle : styles.editorTitleRow}>
            <h2 className={styles.editorTitle}>{mode === "preview" ? "General Rejection Template" : "General Rejection V2"}</h2>
            {mode === "preview" ? (
              <Button variant="outline" size="small">
                Preview
              </Button>
            ) : null}
            <div className={styles.actions}>
              {mode === "preview" ? (
                <Button size="small" onClick={() => setMode("edit")}>
                  Back to editing
                </Button>
              ) : (
                <>
                  <Button variant="outline" size="small" onClick={() => setMode("preview")}>
                    Preview
                  </Button>
                  <Button variant="outline" size="small" onClick={() => router.push("/dashboard/emails")}>
                    Cancel
                  </Button>
                  <div className={styles.menuWrap}>
                    <Button size="small" aria-expanded={sendOpen} onClick={() => setSendOpen((open) => !open)}>
                      Send
                      <Chevron />
                    </Button>
                    {sendOpen ? (
                      <div className={styles.menu} role="menu">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setSendOpen(false);
                            setSeconds(59);
                            setMode("sending");
                          }}
                        >
                          Send now
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setSendOpen(false);
                            setScheduleOpen(true);
                          }}
                        >
                          Schedule send
                        </button>
                      </div>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          </div>

          {mode === "edit" ? (
            <div className={[styles.editorStack, scheduleOpen ? styles.editorDim : ""].filter(Boolean).join(" ")}>
              <div className={styles.subjectRow}>
                <div className={styles.subjectLine}>
                  <div className={styles.subjectInline}>
                    <label htmlFor="subject">Subject</label>
                    <input id="subject" className={styles.subjectInput} value={subject} onChange={(event) => setSubject(event.target.value)} />
                  </div>
                  <p className={styles.hint}>Email subject enables recipients to immediately understand the email’s purpose.</p>
                </div>
                <div className={styles.preheaderLine}>
                  <div className={styles.subjectInline}>
                    <label htmlFor="preheader">Pre-header</label>
                    <input
                      id="preheader"
                      className={styles.preheaderInput}
                      value={preheader}
                      onChange={(event) => setPreheader(event.target.value)}
                    />
                  </div>
                  <p className={styles.hint}>Short preview message displayed before the email is opened.</p>
                </div>
              </div>
              <section className={styles.editor}>
                <div className={styles.editorToolbar} aria-label="Formatting">
                  <div className={styles.toolRow}>
                    <Tool label="Undo" onClick={() => format("undo")}>
                      ↺
                    </Tool>
                    <Tool label="Redo" onClick={() => format("redo")}>
                      ↻
                    </Tool>
                    <span className={styles.toolGap} />
                    <select className={styles.toolSelect} aria-label="Zoom" defaultValue="100%">
                      <option>100%</option>
                      <option>125%</option>
                      <option>150%</option>
                    </select>
                    <select className={styles.toolSelect} aria-label="Style" defaultValue="Paragraph text" onChange={() => format("formatBlock", "P")}>
                      <option>Paragraph text</option>
                      <option>Heading</option>
                    </select>
                    <select className={styles.toolSelect} aria-label="Font" defaultValue="Arial" onChange={(event) => format("fontName", event.target.value)}>
                      <option>Arial</option>
                      <option>Georgia</option>
                      <option>Verdana</option>
                    </select>
                    <Tool label="Decrease size" onClick={() => format("fontSize", "2")}>
                      −
                    </Tool>
                    <Tool label="Increase size" onClick={() => format("fontSize", "4")}>
                      +
                    </Tool>
                    <span className={styles.toolGap} />
                    <Tool label="Bold" onClick={() => format("bold")}>
                      B
                    </Tool>
                    <Tool label="Italic" onClick={() => format("italic")}>
                      I
                    </Tool>
                    <Tool label="Underline" onClick={() => format("underline")}>
                      U
                    </Tool>
                  </div>
                  <div className={styles.toolRow}>
                    <Tool label="Bulleted list" onClick={() => format("insertUnorderedList")}>
                      •≡
                    </Tool>
                    <Tool label="Numbered list" onClick={() => format("insertOrderedList")}>
                      1.
                    </Tool>
                    <span className={styles.toolGap} />
                    <Tool label="Align left" onClick={() => format("justifyLeft")}>
                      ≡
                    </Tool>
                    <Tool label="Align center" onClick={() => format("justifyCenter")}>
                      ≡
                    </Tool>
                    <Tool label="Align right" onClick={() => format("justifyRight")}>
                      ≡
                    </Tool>
                    <span className={styles.toolGap} />
                    <div className={styles.menuWrap}>
                      <button className={styles.toolSelect} type="button" aria-expanded={placeholdersOpen} onClick={() => setPlaceholdersOpen((open) => !open)}>
                        Placeholders
                        <Chevron />
                      </button>
                      {placeholdersOpen ? (
                        <div className={styles.menu} role="menu">
                          {PLACEHOLDERS.map((token) => (
                            <button key={token} type="button" role="menuitem" onClick={() => insertPlaceholder(token)}>
                              {token}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className={styles.canvas}>
                  <article className={styles.letter}>
                    <img className={styles.brand} src="/dashboard/logo.png" alt="SouthEast Bank" />
                    <div
                      ref={editorRef}
                      className={styles.body}
                      contentEditable
                      role="textbox"
                      aria-label="Email body"
                      onInput={syncBody}
                      suppressContentEditableWarning
                    />
                    <footer className={styles.letterFooter}>
                      <img src="/dashboard/logo.png" alt="" />
                      <span>
                        SouthEast Bank
                        <br />
                        <a href="https://www.southeastbank.com/contact-us">https://www.southeastbank.com/contact-us</a>
                        <br />
                        1-844-732-2657
                      </span>
                    </footer>
                    <p className={styles.unsubscribe}>Unsubscribe</p>
                  </article>
                </div>
              </section>
            </div>
          ) : (
            <section className={styles.editor}>
              <div className={styles.canvas}>
                <article className={styles.letter}>
                  <img className={styles.brand} src="/dashboard/logo.png" alt="SouthEast Bank" />
                  <div className={styles.body} dangerouslySetInnerHTML={{ __html: bodyHtml }} />
                  <footer className={styles.letterFooter}>
                    <img src="/dashboard/logo.png" alt="" />
                    <span>
                      SouthEast Bank
                      <br />
                      <a href="https://www.southeastbank.com/contact-us">https://www.southeastbank.com/contact-us</a>
                      <br />
                      1-844-732-2657
                    </span>
                  </footer>
                  <p className={styles.unsubscribe}>Unsubscribe</p>
                </article>
              </div>
            </section>
          )}
        </>
      ) : (
        <section className={styles.confirm}>
          {mode === "sending" ? <Plane /> : <CalendarArt />}
          <p>
            {mode === "sending"
              ? seconds === 0
                ? "Email sent"
                : `Email will be sent in ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
              : `Email has been scheduled for ${scheduledLabel}`}
          </p>
          <div className={styles.confirmActions}>
            <Button
              variant="outline"
              size="small"
              className={styles.danger}
              onClick={() => {
                setMode("edit");
                setScheduleOpen(false);
              }}
            >
              Cancel send
            </Button>
            <Button size="small" onClick={() => router.push("/dashboard/emails")}>
              Return to dashboard
            </Button>
          </div>
          {mode === "scheduled" ? (
            <p className={styles.confirmNote}>
              Need to change the scheduled date?{" "}
              <button type="button" onClick={() => { setMode("edit"); setScheduleOpen(true); }}>
                Change scheduled date
              </button>
            </p>
          ) : null}
        </section>
      )}

      {scheduleOpen && mode === "edit" ? (
        <section className={styles.scheduler} aria-label="Schedule send">
          <input className={styles.scheduleRange} readOnly value={`${stamp} – ${stamp}`} aria-label="Scheduled date" />
          <div className={styles.scheduleHead}>
            <button
              className={styles.calendarNav}
              type="button"
              aria-label="Previous month"
              onClick={() =>
                setCursor((current) =>
                  current.month === 0 ? { year: current.year - 1, month: 11 } : { year: current.year, month: current.month - 1 },
                )
              }
            >
              ‹
            </button>
            <span className={styles.monthLabel}>
              {MONTHS[cursor.month]} {cursor.year}
            </span>
            <button
              className={styles.calendarNav}
              type="button"
              aria-label="Next month"
              onClick={() =>
                setCursor((current) =>
                  current.month === 11 ? { year: current.year + 1, month: 0 } : { year: current.year, month: current.month + 1 },
                )
              }
            >
              ›
            </button>
          </div>
          <div className={styles.week}>
            {WEEKDAYS.map((label, index) => (
              <span key={`${label}-${index}`}>{label}</span>
            ))}
          </div>
          <div className={styles.days}>
            {daysInMonth(cursor.year, cursor.month).map((value, index) =>
              value ? (
                <button
                  key={value}
                  className={value === day ? `${styles.day} ${styles.daySelected}` : styles.day}
                  type="button"
                  onClick={() => setDay(value)}
                >
                  {value}
                </button>
              ) : (
                <span key={`empty-${index}`} />
              ),
            )}
          </div>
          <div className={styles.timeRow}>
            <select aria-label="Hour" value={hour} onChange={(event) => setHour(event.target.value)}>
              {Array.from({ length: 12 }, (_, index) => String(index + 1)).map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
            <select aria-label="Minute" value={minute} onChange={(event) => setMinute(event.target.value)}>
              {["00", "15", "30", "45"].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
            <select aria-label="AM or PM" value={meridiem} onChange={(event) => setMeridiem(event.target.value)}>
              <option>AM</option>
              <option>PM</option>
            </select>
            <select aria-label="Time zone" value={zone} onChange={(event) => setZone(event.target.value)}>
              <option value="">Select Time Zone</option>
              <option>Eastern</option>
              <option>Central</option>
              <option>Mountain</option>
              <option>Pacific</option>
            </select>
          </div>
          <p className={styles.scheduleSummary}>
            {stamp} {hour}:{minute} {meridiem}
            {zone ? ` ${zone}` : ""}
          </p>
          <div className={styles.scheduleFoot}>
            <Button variant="outline" size="small" onClick={() => setScheduleOpen(false)}>
              Cancel
            </Button>
            <Button size="small" onClick={applySchedule}>
              Apply
            </Button>
          </div>
        </section>
      ) : null}
    </main>
  );
}

function Tool({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button className={styles.tool} type="button" aria-label={label} title={label} onClick={onClick}>
      {children}
    </button>
  );
}

function Plane() {
  return (
    <svg width="120" height="80" viewBox="0 0 120 80" aria-hidden="true">
      <path d="M8 46c18-4 34-2 48 6L18 62l8-16Z" fill="none" stroke="var(--foreground-strong)" strokeWidth="3" />
      <path d="M14 58c16 2 28-6 42-14" fill="none" stroke="var(--foreground-strong)" strokeWidth="3" />
      <path d="M108 14 46 40l18 6 8 20 10-16 26-36Z" fill="var(--primary)" stroke="var(--foreground-strong)" strokeWidth="3" />
    </svg>
  );
}

function CalendarArt() {
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" aria-hidden="true">
      <rect x="14" y="20" width="68" height="58" rx="6" fill="var(--primary)" stroke="var(--foreground-strong)" strokeWidth="3" />
      <path d="M14 36h68" stroke="var(--foreground-strong)" strokeWidth="3" />
      <path d="M32 12v16M64 12v16" stroke="var(--foreground-strong)" strokeWidth="3" />
      <path d="M32 54h8M46 54h8M60 54h8M32 66h8M46 66h8" stroke="var(--surface)" strokeWidth="3" />
    </svg>
  );
}
