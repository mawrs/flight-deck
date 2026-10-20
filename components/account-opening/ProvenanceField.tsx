"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { FloatInput } from "@/components/ui/FloatInput";
import { Select, type SelectOption } from "@/components/ui/Dropdown";
import { money } from "@/lib/format";
import { parseMoney } from "@/lib/account-opening-data";
import type { ConversationInsight } from "@/lib/account-opening-types";

export function ProvenanceField({
  id,
  label,
  value,
  suggestion,
  profileValue,
  readOnly = false,
  type = "text",
  options,
  focused = false,
  moneyInput = false,
  onChange,
  onAccept,
  onDismiss,
  onUseProfile,
}: {
  id: string;
  label: string;
  value: string;
  suggestion?: ConversationInsight;
  profileValue?: string;
  readOnly?: boolean;
  type?: "text" | "email" | "tel";
  options?: SelectOption[];
  focused?: boolean;
  moneyInput?: boolean;
  onChange: (value: string) => void;
  onAccept?: () => void;
  onDismiss?: () => void;
  onUseProfile?: () => void;
}) {
  const pending = suggestion?.status === "suggested";
  const showProfile = Boolean(profileValue && profileValue !== value);
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const pendingCaret = useRef<number | null>(null);
  const amount = moneyInput ? parseMoney(value) : null;
  const moneyDisplay = amount == null ? value : money(amount);
  const displayValue = options?.find((option) => option.id === value)?.label ?? value;
  const moneyValue = !moneyInput ? value : editing || amount == null ? formatMoneyTyping(value) : moneyDisplay;

  useLayoutEffect(() => {
    const input = inputRef.current;
    const caret = pendingCaret.current;
    if (!input || caret == null || document.activeElement !== input) return;
    const pos = caretAfterSignificant(input.value, caret);
    input.setSelectionRange(pos, pos);
    pendingCaret.current = null;
  });

  return (
    <div id={id} className={`flex flex-col gap-xs ${focused ? "rounded-xs bg-warning-bg px-[2px]" : ""}`}>
      {readOnly ? (
        <div className="flex flex-col gap-xs">
          <span className="text-xs text-gray-medium">{label}</span>
          <span className="flex min-h-5 items-center text-sm text-black">{(moneyInput ? moneyDisplay : displayValue) || "—"}</span>
        </div>
      ) : options ? (
        <Select
          variant="float"
          label={label}
          value={value}
          placeholder="Select a product"
          options={options}
          disabled={readOnly}
          onChange={onChange}
        />
      ) : (
        <FloatInput
          label={label}
          value={moneyValue}
          type={type}
          readOnly={readOnly}
          inputRef={inputRef}
          onChange={(next, caret) => {
            if (!moneyInput) {
              onChange(next);
              return;
            }
            const edited = editMoney(value, next, caret);
            pendingCaret.current = edited.caret;
            onChange(edited.text);
          }}
          onFocus={() => {
            setEditing(true);
            if (moneyInput && amount != null && money(amount) !== value) onChange(money(amount));
          }}
          onBlur={() => {
            setEditing(false);
            pendingCaret.current = null;
            if (moneyInput && amount != null) onChange(money(amount));
          }}
        />
      )}
      {pending ? (
        <div className="flex flex-wrap items-center gap-sm text-sm text-gray-dark">
          <span>{suggestion.displayValue}</span>
          <button className="uw-btn-link" type="button" onClick={onAccept}>
            Accept
          </button>
          <button className="uw-btn-link" type="button" onClick={onDismiss}>
            Dismiss
          </button>
        </div>
      ) : null}
      {showProfile ? (
        <button className="uw-btn-link w-fit" type="button" onClick={onUseProfile}>
          Use profile: {profileValue}
        </button>
      ) : null}
    </div>
  );
}

function significant(value: string) {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const dot = cleaned.indexOf(".");
  if (dot < 0) return cleaned;
  return `${cleaned.slice(0, dot)}.${cleaned.slice(dot + 1).replace(/\./g, "").slice(0, 2)}`;
}

function formatMoneyTyping(raw: string) {
  const cleaned = significant(raw);
  if (!cleaned) return "";
  const dot = cleaned.indexOf(".");
  const wholeRaw = dot < 0 ? cleaned : cleaned.slice(0, dot);
  const fraction = dot < 0 ? null : cleaned.slice(dot + 1);
  if (!wholeRaw && (fraction == null || (fraction !== "" && /^0*$/.test(fraction)))) return "";
  const whole = wholeRaw.replace(/^0+(?=\d)/, "") || "0";
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return fraction == null ? `$${grouped}.00` : `$${grouped}.${fraction}`;
}

function significantCount(value: string, end: number) {
  return value.slice(0, end).replace(/[^0-9.]/g, "").length;
}

function caretAfterSignificant(formatted: string, count: number) {
  if (count <= 0) return formatted.startsWith("$") ? 1 : 0;
  let seen = 0;
  for (let index = 0; index < formatted.length; index += 1) {
    if (/[0-9.]/.test(formatted[index])) {
      seen += 1;
      if (seen === count) return index + 1;
    }
  }
  return formatted.length;
}

function rawParts(raw: string) {
  const cleaned = raw.replace(/[^0-9.]/g, "");
  const dot = cleaned.indexOf(".");
  if (dot < 0) return { whole: cleaned, fraction: null as string | null };
  return { whole: cleaned.slice(0, dot), fraction: cleaned.slice(dot + 1).replace(/\./g, "") };
}

function editMoney(current: string, next: string, caret: number) {
  const previous = significant(current);
  const prevParts = rawParts(previous);
  const nextParts = rawParts(next);
  let whole = nextParts.whole;
  let fraction = nextParts.fraction;
  let appendedDollar = false;
  if (
    fraction &&
    fraction.length === 3 &&
    prevParts.fraction === "00" &&
    fraction.startsWith("00") &&
    caret >= next.length
  ) {
    whole += fraction[2];
    fraction = "00";
    appendedDollar = true;
  } else if (fraction && fraction.length > 2) {
    fraction = fraction.slice(0, 2);
  }

  let digits = fraction == null ? whole : `${whole}.${fraction}`;
  let count = significantCount(next, caret);
  if (previous.includes(".") && fraction == null && digits === previous.replace(".", "")) {
    digits = previous.slice(0, previous.indexOf("."));
    count = digits.length;
  } else if (significant(digits) === previous && next.length < current.length && count > 0) {
    digits = `${previous.slice(0, count - 1)}${previous.slice(count)}`;
    count -= 1;
  } else if (appendedDollar) {
    count = whole.replace(/^0+(?=\d)/, "").length;
  }
  const text = formatMoneyTyping(digits);
  return { text, caret: Math.min(count, significant(text).length) };
}
