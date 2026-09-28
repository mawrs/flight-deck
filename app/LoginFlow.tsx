"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Card, Logo } from "@/components";
import { CheckEmail } from "./CheckEmail";
import { LoginForm } from "./LoginForm";
import styles from "./page.module.css";

type Step = "login" | "sent";

export function LoginFlow() {
  const [step, setStep] = useState<Step>("login");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  function sendPasscode(nextEmail: string) {
    if (sending) return;
    setEmail(nextEmail);
    setSending(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setSending(false);
      setStep("sent");
    }, 1500);
  }

  return (
    <main className={styles.main}>
      <Logo />
      {step === "login" ? (
        <div className={styles.panel}>
          <Card>
            <h1 className={styles.title}>Secure login</h1>
            <LoginForm onSubmit={sendPasscode} sending={sending} />
          </Card>
          <Button variant="text" size="small" href="#signup">
            New to SouthEast Bank? Sign up
          </Button>
        </div>
      ) : null}
      {step === "sent" ? (
        <div className={styles.panel}>
          <CheckEmail email={email} onBack={() => setStep("login")} />
        </div>
      ) : null}
    </main>
  );
}
