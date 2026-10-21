"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Card, Logo } from "@/components";
import { FloatInput } from "@/components/ui/FloatInput";
import { CheckEmail } from "./CheckEmail";
import styles from "./page.module.css";

export function SignupFlow({
  email,
  onAuthenticated,
  onSignIn,
}: {
  email: string;
  onAuthenticated?: () => void;
  onSignIn?: () => void;
}) {
  const [entered, setEntered] = useState("");
  const [mismatch, setMismatch] = useState(false);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  function sendPasscode() {
    const typed = entered.trim().toLowerCase();
    if (sending || !typed) return;
    if (typed !== email.trim().toLowerCase()) {
      setMismatch(true);
      return;
    }
    setMismatch(false);
    setSending(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setSending(false);
      setSent(true);
    }, 1500);
  }

  return (
    <main className={styles.main}>
      <Logo showBadge={false} />
      {sent ? (
        <div className={styles.panel}>
          <CheckEmail
            email={email}
            onBack={() => setSent(false)}
            onAuthenticated={onAuthenticated}
            backLabel="Back"
            submitLabel="Continue"
          />
        </div>
      ) : (
        <div className={styles.panel}>
          <Card>
            <h1 className={styles.title}>Sign up for a SouthEast Bank account</h1>
            <form
              className={styles.form}
              onSubmit={(event) => {
                event.preventDefault();
                sendPasscode();
              }}
            >
              <div className={styles.credentials}>
                <FloatInput label="Email Address" type="email" value={entered} onChange={(value) => { setEntered(value); setMismatch(false); }} />
                <p className={styles.note} role={mismatch ? "alert" : undefined}>
                  {mismatch
                    ? "That email doesn't match the one from your call."
                    : "Make sure you enter the same email from your phone call with your agent."}
                </p>
                <Button type="submit" fullWidth loading={sending} loadingLabel="Sending passcode" disabled={!entered.trim()}>
                  Send One-Time Passcode
                </Button>
              </div>
            </form>
          </Card>
          <Button variant="link" size="small" onClick={onSignIn}>
            Already a member? Sign in
          </Button>
        </div>
      )}
    </main>
  );
}
