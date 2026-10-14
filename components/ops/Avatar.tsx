import styles from "./avatar.module.css";

const COLORS = ["#3d6b8c", "#c46b3a", "#6b5344", "#5d7a86", "#8a6232", "#3f7a78", "#4f6b4a", "#8a5a6a"];

function hashName(name: string) {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) hash = (hash * 33 + name.charCodeAt(index)) >>> 0;
  return hash;
}

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const hash = hashName(name.trim() || "?");
  const color = COLORS[hash % COLORS.length];
  const Animal = ANIMALS[hash % ANIMALS.length];

  return (
    <span className={styles.avatar} style={{ width: size, height: size, background: color }} aria-hidden>
      <Animal />
    </span>
  );
}

const ANIMALS = [Owl, Fox, Bear, Rabbit, Deer, Bird, Turtle, Cat];

function Owl() {
  return (
    <svg viewBox="0 0 32 32">
      <path
        fill="currentColor"
        d="M9.2 15.2 12.4 7l1.8 6.2L16 6.2l1.8 7L19.6 7l3.2 8.2A8.2 8.2 0 0 1 16 28a8.2 8.2 0 0 1-6.8-12.8Z"
      />
    </svg>
  );
}

function Fox() {
  return (
    <svg viewBox="0 0 32 32">
      <path fill="currentColor" d="M7 12.5 11.5 5l3 6.5L16 8l1.5 3.5L20.5 5 25 12.5 22 22.5 16 26l-6-3.5L7 12.5Z" />
    </svg>
  );
}

function Bear() {
  return (
    <svg viewBox="0 0 32 32">
      <circle cx="9" cy="10" r="3.2" fill="currentColor" />
      <circle cx="23" cy="10" r="3.2" fill="currentColor" />
      <circle cx="16" cy="18" r="8" fill="currentColor" />
    </svg>
  );
}

function Rabbit() {
  return (
    <svg viewBox="0 0 32 32">
      <path fill="currentColor" d="M11 14c0-6 1.6-10 2.6-10S16 8 16 14c0-6 1.4-10 2.4-10S21 8 21 14a7 7 0 1 1-10 0Z" />
    </svg>
  );
}

function Deer() {
  return (
    <svg viewBox="0 0 32 32">
      <path
        fill="currentColor"
        d="M8 8.5 10 4l1.2 4.2L12.5 5l.6 4.4L16 6l.8 4.2L19 5.2l.8 4.6L22 4.8 23.2 9A7.2 7.2 0 1 1 8.8 9L8 8.5Z"
      />
    </svg>
  );
}

function Bird() {
  return (
    <svg viewBox="0 0 32 32">
      <path fill="currentColor" d="M6 18c4-1 7-5 9-9 3 2 8 3 11 2-2 2-2 4-1 6 3 0 5 2 5 4H14c-3 2-6 2-8-3Z" />
    </svg>
  );
}

function Turtle() {
  return (
    <svg viewBox="0 0 32 32">
      <ellipse cx="16" cy="18" rx="8" ry="6" fill="currentColor" />
      <circle cx="25" cy="16" r="2.4" fill="currentColor" />
      <path fill="currentColor" d="M8 16h3M9 22h3M20 12l2-3M12 12l-2-3M20 24l2 3M12 24l-2 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Cat() {
  return (
    <svg viewBox="0 0 32 32">
      <path fill="currentColor" d="M8 13 10.5 6l3 6 2.5-4 2.5 4 3-6L24 13a7 7 0 1 1-16 0Z" />
    </svg>
  );
}
