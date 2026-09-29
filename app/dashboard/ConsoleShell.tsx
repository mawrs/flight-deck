"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import styles from "./dashboard.module.css";

const NAV = [
  { id: "flight-deck", label: "Flight Deck", icon: "/dashboard/windows.svg", light: true },
  { id: "loan-origination", label: "Loan Origination", icon: "/dashboard/loan.svg", light: false },
  { id: "users", label: "Manage Users", icon: "/dashboard/myspace.svg", light: false },
  { id: "emails", label: "Emails", icon: "/dashboard/email.svg", light: false },
  { id: "settings", label: "System Configuration", icon: "/dashboard/gear.svg", light: false },
] as const;

function selectionFor(pathname: string) {
  if (pathname.startsWith("/dashboard/loan-origination")) return "loan-origination";
  if (pathname.startsWith("/dashboard/users")) return "users";
  if (pathname.startsWith("/dashboard/emails/suppression")) return "suppression";
  if (pathname.startsWith("/dashboard/emails/send")) return "single-email";
  if (pathname.startsWith("/dashboard/emails")) return "emails";
  if (pathname.startsWith("/dashboard/configuration")) return "settings";
  return "flight-deck";
}

const EMAIL_TABS = [
  { id: "single-email", label: "Single email send", icon: "/dashboard/mail.svg", width: 20, height: 14 },
  { id: "suppression", label: "Suppression list", icon: "/dashboard/close.svg", width: 20, height: 20 },
] as const;

export function ConsoleShell({ children, initialExpanded = false }: { children: ReactNode; initialExpanded?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpandedState] = useState(initialExpanded);

  function setExpanded(next: boolean | ((open: boolean) => boolean)) {
    setExpandedState((current) => {
      const value = typeof next === "function" ? next(current) : next;
      document.cookie = `sidebar=${value ? "open" : "closed"}; Path=/; Max-Age=31536000; SameSite=Lax`;
      return value;
    });
  }
  const [emailsOpen, setEmailsOpen] = useState(() => pathname.startsWith("/dashboard/emails"));
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [selected, setSelected] = useState(() => selectionFor(pathname));

  useEffect(() => {
    if (pathname.startsWith("/dashboard/loan-origination")) {
      setSelected("loan-origination");
      setEmailsOpen(false);
      return;
    }
    if (pathname.startsWith("/dashboard/users")) {
      setSelected("users");
      setEmailsOpen(false);
      return;
    }
    if (pathname.startsWith("/dashboard/configuration")) {
      setSelected("settings");
      setEmailsOpen(false);
      return;
    }
    if (pathname.startsWith("/dashboard/emails")) {
      setEmailsOpen(true);
      if (pathname.startsWith("/dashboard/emails/suppression")) setSelected("suppression");
      else if (pathname.startsWith("/dashboard/emails/send")) setSelected("single-email");
      else setSelected("emails");
      return;
    }
    if (pathname === "/dashboard" || /^\/dashboard\/[^/]+$/.test(pathname)) {
      setSelected("flight-deck");
      setEmailsOpen(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (!userMenuOpen) return;
    function closeOnOutside(event: PointerEvent) {
      if (!userMenuRef.current?.contains(event.target as Node)) setUserMenuOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setUserMenuOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [userMenuOpen]);

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <img className={styles.logo} src="/dashboard/logo.png" alt="SouthEast Bank" width={162} height={43} />
        <div className={styles.userMenu} ref={userMenuRef}>
          <button
            className={styles.user}
            type="button"
            aria-expanded={userMenuOpen}
            aria-haspopup="menu"
            onClick={() => setUserMenuOpen((open) => !open)}
          >
            Demo Account
            <img
              className={userMenuOpen ? styles.userChevronOpen : undefined}
              src="/dashboard/chevron-down.svg"
              alt=""
              width={16}
              height={16}
            />
          </button>
          {userMenuOpen ? (
            <div className={styles.userMenuPanel} role="menu">
              <button className={styles.userMenuItem} type="button" role="menuitem" onClick={() => router.push("/")}>
                Sign Out
              </button>
            </div>
          ) : null}
        </div>
      </header>
      <div className={styles.body}>
        <nav className={expanded ? styles.sidebarExpanded : styles.sidebar} aria-label="Flight Deck Console">
          <button
            className={styles.toggle}
            type="button"
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse menu" : "Expand menu"}
            onClick={() => setExpanded((open) => !open)}
          >
            {expanded ? <span className={styles.toggleLabel}>Flight Deck Console</span> : null}
            <img
              className={[styles.toggleIcon, expanded ? styles.toggleIconFlipped : ""].filter(Boolean).join(" ")}
              src="/dashboard/toggle.svg"
              alt=""
              width={16}
              height={20}
            />
          </button>
          <span className={styles.rule} role="separator" />
          <div className={styles.menu}>
            {NAV.map((item) => {
              const active = selected === item.id;
              const iconClass =
                active && !item.light ? styles.iconLight : !active && item.light ? styles.iconMute : undefined;
              return (
                <div key={item.id} className={styles.menuItem}>
                  <button
                    className={active ? styles.itemActive : styles.item}
                    type="button"
                    aria-current={active ? "page" : undefined}
                    aria-expanded={item.id === "emails" ? emailsOpen : undefined}
                    onClick={() => {
                      if (item.id === "emails") {
                        if (!expanded) setExpanded(true);
                        if (pathname !== "/dashboard/emails") {
                          setEmailsOpen(true);
                          setSelected("emails");
                          router.push("/dashboard/emails");
                          return;
                        }
                        setEmailsOpen((open) => !open);
                        return;
                      }
                      setSelected(item.id);
                      setEmailsOpen(false);
                      if (item.id === "loan-origination" && pathname !== "/dashboard/loan-origination") {
                        router.push("/dashboard/loan-origination");
                      }
                      if (item.id === "users" && pathname !== "/dashboard/users") {
                        router.push("/dashboard/users");
                      }
                      if (item.id === "settings" && pathname !== "/dashboard/configuration") {
                        router.push("/dashboard/configuration");
                      }
                      if (item.id === "flight-deck" && pathname !== "/dashboard") router.push("/dashboard");
                    }}
                  >
                    <img className={iconClass} src={item.icon} alt="" width={20} height={20} />
                    <span className={expanded ? styles.itemLabel : styles.srOnly}>{item.label}</span>
                    {item.id === "emails" && expanded ? (
                      <img
                        className={[emailsOpen ? styles.chevron : styles.chevronClosed, active ? "" : styles.iconMute]
                          .filter(Boolean)
                          .join(" ")}
                        src="/dashboard/chevron-menu.svg"
                        alt=""
                        width={20}
                        height={20}
                      />
                    ) : null}
                  </button>
                  {item.id === "emails" && emailsOpen && expanded ? (
                    <div className={styles.submenu} role="group" aria-label="Emails">
                      {EMAIL_TABS.map((tab) => (
                        <button
                          key={tab.id}
                          className={[styles.subitem, selected === tab.id ? styles.subitemActive : ""].filter(Boolean).join(" ")}
                          type="button"
                          aria-current={selected === tab.id ? "page" : undefined}
                          onClick={() => {
                            setSelected(tab.id);
                            router.push(tab.id === "suppression" ? "/dashboard/emails/suppression" : "/dashboard/emails/send");
                          }}
                        >
                          <img src={tab.icon} alt="" width={tab.width} height={tab.height} />
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </nav>
        {children}
      </div>
    </div>
  );
}
