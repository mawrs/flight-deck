"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge, Button } from "@/components";
import { EMAIL_ACTIVITY } from "./activity";
import styles from "./emails.module.css";

const INITIAL_HTML = `<p>Hi John Smith,</p><p>Thank you for applying for a 6-Month CD with SouthEast Bank. Unfortunately, we are unable to open your account at this time. We apologize for any inconvenience and appreciate your understanding.</p><p>If you believe you have received this message in error, please contact our Client Care Team at 1-844-732-2657.</p>`;

const PLACEHOLDERS = ["{{Customer name}}", "{{Product name}}", "{{Application number}}", "{{Client care phone}}"];
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const today = new Date();
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

export function SingleSend({
  embedded = false,
  templateTitle,
  onCancel,
  readOnly = false,
  body,
  sentLabel,
  applicantName,
  applicantEmail,
  productName,
}: {
  embedded?: boolean;
  templateTitle?: string;
  onCancel?: () => void;
  readOnly?: boolean;
  body?: string;
  sentLabel?: string;
  applicantName?: string;
  applicantEmail?: string;
  productName?: string;
} = {}) {
  const router = useRouter();
  const queryTemplate = useSearchParams().get("template");
  const templateName = templateTitle ?? queryTemplate;
  const matched = EMAIL_ACTIVITY.find((row) => row.template === templateName);
  const startingBody = body ?? (readOnly && applicantName ? INITIAL_HTML.replace("John Smith", applicantName) : INITIAL_HTML);
  const editorRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef(startingBody);
  const [mode, setMode] = useState<Mode>("edit");
  const [subject, setSubject] = useState(matched?.subject ?? "Your SouthEast Bank Application");
  const [preheader, setPreheader] = useState("");
  const [bodyHtml, setBodyHtml] = useState(startingBody);
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

  function leave() {
    if (onCancel) onCancel();
    else if (queryTemplate) router.back();
    else router.push("/dashboard/emails");
  }

  return (
    <main className={[embedded ? styles.embedded : styles.page, mode === "sending" || mode === "scheduled" ? styles.sendingPage : ""].filter(Boolean).join(" ")}>
      {mode === "edit" || mode === "preview" ? (
        <>
          {!embedded && mode === "edit" ? (
            <section className={styles.profile}>
              <div>
                <h2>{applicantName ?? "John Smith"}</h2>
                <p>Email</p>
                <strong>{applicantEmail ?? "jsmith@email.com"}</strong>
              </div>
              <span className={styles.rule} />
              <div>
                <h2>{productName ?? "6-Month CD"}</h2>
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

          <div className={styles.composer}>
          <div className={readOnly || mode === "preview" ? styles.previewTitle : styles.editorTitleRow}>
            <div className={styles.previewHeading}>
              <h2 className={styles.editorTitle}>{templateName ?? (mode === "preview" ? "General Rejection Template" : "General Rejection V2")}</h2>
              {readOnly && sentLabel ? <p className={styles.sentWhen}>Sent {sentLabel}</p> : null}
            </div>
            {mode === "preview" && !readOnly ? (
              <Button variant="outline" size="small">
                Preview
              </Button>
            ) : null}
            <div className={styles.actions}>
              {readOnly ? (
                <Button variant="outline" size="small" onClick={leave}>
                  Back
                </Button>
              ) : mode === "preview" ? (
                <Button size="small" onClick={() => setMode("edit")}>
                  Back to editing
                </Button>
              ) : (
                <>
                  <Button variant="outline" size="small" onClick={() => setMode("preview")}>
                    Preview
                  </Button>
                  <Button variant="outline" size="small" className={embedded ? styles.danger : undefined} onClick={leave}>
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
                    {scheduleOpen ? (
                      <section className={styles.scheduler} aria-label="Schedule send">
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
                          {WEEKDAYS.map((label) => (
                            <span key={label}>{label}</span>
                          ))}
                        </div>
                        <div className={styles.days}>
                          {daysInMonth(cursor.year, cursor.month).map((value, index) =>
                            value ? (
                              <button
                                key={value}
                                className={[
                                  styles.day,
                                  value === day ? styles.daySelected : "",
                                  value === today.getDate() && cursor.month === today.getMonth() && cursor.year === today.getFullYear() && value !== day
                                    ? styles.dayToday
                                    : "",
                                ]
                                  .filter(Boolean)
                                  .join(" ")}
                                type="button"
                                aria-pressed={value === day}
                                onClick={() => setDay(value)}
                              >
                                {value}
                              </button>
                            ) : (
                              <span key={`empty-${index}`} />
                            ),
                          )}
                        </div>
                        <div className={styles.timeBlock}>
                          <span>Time</span>
                          <div className={styles.timeControls}>
                            <div className={styles.clock}>
                              <select aria-label="Hour" value={hour} onChange={(event) => setHour(event.target.value)}>
                                {Array.from({ length: 12 }, (_, index) => String(index + 1)).map((value) => (
                                  <option key={value}>{value}</option>
                                ))}
                              </select>
                              <span className={styles.timeColon} aria-hidden="true">:</span>
                              <select aria-label="Minute" value={minute} onChange={(event) => setMinute(event.target.value)}>
                                {["00", "15", "30", "45"].map((value) => (
                                  <option key={value}>{value}</option>
                                ))}
                              </select>
                            </div>
                            <div className={styles.meridiem} role="group" aria-label="AM or PM">
                              {["AM", "PM"].map((value) => (
                                <button key={value} type="button" aria-pressed={meridiem === value} onClick={() => setMeridiem(value)}>
                                  {value}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                        <label className={styles.zoneField}>
                          Time zone
                          <select aria-label="Time zone" value={zone} onChange={(event) => setZone(event.target.value)}>
                            <option value="">Select time zone</option>
                            <option>Eastern</option>
                            <option>Central</option>
                            <option>Mountain</option>
                            <option>Pacific</option>
                          </select>
                        </label>
                        <p className={styles.scheduleSummary}>
                          <span>{new Date(cursor.year, cursor.month, day).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</span>
                          <span>
                            {hour}:{minute} {meridiem}
                            {zone ? ` · ${zone}` : ""}
                          </span>
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
                  </div>
                </>
              )}
            </div>
          </div>

          {mode === "edit" && !readOnly ? (
            <div className={[embedded ? styles.embeddedBody : "", styles.editorStack, scheduleOpen ? styles.editorDim : ""].filter(Boolean).join(" ")}>
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
          </div>
        </>
      ) : (
        <>
        <div className={styles.confirmHead}>
          <h2 className={styles.editorTitle}>{templateName ?? "General Rejection V2"}</h2>
        </div>
        <section className={styles.confirm}>
          {mode === "sending" ? <Plane /> : <CalendarArt />}
          <p className={styles.confirmMessage}>
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
            <Button size="small" onClick={leave}>
              {embedded ? "Return to application" : "Return to dashboard"}
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
        </>
      )}

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
    <svg width="202" height="124" viewBox="0 0 201.73 124" aria-hidden="true">
      <g transform="translate(33.27 0)">
        <path d="M36.2998 85.6504C43.5807 88.2091 140.418 25.9001 140.418 25.9001L47.2213 58.2332L36.2998 85.6504Z" fill="#231F20" />
        <path d="M36.8016 88.3765C36.2227 88.3765 35.7984 88.2778 35.4291 88.1482C34.7507 87.9096 34.1985 87.4027 33.9007 86.7457C33.603 86.0888 33.586 85.338 33.8529 84.6678L44.7744 57.2511C45.0586 56.5378 45.6372 55.9836 46.3604 55.7326L139.557 23.3995C140.818 22.9613 142.207 23.5405 142.789 24.7463C143.371 25.9522 142.963 27.4049 141.839 28.128C141.596 28.2841 117.313 43.8986 92.4523 58.999C77.8314 67.8796 65.8672 74.852 56.8919 79.7215C43.7505 86.8523 39.0788 88.3761 36.8013 88.3761L36.8016 88.3765ZM49.2203 60.3398L40.6241 81.9197C46.2275 79.6025 59.5447 72.8418 91.126 53.6195C101.422 47.3532 111.545 41.0473 119.811 35.8492L49.2206 60.3398H49.2203Z" fill="#231F20" />
        <path d="M36.2999 85.6508C33.0233 80.8984 37.756 60.4272 36.2999 56.406C34.8438 52.3847 12.9375 35.7352 15.8501 33.1764C18.7627 30.6173 159.713 -0.987032 165.537 3.03425C171.362 7.05552 96.5785 97.5653 90.7044 99.1866C87.9458 99.9479 49.7699 56.7715 47.2217 58.234C44.6736 59.6962 36.3002 85.6511 36.3002 85.6511L36.2999 85.6508Z" fill="#09A6E0" />
        <path d="M83.9103 93.8404C81.5289 93.8404 77.9357 90.5638 64.2086 76.8711C58.6413 71.3182 51.3013 63.9965 48.077 61.5341C46.0502 65.4397 41.9624 76.6848 38.8066 86.4662C38.4979 87.4233 37.675 88.1223 36.6835 88.2689C35.6915 88.4148 34.7033 87.9843 34.133 87.1572C31.8292 83.8156 32.3133 77.118 33.3146 67.2814C33.6817 63.6755 34.1805 58.7769 33.8548 57.4232C32.6178 55.7339 24.7836 50.3953 19.036 46.4791C4.22163 36.3835 0.184602 33.2343 0.00616535 30.3131C-0.0544427 29.3193 0.334051 28.3777 1.07227 27.729C1.79128 27.0973 2.68572 26.3111 28.1373 21.3089C43.6568 18.2587 63.5193 14.6113 82.6323 11.3022C97.8701 8.66402 119.794 4.99996 137.704 2.52626C164.159 -1.12797 165.818 0.017404 167.03 0.853942C168.067 1.57065 168.58 2.77159 168.434 4.14944C168.229 6.10262 167.682 11.2916 127.405 52.565C118.404 61.7885 108.276 71.9011 99.6165 80.3095C86.5906 92.9585 85.6521 93.3479 85.0912 93.58C84.7027 93.7414 84.3248 93.8404 83.9099 93.8404H83.9103ZM47.4024 55.5147C49.2113 55.5147 51.4526 57.2539 55.6455 61.1281C59.1423 64.359 63.6059 68.8112 67.9226 73.1167C73.4537 78.6342 80.8088 85.9706 83.6961 88.0848C88.1743 84.1728 105.765 67.2001 124.18 48.3075C152.467 19.2884 160.269 8.87609 162.408 5.25852C155.351 5.28196 131.725 8.16996 83.378 16.5433C47.6603 22.729 16.3523 28.8551 6.85977 31.2093C10.1179 34.0051 17.0506 38.7299 21.9956 42.0994C33.4878 49.9311 37.9118 53.1154 38.7761 55.5018C39.5467 57.63 39.2132 61.378 38.5578 67.8193C38.4283 69.0905 38.2781 70.5648 38.1426 72.101C38.2043 71.9302 38.2657 71.7593 38.3278 71.5877C43.4813 57.3321 44.8874 56.5255 45.914 55.9365C46.3984 55.6587 46.8829 55.515 47.4028 55.515L47.4024 55.5147Z" fill="#231F20" />
        <path d="M56.6119 51.4139C55.6482 51.4139 54.7199 50.8813 54.2565 49.9578C53.6015 48.6529 54.124 47.0615 55.4239 46.4041C81.8125 33.0501 120.596 16.7654 164.63 0.549883C165.996 0.0478848 167.51 0.750985 168.011 2.12316C168.512 3.49534 167.811 5.01532 166.444 5.51846C122.595 21.6663 84.009 37.8645 57.7955 51.1296C57.4153 51.322 57.0102 51.4135 56.6116 51.4135L56.6119 51.4139Z" fill="#231F20" />
      </g>
      <g transform="translate(0 52.93)">
        <path d="M2.64933 26.9938C1.88265 26.9938 1.12203 26.6638 0.598562 26.0268C-0.327345 24.8996 -0.160546 23.2384 0.971119 22.3158C5.32417 18.7683 32.5148 3.38921 37.9212 0.342016C39.1939 -0.374106 40.809 0.0707864 41.5295 1.33879C42.2496 2.60603 41.8018 4.21533 40.5291 4.93221C29.467 11.1664 7.66466 23.6753 4.32451 26.3978C3.83243 26.7983 3.23899 26.9938 2.64933 26.9938Z" fill="#231F20" />
        <path d="M38.1293 35.0848C37.1421 35.0848 36.1947 34.5322 35.7397 33.5859C35.108 32.2727 35.6651 30.6977 36.9837 30.0686C41.1215 28.095 50.5894 22.739 53.7253 19.3034C54.709 18.2256 56.3835 18.1469 57.4652 19.1259C58.5473 20.1058 58.6267 21.7731 57.6433 22.8512C53.3349 27.5714 42.0557 33.497 39.2708 34.8253C38.902 35.0012 38.5125 35.0844 38.1289 35.0844L38.1293 35.0848Z" fill="#231F20" />
        <path d="M54.2232 71.074C53.2251 71.074 52.2693 70.5089 51.8207 69.5483C51.2042 68.2276 51.7791 66.6594 53.1048 66.0453C60.9883 62.3935 68.8498 56.9346 76.4526 51.6558C84.0055 46.4113 91.1396 41.4576 98.4414 38.0031C99.7621 37.3793 101.342 37.9383 101.969 39.2534C102.596 40.5689 102.034 42.142 100.713 42.767C93.808 46.0338 86.8486 50.8659 79.4807 55.9819C71.6922 61.3896 63.6385 66.9818 55.3379 70.8269C54.9767 70.9941 54.5969 71.0736 54.2229 71.0736L54.2232 71.074Z" fill="#231F20" />
      </g>
    </svg>
  );
}

function CalendarArt() {
  return (
    <svg width="200" height="160" viewBox="0 0 199.998 159.542" aria-hidden="true">
      <path d="M198.173 28.4649C195.527 41.7096 185.657 138.481 184.588 146.316C183.52 154.148 177.143 157.631 171.346 157.919C165.55 158.21 50.2777 152.173 44.7713 151.857C35.2048 151.311 32.7844 146.669 34.6775 135.307C35.7368 128.952 60.208 32.1045 61.0002 27.7458C62.4971 19.5122 150.7 10.7209 184.828 15.0036C194.274 16.1884 199.541 21.6259 198.173 28.4649Z" fill="#1F1F1F" />
      <path d="M170.831 159.542C160.173 159.542 49.6722 153.754 44.6771 153.47C39.8524 153.194 36.6904 151.924 34.7329 149.469C32.4162 146.567 31.9072 142.118 33.0863 135.044C33.7035 131.345 41.8882 98.4266 49.1103 69.3833C54.239 48.7557 59.0844 29.2737 59.4137 27.4596C59.7753 25.4727 62.0091 23.0432 75.8453 20.1043C84.7139 18.2188 96.7031 16.4832 110.514 15.0794C140.01 12.0829 169.258 11.4259 185.026 13.406C190.839 14.1343 195.417 16.4486 197.918 19.9222C199.765 22.4877 200.398 25.5511 199.753 28.7827C197.918 37.9659 192.621 87.2772 189.114 119.909C187.601 133.984 186.509 144.151 186.184 146.535C184.941 155.646 177.456 159.231 171.425 159.533C171.287 159.54 171.086 159.542 170.828 159.542H170.831ZM62.578 28.0774C62.1772 30.198 57.569 48.7281 52.2377 70.1624C45.3864 97.712 36.8609 132.001 36.2644 135.574C35.2626 141.583 35.5758 145.359 37.2501 147.454C38.5973 149.142 41.0154 150.029 44.8613 150.248C49.967 150.541 165.497 156.598 171.264 156.308C176.063 156.068 182.014 153.249 182.99 146.097C183.31 143.759 184.457 133.083 185.908 119.564C189.42 86.8761 194.728 37.475 196.591 28.1489C197.064 25.7862 196.631 23.6518 195.302 21.8054C193.33 19.0694 189.54 17.2208 184.625 16.6053C169.336 14.6875 140.795 15.3053 111.916 18.1796C98.382 19.5281 86.5218 21.2038 77.6185 23.0294C64.1946 25.7816 62.6977 27.863 62.5756 28.0774H62.578Z" fill="#1F1F1F" />
      <path d="M194.037 26.9341C192.904 40.3931 180.871 135.016 179.803 142.851C178.734 150.684 172.357 154.166 166.561 154.455C160.764 154.745 46.2707 147.782 40.7643 147.491C35.258 147.201 33.8071 141.689 34.6776 135.307C35.5481 128.924 56.383 25.5418 57.1752 21.1854C59.0268 11.0087 195.15 13.7194 194.04 26.9341H194.037Z" fill="white" />
      <path d="M166.1 156.077C159.033 156.077 106.065 152.986 54.7341 149.932C46.9156 149.467 41.7501 149.16 40.6792 149.105C38.3831 148.985 36.4602 148.063 35.1176 146.44C32.5751 143.365 32.605 138.571 33.0794 135.093C33.6897 130.609 43.7467 80.2746 50.4023 46.9694C53.1658 33.1393 55.349 22.2181 55.5885 20.9019C55.9293 19.0257 57.85 16.8981 69.5007 15.3261C76.7918 14.3419 86.9616 13.7057 98.9094 13.4821C123.044 13.0349 150.657 14.3419 169.255 16.8128C177.233 17.8731 183.469 19.1179 187.79 20.5124C191.304 21.6465 195.94 23.5619 195.645 27.0725C194.514 40.5153 182.389 135.837 181.401 143.073C180.158 152.184 172.673 155.769 166.642 156.071C166.51 156.077 166.328 156.08 166.1 156.08V156.077ZM58.7482 21.5381C58.4557 23.1148 56.3968 33.4182 53.5642 47.5987C47.3209 78.8455 36.8701 131.142 36.2736 135.526C35.7278 139.539 36.1976 142.685 37.6001 144.382C38.3739 145.318 39.4356 145.809 40.8473 145.882C41.9274 145.94 47.0975 146.247 54.923 146.712C84.182 148.452 161.9 153.074 166.478 152.846C171.277 152.606 177.228 149.787 178.205 142.635C179.19 135.406 191.302 40.2088 192.43 26.8005C192.462 26.4086 191.463 25.0487 186.509 23.4905C172.523 19.0925 139.865 16.882 113.701 16.6423C99.1995 16.5086 85.7825 16.9396 75.9213 17.8501C60.9014 19.2377 58.937 21.2823 58.7459 21.5381H58.7482Z" fill="#1F1F1F" />
      <path d="M192.58 34.9927C188.503 56.7451 181.493 112.981 172.477 119.543C161.948 127.207 24.5953 116.553 17.5759 115.595C29.0838 113.854 44.8452 83.5986 54.3932 35.7718L192.58 34.9927Z" fill="#4FC7FF" />
      <path d="M55.4688 30.6661C56.0836 27.5889 56.6525 24.4287 57.1729 21.1879C58.3774 13.6943 66.1061 10.6493 75.995 10.9697C85.8839 11.2901 173.617 14.1622 179.681 14.4826C185.742 14.803 195.951 15.7595 194.037 26.9366C193.763 28.5409 193.264 31.3461 192.58 34.9949L55.4688 30.6684V30.6661Z" fill="white" />
      <path d="M118.752 120.469C110.654 120.469 101.673 120.373 91.8576 120.177C56.9264 119.485 21.104 117.706 17.3594 117.194C16.5464 117.083 15.9453 116.378 15.9661 115.557C15.9868 114.737 16.6201 114.061 17.4377 113.99C23.0108 113.501 30.4931 103.583 37.4503 87.4524C45.1053 69.7037 51.5467 46.0796 55.5838 20.9341C56.8251 13.1985 64.2866 8.98031 76.0501 9.35833C84.1427 9.6188 173.608 12.5485 179.768 12.8712C183.179 13.051 190.279 13.4244 193.789 17.8201C195.672 20.1804 196.292 23.3383 195.629 27.2084C194.293 35.0132 190.608 54.5621 186.235 72.6979C183.529 83.9211 180.915 93.1619 178.467 100.169C175.351 109.087 172.512 114.386 169.783 116.373C168.051 117.634 163.263 119.398 141.802 120.131C135.192 120.356 127.487 120.469 118.752 120.469ZM23.8928 114.442C35.8659 115.154 63.1996 116.383 91.9221 116.952C154.818 118.199 165.999 115.136 167.887 113.762C175.915 107.919 187.214 57.2359 192.451 26.6621C192.957 23.6979 192.573 21.4643 191.269 19.8346C188.662 16.5707 182.541 16.248 179.598 16.0936C173.463 15.7709 84.0345 12.8435 75.9465 12.5831C71.108 12.4263 66.9949 13.1224 64.0494 14.593C61.0326 16.1005 59.2547 18.4055 58.7665 21.4435C54.6879 46.8471 48.1683 70.7433 40.4096 88.7293C36.9644 96.7162 30.8593 108.979 23.8928 114.442Z" fill="#1F1F1F" />
      <path d="M192.582 36.6061C192.564 36.6061 192.547 36.6061 192.529 36.6061C191.318 36.5669 71.237 32.6438 55.4318 32.2796C54.5429 32.2589 53.8359 31.5213 53.8566 30.6292C53.8773 29.7395 54.6143 29.0295 55.5055 29.0526C71.3268 29.4168 191.421 33.3399 192.633 33.3791C193.522 33.4091 194.219 34.1536 194.192 35.0433C194.164 35.9169 193.448 36.6038 192.582 36.6038V36.6061Z" fill="#1F1F1F" />
      <path d="M55.4687 117.208C55.015 117.208 54.5636 117.016 54.2435 116.645C53.6632 115.97 53.7415 114.951 54.4162 114.37C68.204 102.529 79.3964 60.7394 83.6085 45.0077C83.9516 43.7238 84.2533 42.6035 84.5066 41.6769C84.7415 40.8171 85.6282 40.3124 86.4872 40.5475C87.3462 40.7826 87.8505 41.67 87.6156 42.5298C87.3623 43.4518 87.0652 44.5651 86.7221 45.8444C84.608 53.7437 80.6699 68.4451 75.5297 82.5265C69.1897 99.8925 62.7921 111.431 56.5165 116.821C56.2125 117.081 55.8395 117.21 55.4687 117.21V117.208Z" fill="#1F1F1F" />
      <path d="M97.4284 119.335C97.1244 119.335 96.8181 119.25 96.5463 119.073C95.8025 118.584 95.5929 117.584 96.0811 116.839C102.11 107.621 115.334 52.1602 116.469 43.0646C116.58 42.1795 117.386 41.5525 118.268 41.6632C119.152 41.7738 119.779 42.5806 119.668 43.4634C118.493 52.8748 105.182 108.811 98.7779 118.605C98.4693 119.077 97.9534 119.335 97.4284 119.335Z" fill="#1F1F1F" />
      <path d="M135.22 119.695C134.895 119.695 134.568 119.598 134.285 119.396C133.56 118.877 133.394 117.87 133.91 117.146C139.197 109.735 146 85.7654 154.127 45.9024C154.275 45.1786 154.406 44.5378 154.519 43.9869C154.698 43.1133 155.551 42.5509 156.423 42.7307C157.296 42.9105 157.858 43.7633 157.678 44.6369C157.566 45.1855 157.434 45.8263 157.287 46.5478C154.224 61.5742 144.902 107.299 136.535 119.022C136.22 119.462 135.724 119.698 135.222 119.698L135.22 119.695Z" fill="#1F1F1F" />
      <path d="M150.159 63.8698C113.897 63.8698 62.9256 63.116 48.6749 60.6612C47.7975 60.5091 47.2079 59.6747 47.3599 58.7964C47.5119 57.9182 48.3433 57.3281 49.223 57.4803C69.3738 60.9539 173.506 61.0346 186.999 60.1956C187.888 60.138 188.653 60.8156 188.708 61.7054C188.764 62.5951 188.089 63.3604 187.2 63.4157C182.992 63.6762 168.445 63.8698 150.159 63.8698Z" fill="#1F1F1F" />
      <path d="M159.995 92.9127C124.122 92.9127 57.5873 89.9577 39.9282 88.1321C39.0416 88.0399 38.3991 87.247 38.4912 86.3619C38.5833 85.4767 39.3755 84.8313 40.2599 84.9235C61.7349 87.1433 161.054 91.1863 179.623 89.0818C180.507 88.9804 181.307 89.6188 181.406 90.504C181.505 91.3891 180.869 92.1889 179.985 92.2881C176.109 92.7283 169.018 92.915 159.995 92.915V92.9127Z" fill="#1F1F1F" />
      <path d="M98.8103 83.9928C98.3543 83.9928 97.9029 83.8014 97.5851 83.428L86.6852 70.6605C86.1072 69.9828 86.1855 68.964 86.8626 68.3855C87.5396 67.8069 88.5575 67.8853 89.1356 68.563L100.035 81.3305C100.613 82.0081 100.535 83.0269 99.8581 83.6055C99.5541 83.866 99.1811 83.9928 98.8126 83.9928H98.8103Z" fill="#1F1F1F" />
      <path d="M84.2925 82.1072C83.719 82.1072 83.164 81.8006 82.8715 81.2589C82.4478 80.4752 82.7403 79.4956 83.5256 79.0738L101.523 69.3535C102.306 68.9317 103.285 69.2221 103.706 70.0081C104.13 70.7918 103.838 71.7715 103.052 72.1933L85.0547 81.9136C84.8106 82.0449 84.5481 82.1072 84.2902 82.1072H84.2925Z" fill="#1F1F1F" />
      <path d="M141.484 58.2273C141.15 58.2273 140.814 58.1236 140.523 57.9092L126.144 47.2301C125.43 46.6999 125.28 45.688 125.81 44.9734C126.34 44.2589 127.351 44.1091 128.065 44.6392L142.444 55.3184C143.158 55.8485 143.308 56.8604 142.778 57.575C142.463 58.0014 141.974 58.2273 141.482 58.2273H141.484Z" fill="#1F1F1F" />
      <path d="M127.106 57.2984C126.563 57.2984 126.031 57.0218 125.727 56.5239C125.264 55.7632 125.506 54.7698 126.266 54.3065L142.269 44.5563C143.029 44.0929 144.022 44.335 144.485 45.0956C144.947 45.8563 144.706 46.8497 143.946 47.3131L127.942 57.0633C127.68 57.2223 127.392 57.2984 127.106 57.2984Z" fill="#1F1F1F" />
      <path d="M84.2924 22.0221C84.168 22.0221 84.0414 22.0083 83.9124 21.976C80.4234 21.1347 78.7538 17.3222 79.447 11.7763C80.0458 7.01648 82.7264 0 86.5931 0H86.6345C90.4574 0.0484054 91.5075 6.17975 91.9635 10.7875C92.051 11.6749 91.4039 12.4655 90.5196 12.5531C89.6353 12.6407 88.843 11.993 88.7555 11.1079C88.0831 4.33113 86.7243 3.32153 86.5769 3.23164C85.5821 3.38607 82.9314 7.74256 82.556 13.1363C82.4477 14.6737 82.4408 18.3065 84.6701 18.8435C85.536 19.0533 86.068 19.9246 85.8607 20.789C85.6834 21.5289 85.0224 22.0245 84.2947 22.0245L84.2924 22.0221Z" fill="#1F1F1F" />
      <path d="M110.38 22.0221C110.256 22.0221 110.129 22.0083 110 21.976C106.511 21.1347 104.842 17.3222 105.535 11.7763C106.131 7.01648 108.812 0 112.679 0H112.72C116.543 0.0484054 117.593 6.17975 118.049 10.7875C118.137 11.6749 117.489 12.4655 116.605 12.5531C115.721 12.6407 114.929 11.993 114.841 11.1079C114.169 4.33113 112.81 3.32153 112.662 3.23164C111.668 3.38607 109.017 7.74256 108.642 13.1363C108.533 14.6737 108.526 18.3065 110.756 18.8435C111.622 19.0533 112.154 19.9246 111.946 20.789C111.769 21.5289 111.108 22.0245 110.38 22.0245V22.0221Z" fill="#1F1F1F" />
      <path d="M138.608 22.9648C138.483 22.9648 138.357 22.951 138.23 22.9187C134.741 22.0774 133.071 18.2649 133.764 12.719C134.361 7.95687 137.042 0.940394 140.908 0.940394H140.95C144.773 0.988799 145.823 7.12015 146.279 11.7279C146.366 12.6153 145.719 13.4059 144.835 13.4935C143.948 13.5811 143.158 12.9334 143.071 12.0483C142.398 5.27152 141.039 4.26193 140.892 4.17203C139.897 4.32647 137.247 8.68295 136.871 14.0767C136.763 15.6141 136.756 19.2469 138.985 19.7839C139.851 19.9937 140.383 20.865 140.176 21.7294C139.999 22.4693 139.338 22.9648 138.61 22.9648H138.608Z" fill="#1F1F1F" />
      <path d="M166.411 24.0093C166.287 24.0093 166.16 23.9955 166.031 23.9632C162.542 23.1219 160.872 19.3094 161.566 13.7635C162.162 9.00132 164.843 1.98484 168.709 1.98484H168.751C172.574 2.03325 173.624 8.1646 174.08 12.7723C174.167 13.6598 173.52 14.4504 172.636 14.538C171.749 14.6279 170.959 13.9779 170.872 13.0927C170.199 6.31597 168.841 5.30637 168.693 5.21648C167.698 5.37091 165.048 9.7274 164.672 15.1211C164.564 16.6586 164.557 20.2913 166.786 20.8284C167.652 21.0381 168.184 21.9094 167.977 22.7738C167.8 23.5137 167.139 24.0093 166.411 24.0093Z" fill="#1F1F1F" />
      <path d="M168.834 115.066C156.969 123.457 27.5868 117.906 17.5758 115.594C5.39089 112.78 1.61175 100.204 1.61175 100.204C1.61175 100.204 137.836 106.937 151.235 106.937C151.235 106.937 161.432 119.997 168.834 115.066Z" fill="#4FC7FF" />
      <path d="M113.452 121.154C106.887 121.154 99.8627 121.087 92.4817 120.956C57.1429 120.324 22.4097 118.365 17.2143 117.166C4.26707 114.177 0.232292 101.218 0.0687823 100.669C-0.0832127 100.167 0.0204203 99.6228 0.342834 99.2102C0.665247 98.7976 1.16729 98.5671 1.69236 98.5924C3.05341 98.6593 138.03 105.323 151.237 105.323C151.732 105.323 152.202 105.551 152.508 105.943C152.6 106.061 161.966 117.703 167.945 113.723C168.68 113.234 169.67 113.425 170.167 114.154C170.665 114.882 170.487 115.875 169.769 116.385C168.654 117.173 165.262 119.573 141.68 120.626C133.804 120.979 124.249 121.156 113.457 121.156L113.452 121.154ZM4.05059 101.939C5.70641 105.459 9.84022 112.151 17.9397 114.022C22.4259 115.057 55.7266 117.072 92.5393 117.731C123.558 118.284 146.93 117.648 159.118 116.002C155.078 113.755 151.711 110.025 150.468 108.545C134.683 108.35 22.921 102.871 4.05059 101.942V101.939Z" fill="#1F1F1F" />
    </svg>
  );
}
