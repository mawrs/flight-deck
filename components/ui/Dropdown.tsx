"use client";

import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { FloatInput } from "@/components/ui/FloatInput";
import type { SearchChoice } from "@/lib/search";

export type SelectOption = { id: string; label: string; disabled?: boolean };

type Align = "left" | "right";
type SelectVariant = "field" | "input" | "float" | "plain" | "compact" | "box";

function toOptions(options: ReadonlyArray<string | SelectOption>): SelectOption[] {
  return options.map((option) =>
    typeof option === "string" ? { id: option, label: option } : option,
  );
}

function mergeRefs<T>(...refs: Array<{ current: T | null } | ((node: T | null) => void) | null | undefined>) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === "function") ref(node);
      else ref.current = node;
    }
  };
}

function panelStyle(
  trigger: DOMRect,
  panel: DOMRect | null,
  align: Align,
  minWidth = 0,
  fit: "trigger" | "content" = "trigger",
): CSSProperties {
  const gap = 4;
  const spaceBelow = window.innerHeight - trigger.bottom - gap - 8;
  const spaceAbove = trigger.top - gap - 8;
  const openUp = spaceBelow < 160 && spaceAbove > spaceBelow;
  const maxHeight = Math.min(360, Math.max(120, openUp ? spaceAbove : spaceBelow));
  const height = panel?.height ?? Math.min(maxHeight, 240);
  const top = openUp ? Math.max(8, trigger.top - gap - height) : trigger.bottom + gap;
  const width = fit === "content" ? Math.max(320, minWidth) : Math.max(trigger.width, minWidth);
  const style: CSSProperties = {
    position: "fixed",
    top,
    minWidth: width,
    width: "max-content",
    maxWidth: Math.min(640, window.innerWidth - 16),
    maxHeight,
    zIndex: 50,
  };
  if (align === "right") {
    style.right = Math.max(8, window.innerWidth - trigger.right);
    style.left = "auto";
  } else {
    style.left = Math.min(Math.max(8, trigger.left), window.innerWidth - trigger.width - 8);
  }
  return style;
}

function useMenu(
  open: boolean,
  onClose: () => void,
  align: Align,
  minWidth = 0,
  fit: "trigger" | "content" = "trigger",
) {
  const triggerRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties>({});
  const [ready, setReady] = useState(false);

  const update = useCallback(() => {
    const trigger = triggerRef.current?.getBoundingClientRect();
    if (!trigger) return;
    setStyle(panelStyle(trigger, panelRef.current?.getBoundingClientRect() ?? null, align, minWidth, fit));
  }, [align, fit, minWidth]);

  useLayoutEffect(() => {
    if (!open) {
      setReady(false);
      return;
    }
    update();
    setReady(true);
  }, [open, update]);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: globalThis.MouseEvent) {
      const node = event.target as Node;
      if (triggerRef.current?.contains(node) || panelRef.current?.contains(node)) return;
      onClose();
    }
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape" || event.key === "Tab") onClose();
    }
    const timer = window.setTimeout(() => {
      document.addEventListener("mousedown", onPointer);
    }, 0);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, onClose, update]);

  return { triggerRef, panelRef, style, ready };
}

const triggerClass: Record<SelectVariant, string> = {
  field: "uw-list-field w-full text-left",
  input: "uw-input flex w-full items-center justify-between gap-sm text-left",
  float:
    "relative flex h-[60px] w-full items-end rounded-xs border border-gray-light bg-white px-md pt-[18px] pb-sm text-left text-base text-black",
  plain: "inline-flex w-full min-w-0 items-center justify-between gap-sm bg-transparent text-left text-sm text-gray-dark outline-none",
  compact: "flex h-[34px] w-full items-center justify-between bg-white px-sm text-left text-sm outline-none",
  box: "flex w-full items-center justify-between gap-sm rounded-xs border border-gray-light bg-white px-md text-left text-base text-gray-dark",
};

export function DropdownItem({
  children,
  onClick,
  disabled,
  selected,
  active,
  role = "menuitem",
  id,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  selected?: boolean;
  active?: boolean;
  role?: "menuitem" | "option";
  id?: string;
}) {
  return (
    <button
      type="button"
      id={id}
      role={role}
      disabled={disabled}
      aria-selected={role === "option" ? selected : undefined}
      data-active={active ? "true" : undefined}
      className="uw-dropdown-item"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      <span className="min-w-0 flex-1 py-[6px] break-words">{children}</span>
      {selected != null ? (
        <span className="flex size-5 shrink-0 items-center justify-center">
          {selected ? <CheckCircleIcon /> : null}
        </span>
      ) : null}
    </button>
  );
}

export function Dropdown({
  trigger,
  children,
  align = "left",
  disabled,
  minWidth = 208,
  panelClassName = "",
}: {
  trigger: ReactElement<ButtonHTMLAttributes<HTMLButtonElement>>;
  children: ReactNode | ((api: { close: () => void }) => ReactNode);
  align?: Align;
  disabled?: boolean;
  minWidth?: number;
  panelClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const { triggerRef, panelRef, style, ready } = useMenu(open, close, align, minWidth);
  const triggerEl = isValidElement(trigger)
    ? cloneElement(trigger, {
        disabled: disabled || trigger.props.disabled,
        "aria-haspopup": trigger.props["aria-haspopup"] ?? "menu",
        "aria-expanded": open,
        onClick: (event: ReactMouseEvent<HTMLButtonElement>) => {
          trigger.props.onClick?.(event);
          if (!disabled && !trigger.props.disabled) setOpen((next) => !next);
        },
      })
    : trigger;

  return (
    <div className="relative inline-flex">
      <div ref={mergeRefs(triggerRef)} className="inline-flex">
        {triggerEl}
      </div>
      {open && ready
        ? createPortal(
            <div ref={panelRef} role="menu" style={style} className={`uw-dropdown ${panelClassName}`.trim()}>
              {typeof children === "function" ? children({ close }) : children}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

export function Select({
  value,
  options,
  onChange,
  disabled,
  className = "",
  triggerClassName = "",
  align = "left",
  "aria-label": ariaLabel,
  placeholder,
  variant = "field",
  label,
}: {
  value: string;
  options: ReadonlyArray<string | SelectOption>;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  align?: Align;
  "aria-label"?: string;
  placeholder?: string;
  variant?: SelectVariant;
  label?: string;
}) {
  const listId = useId();
  const items = toOptions(options);
  const selected = items.find((item) => item.id === value);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(value);
  const close = useCallback(() => setOpen(false), []);
  const { triggerRef, panelRef, style, ready } = useMenu(open, close, align);

  useEffect(() => {
    if (open) setActive(value);
  }, [open, value]);

  const enabled = items.filter((item) => !item.disabled);

  function move(delta: number) {
    const index = Math.max(
      0,
      enabled.findIndex((item) => item.id === active),
    );
    const next = enabled[(index + delta + enabled.length) % enabled.length];
    if (next) setActive(next.id);
  }

  function choose(id: string) {
    const item = items.find((entry) => entry.id === id);
    if (!item || item.disabled) return;
    const clearId = items.find((entry) => entry.id === "all")?.id;
    onChange(id === value && clearId && id !== clearId ? clearId : id);
    setOpen(false);
  }

  function onTriggerKey(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
    }
  }

  useEffect(() => {
    if (!open) return;
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        move(1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        move(-1);
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        choose(active);
      } else if (event.key === "Home") {
        event.preventDefault();
        if (enabled[0]) setActive(enabled[0].id);
      } else if (event.key === "End") {
        event.preventDefault();
        if (enabled.at(-1)) setActive(enabled.at(-1)!.id);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active, enabled, open]);

  return (
    <div className={`relative min-w-0 ${variant === "plain" ? "" : "w-full"} ${className}`.trim()}>
      <button
        ref={mergeRefs(triggerRef) as (node: HTMLButtonElement | null) => void}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        aria-label={ariaLabel}
        onClick={() => {
          if (!disabled) setOpen((next) => !next);
        }}
        onKeyDown={onTriggerKey}
        className={`${triggerClass[variant]} ${triggerClassName}`.trim()}
      >
        {variant === "float" && label ? (
          <span className="pointer-events-none absolute top-[6px] left-[15px] text-[10px] leading-[1.4] text-gray-dark">
            {label}
          </span>
        ) : null}
        <span className="min-w-0 flex-1 truncate">{selected?.label || placeholder || ""}</span>
        {variant === "float" ? (
          <span className="pointer-events-none absolute top-1/2 right-md -translate-y-1/2">
            <ChevronDownIcon />
          </span>
        ) : variant === "plain" || variant === "compact" ? null : (
          <ChevronDownIcon />
        )}
      </button>
      {open && ready
        ? createPortal(
            <div
              ref={panelRef}
              id={listId}
              role="listbox"
              style={style}
              className="uw-dropdown"
            >
              {items.map((item) => (
                <DropdownItem
                  key={item.id || item.label}
                  id={`${listId}-${item.id}`}
                  role="option"
                  disabled={item.disabled}
                  selected={item.id === value}
                  active={item.id === active}
                  onClick={() => choose(item.id)}
                >
                  {item.label}
                </DropdownItem>
              ))}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

export function ComboSearch<T extends string>({
  value,
  onChange,
  field,
  onFieldChange,
  options,
  placeholder,
  fields,
}: {
  value: string;
  onChange: (value: string) => void;
  field: T;
  onFieldChange: (field: T) => void;
  options: ReadonlyArray<SelectOption>;
  placeholder?: string;
  fields: ReadonlyArray<SearchChoice<T>>;
}) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const needle = value.trim().toLowerCase();
  const matches = needle
    ? options.filter((option) => option.label.toLowerCase().includes(needle)).slice(0, 8)
    : [];
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");
  const close = useCallback(() => setOpen(false), []);
  const { triggerRef, panelRef, style, ready } = useMenu(open, close, "left", 0, "content");
  const selectedField = fields.find((item) => item.id === field) ?? fields[0];
  const fieldLabel = selectedField?.label ?? "Borrower";
  const inputPlaceholder = placeholder ?? `Search ${fieldLabel.toLowerCase()}`;
  const emptyPrompt = selectedField?.prompt ?? "Search the list";

  useEffect(() => {
    const next = needle
      ? options.find((option) => option.label.toLowerCase().includes(needle))?.id ?? ""
      : "";
    setActive(next);
  }, [needle, options]);

  function choose(id: string) {
    const item = matches.find((entry) => entry.id === id);
    if (!item) return;
    onChange(item.label);
    setOpen(false);
  }

  function changeField(next: T) {
    if (next === field) {
      inputRef.current?.focus();
      return;
    }
    onFieldChange(next);
    if (value) onChange("");
    inputRef.current?.focus();
  }

  function onKey(event: KeyboardEvent<HTMLInputElement>) {
    if (!open) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (!matches.length) return;
    const index = Math.max(0, matches.findIndex((item) => item.id === active));
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive(matches[(index + 1) % matches.length]?.id ?? "");
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive(matches[(index - 1 + matches.length) % matches.length]?.id ?? "");
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (active) choose(active);
    }
  }

  return (
    <div ref={mergeRefs(triggerRef)} className="relative min-w-0 w-full">
      <label className="uw-list-field" onMouseDown={() => setOpen(true)}>
        <SearchIcon />
        <input
          ref={inputRef}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder={inputPlaceholder}
          role="combobox"
          aria-label={selectedField?.aria ?? `Search ${fieldLabel.toLowerCase()}`}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-activedescendant={open && active ? `${listId}-${active}` : undefined}
          className="h-7 min-w-0 flex-1 bg-transparent text-base text-gray-dark outline-none placeholder:text-gray-dark"
        />
        {value ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              onChange("");
              setOpen(true);
            }}
            className="text-gray-medium"
          >
            <CloseIcon />
          </button>
        ) : null}
      </label>
      {open && ready
        ? createPortal(
            <div ref={panelRef} style={style} className="uw-dropdown min-w-[320px]">
              <div className="flex flex-col gap-[6px]">
                <p className="px-xs text-[10px] font-semibold tracking-wide text-gray-medium uppercase">Search in</p>
                <div role="radiogroup" aria-label="Search in" className="flex w-fit overflow-hidden rounded-xs border border-gray-light">
                  {fields.map((item, index) => {
                    const selected = item.id === field;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => changeField(item.id)}
                        className={`px-md py-[6px] text-xs whitespace-nowrap ${
                          selected ? "bg-primary text-white" : "bg-white text-gray-dark hover:bg-gray-lightest"
                        } ${index > 0 ? "border-l border-gray-light" : ""}`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div id={listId} role="listbox" aria-label="Suggestions">
                {matches.map((item) => (
                  <DropdownItem
                    key={item.id}
                    id={`${listId}-${item.id}`}
                    role="option"
                    selected={item.label === value}
                    active={item.id === active}
                    onClick={() => choose(item.id)}
                  >
                    {item.label}
                  </DropdownItem>
                ))}
                {matches.length === 0 ? (
                  <p className="flex min-h-[48px] items-center px-md py-sm text-sm text-gray-medium">
                    {needle ? "No matches" : emptyPrompt}
                  </p>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

export function Combobox({
  value,
  onChange,
  options,
  label,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<string | SelectOption>;
  label: string;
  autoFocus?: boolean;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const items = useMemo(() => toOptions(options), [options]);
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(true);
  const [active, setActive] = useState("");
  const needle = query.trim().toLowerCase();
  const filtering = needle !== value.trim().toLowerCase();
  const matches = filtering
    ? items.filter((item) => item.label.toLowerCase().includes(needle)).slice(0, 12)
    : items.slice(0, 12);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    setActive(matches.find((item) => item.label === value)?.id ?? matches[0]?.id ?? "");
  }, [needle, value, options]);

  useEffect(() => {
    function onPointer(event: globalThis.MouseEvent) {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    }
    const timer = window.setTimeout(() => {
      document.addEventListener("mousedown", onPointer);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  function choose(id: string) {
    const item = items.find((entry) => entry.id === id);
    if (!item) return;
    onChange(item.label);
    setQuery(item.label);
    setOpen(false);
  }

  function onKey(event: KeyboardEvent<HTMLInputElement>) {
    if (!open) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      return;
    }
    if (!matches.length) return;
    const index = Math.max(0, matches.findIndex((item) => item.id === active));
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive(matches[(index + 1) % matches.length]?.id ?? "");
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive(matches[(index - 1 + matches.length) % matches.length]?.id ?? "");
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (active) choose(active);
    }
  }

  return (
    <div ref={rootRef} className="relative min-w-0 w-full">
      <FloatInput
        label={label}
        value={query}
        autoFocus={autoFocus}
        onChange={(next) => {
          setQuery(next);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKey}
      />
      {open ? (
        <div className="uw-dropdown mt-1">
          <div id={listId} role="listbox" aria-label={label}>
            {matches.map((item) => (
              <DropdownItem
                key={item.id}
                id={`${listId}-${item.id}`}
                role="option"
                selected={item.label === value}
                active={item.id === active}
                onClick={() => choose(item.id)}
              >
                {item.label}
              </DropdownItem>
            ))}
            {matches.length === 0 ? (
              <p className="flex min-h-[48px] items-center px-md py-sm text-sm text-gray-medium">
                {needle ? "No matches" : `Search ${label.toLowerCase()}`}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.25 10C1.25 5.16797 5.16797 1.25 10 1.25C14.832 1.25 18.75 5.16797 18.75 10C18.75 14.832 14.832 18.75 10 18.75C5.16797 18.75 1.25 14.832 1.25 10ZM3.75 10L8.75 15L16.25 7.5L14.4922 5.74219L8.75 11.4844L5.50781 8.24219L3.75 10Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden className="shrink-0 text-gray-dark">
      <path d="M9 12l5 5 5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0 text-gray-dark">
      <circle cx="11" cy="11" r="6.25" stroke="currentColor" strokeWidth="1.4" />
      <path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
