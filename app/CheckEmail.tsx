"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, PasscodeField } from "@/components";
import styles from "./check-email.module.css";

type CheckEmailProps = {
  email: string;
  onBack: () => void;
};

export function CheckEmail({ email, onBack }: CheckEmailProps) {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [loading, setLoading] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  function logIn() {
    if (passcode.length !== 6 || loading) return;
    setLoading(true);
    timer.current = window.setTimeout(() => {
      router.push("/dashboard");
    }, 1500);
  }

  return (
    <Card compact>
      <div className={styles.intro}>
        <img className={styles.illustration} src="/brand/email.svg" alt="" width={105} height={90} />
        <h1 className={styles.title}>Check your email</h1>
        <p>
          We sent a verification email to {email}. It has a one-time passcode to verify your
          account.
        </p>
      </div>
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          logIn();
        }}
      >
        <PasscodeField
          label="One-time passcode"
          name="passcode"
          value={passcode}
          onChange={(event) => setPasscode(event.target.value)}
        />
        <Button
          type="submit"
          fullWidth
          disabled={passcode.length !== 6}
          loading={loading}
          loadingLabel="Logging in"
        >
          Log In
        </Button>
      </form>
      <div className={styles.prompts}>
        <p className={styles.prompt}>
          <span>Didn’t get it?</span>
          <Button variant="text" size="small">Request a new passcode</Button>
        </p>
        <p className={styles.prompt}>
          <span>Not the right email?</span>
          <Button variant="text" size="small" onClick={onBack}>
            Back to Login
          </Button>
        </p>
      </div>
    </Card>
  );
}
