"use client";

import { useState } from "react";
import { Button, TextField } from "@/components";
import { PasskeyIcon } from "@/components/icons/PasskeyIcon";
import styles from "./page.module.css";

export function LoginForm({
  onSubmit,
  sending = false,
}: {
  onSubmit: (email: string) => void;
  sending?: boolean;
}) {
  const [passkeyUnavailable, setPasskeyUnavailable] = useState(false);

  return (
    <form
      className={styles.form}
        onSubmit={(event) => {
        event.preventDefault();
        if (sending) return;
        const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();
        if (!email) return;
        onSubmit(email);
      }}
    >
      <div className={styles.passkey}>
        <Button
          variant="outline"
          fullWidth
          icon={<PasskeyIcon />}
          onClick={() => setPasskeyUnavailable(true)}
        >
          Sign in with Passkey
        </Button>
        {passkeyUnavailable ? (
          <p className={styles.passkeyMessage} role="status">
            No available in this demo version
          </p>
        ) : null}
      </div>
      <p className={styles.or}>Or</p>
      <div className={styles.credentials}>
        <TextField label="Email Address" name="email" type="email" autoComplete="email" required />
        <Button type="submit" fullWidth loading={sending} loadingLabel="Sending passcode">
          Send One-Time Passcode
        </Button>
      </div>
    </form>
  );
}
