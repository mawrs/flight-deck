"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Page, PageHeader, SearchField } from "@/components";
import { DropdownItem } from "@/components/ui/Dropdown";
import { SingleSend } from "./SingleSend";
import styles from "./emails.module.css";

type Applicant = {
  id: string;
  name: string;
  email: string;
  alias: string;
  applications: string[];
};

const APPLICANTS: Applicant[] = [
  {
    id: "981723123",
    name: "John Smith",
    email: "jsmith@email.com",
    alias: "810923",
    applications: ["6-Month CD", "12-Month CD", "Checking", "Savings"],
  },
  {
    id: "294",
    name: "Aardvark User",
    email: "jhart@southeastbank.com",
    alias: "294",
    applications: ["Personal Loan", "Auto Loan"],
  },
];

const CATEGORIES = ["Rejection/Decline", "New Account Open", "Follow up", "Security/Verification"] as const;

const TEMPLATES: Record<(typeof CATEGORIES)[number], string[]> = {
  "Rejection/Decline": ["General Rejection V2", "QualiFile Rejection", "QualiFile or Telecheck Funding Rejection"],
  "New Account Open": ["Welcome"],
  "Follow up": ["Application Drop Off", "Application Drop Off 2"],
  "Security/Verification": ["Self Serve OTP", "Password Reset"],
};

function Chevron({ direction }: { direction: "down" | "right" }) {
  const src = direction === "down" ? "/dashboard/chevron-down.svg" : "/dashboard/chevron-right.svg";
  return <img src={src} alt="" width={16} height={16} />;
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M5 4.06 8.9 8 5 11.94 6.05 13 11 8 6.05 3 5 4.06Z" fill="currentColor" />
    </svg>
  );
}

export function SendHome() {
  const [query, setQuery] = useState("");
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [product, setProduct] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Rejection/Decline");
  const [template, setTemplate] = useState("");
  const [menu, setMenu] = useState<null | "category" | "template">(null);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [draft, setDraft] = useState<{ name: string; email: string; product: string; template: string } | null>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const tokens = q ? q.split(/\s+/) : [];
    return APPLICANTS.filter((person) => {
      if (!tokens.length) return true;
      const haystack = [person.name, person.email, person.id, person.alias, `#${person.id}`, `#${person.alias}`].join(" ").toLowerCase();
      return tokens.every((token) => haystack.includes(token));
    });
  }, [query]);

  const applicant = pickedId
    ? (APPLICANTS.find((person) => person.id === pickedId) ?? null)
    : query.trim() && matches.length === 1
      ? matches[0]
      : null;

  useEffect(() => {
    setProduct(applicant?.applications[0] ?? "");
    setTemplate("");
    setMenu(null);
  }, [applicant?.id]);

  useEffect(() => {
    if (!menu && !resultsOpen) return;
    function closeOnOutside(event: PointerEvent) {
      const target = event.target as Node;
      if (menu && !stepsRef.current?.contains(target)) setMenu(null);
      if (resultsOpen && !searchRef.current?.contains(target)) setResultsOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setMenu(null);
      setResultsOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menu, resultsOpen]);

  if (draft) {
    return (
      <SingleSend
        templateTitle={draft.template}
        applicantName={draft.name}
        applicantEmail={draft.email}
        productName={draft.product}
        onCancel={() => setDraft(null)}
      />
    );
  }

  const templates = TEMPLATES[category];
  const ready = Boolean(applicant && template);

  return (
    <Page flush className={styles.homePage}>
      <PageHeader
        className={styles.pageHeader}
        title="Single Email Send"
        actions={
          ready ? (
            <Button
              size="small"
              onClick={() => {
                if (!applicant || !template) return;
                setDraft({ name: applicant.name, email: applicant.email, product, template });
              }}
            >
              Choose this template
              <ChevronRight />
            </Button>
          ) : (
            <button className={styles.chooseIdle} type="button" disabled>
              Choose this template
              <Chevron direction="right" />
            </button>
          )
        }
      />
      <div className={styles.homeBody}>
      <div className={styles.homeSearchWrap} ref={searchRef}>
        <SearchField
          label="Search applicants"
          placeholder="Search applicants"
          value={query}
          onFocus={() => setResultsOpen(true)}
          onBlur={(event) => {
            const next = event.relatedTarget;
            if (next instanceof Node && searchRef.current?.contains(next)) return;
            setResultsOpen(false);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setPickedId(null);
            setResultsOpen(true);
          }}
        />
        {resultsOpen ? (
          <div className={`uw-dropdown ${styles.homeResults}`} role="listbox" aria-label="Matching applicants">
            {matches.length === 0 ? (
              <p className={styles.homeEmpty}>No matching applicants.</p>
            ) : (
              matches.map((person) => (
                <DropdownItem
                  key={person.id}
                  role="option"
                  onClick={() => {
                    setPickedId(person.id);
                    setResultsOpen(false);
                  }}
                >
                  <span className={styles.homeResultLabel}>
                    {person.name}
                    <span>ID #{person.id}</span>
                  </span>
                </DropdownItem>
              ))
            )}
          </div>
        ) : null}
      </div>
      <section className={styles.homeCard}>
          <div className={styles.homeApps}>
            <div className={styles.homePaneHead}>
              <p className={styles.homeName}>{applicant ? applicant.name : "Applicant"}</p>
              {applicant ? <p className={styles.homeId}>ID #{applicant.id}</p> : null}
            </div>
            {applicant ? (
            <div className={styles.homeAppList}>
              {applicant.applications.map((name) => (
                <button
                  key={name}
                  className={name === product ? styles.homeAppSelected : styles.homeApp}
                  type="button"
                  aria-pressed={name === product}
                  onClick={() => setProduct(name)}
                >
                  <span className={styles.homeAppLabel}>
                    <span className={styles.homeDot} />
                    {name}
                  </span>
                  <Chevron direction="right" />
                </button>
              ))}
            </div>
            ) : (
              <div className={styles.homePaneEmpty}>
                <strong>No applicant selected</strong>
                <p>Search by name, email, or ID to see their applications.</p>
              </div>
            )}
          </div>
          <div className={styles.homeSend}>
            <div className={styles.homePaneHead}>
              <p className={styles.homeName}>Send New Email</p>
            </div>
            {applicant ? (
            <div className={styles.homeSteps} ref={stepsRef}>
              <div className={styles.homeStep}>
                <span className={styles.homeStepNum}>1</span>
                <div className={styles.homeStepBody}>
                  <p className={styles.homeStepLabel}>Choose email category</p>
                  <button
                    className={styles.homeSelect}
                    type="button"
                    aria-expanded={menu === "category"}
                    onClick={() => setMenu((current) => (current === "category" ? null : "category"))}
                  >
                    <span>{category}</span>
                    <Chevron direction="down" />
                  </button>
                  {menu === "category" ? (
                    <div className={styles.homeMenu} role="listbox" aria-label="Email category">
                      {CATEGORIES.map((item) => (
                        <button
                          key={item}
                          className={item === category ? styles.homeOptionActive : styles.homeOption}
                          type="button"
                          role="option"
                          aria-selected={item === category}
                          onClick={() => {
                            setCategory(item);
                            setTemplate("");
                            setMenu(null);
                          }}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className={styles.homeStep}>
                <span className={styles.homeStepNum}>2</span>
                <div className={styles.homeStepBody}>
                  <p className={styles.homeStepLabel}>Choose a template for</p>
                  <button
                    className={styles.homeSelect}
                    type="button"
                    aria-expanded={menu === "template"}
                    onClick={() => setMenu((current) => (current === "template" ? null : "template"))}
                  >
                    <span className={template ? undefined : styles.homePlaceholder}>{template || "Select..."}</span>
                    <Chevron direction="down" />
                  </button>
                  {menu === "template" ? (
                    <div className={styles.homeMenu} role="listbox" aria-label="Email template">
                      {templates.map((item) => (
                        <button
                          key={item}
                          className={item === template ? styles.homeOptionActive : styles.homeOption}
                          type="button"
                          role="option"
                          aria-selected={item === template}
                          onClick={() => {
                            setTemplate(item);
                            setMenu(null);
                          }}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
            ) : (
              <div className={styles.homePaneEmpty}>
                <strong>No template selected</strong>
                <p>Choose an applicant before picking a category and template.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </Page>
  );
}
