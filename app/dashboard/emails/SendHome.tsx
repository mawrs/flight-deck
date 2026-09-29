"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Page, PageHeader } from "@/components";
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

export function SendHome() {
  const [query, setQuery] = useState("");
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [product, setProduct] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Rejection/Decline");
  const [template, setTemplate] = useState("");
  const [menu, setMenu] = useState<null | "category" | "template">(null);
  const [draft, setDraft] = useState<{ name: string; email: string; product: string; template: string } | null>(null);
  const stepsRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const tokens = q.split(/\s+/);
    return APPLICANTS.filter((person) => {
      const haystack = [person.name, person.email, person.id, person.alias, `#${person.id}`, `#${person.alias}`].join(" ").toLowerCase();
      return tokens.every((token) => haystack.includes(token));
    });
  }, [query]);

  const applicant = matches.length === 1 ? matches[0] : matches.find((person) => person.id === pickedId) ?? null;

  useEffect(() => {
    setProduct(applicant?.applications[0] ?? "");
    setTemplate("");
    setMenu(null);
  }, [applicant?.id]);

  useEffect(() => {
    if (!menu) return;
    function closeOnOutside(event: PointerEvent) {
      if (!stepsRef.current?.contains(event.target as Node)) setMenu(null);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenu(null);
    }
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menu]);

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

  return (
    <Page flush className={styles.homePage}>
      <PageHeader
        className={styles.pageHeader}
        title="Single Email Send"
        actions={
          <button
            className={template ? styles.chooseReady : styles.chooseIdle}
            type="button"
            disabled={!template || !applicant}
            onClick={() => {
              if (!applicant || !template) return;
              setDraft({ name: applicant.name, email: applicant.email, product, template });
            }}
          >
            Choose this template
            <Chevron direction="right" />
          </button>
        }
      />
      <div className={styles.homeBody}>
      <div className={styles.homeSearchWrap}>
      <label className={styles.homeSearch}>
        <img src="/dashboard/search.svg" alt="" width={12} height={12} />
        <input
          type="search"
          aria-label="Search applicants"
          placeholder="Search applicants"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPickedId(null);
          }}
        />
      </label>
      {query.trim() && matches.length === 0 ? <p className={styles.homeEmpty}>No matching applicants.</p> : null}
      {matches.length > 1 && !applicant ? (
        <div className={`uw-dropdown ${styles.homeResults}`} role="listbox" aria-label="Matching applicants">
          {matches.map((person) => (
            <DropdownItem key={person.id} role="option" onClick={() => setPickedId(person.id)}>
              <span className={styles.homeResultLabel}>
                {person.name}
                <span>ID #{person.id}</span>
              </span>
            </DropdownItem>
          ))}
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
