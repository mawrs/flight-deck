import { Divider } from "./Divider";
import styles from "./FooterDisclaimer.module.css";

const links = [
  { href: "#privacy", label: "Privacy Policy" },
  { href: "#contact", label: "Contact Us" },
  { href: "#patriot-act", label: "Patriot Act" },
];

export function FooterDisclaimer() {
  return (
    <footer className={styles.footer}>
      <nav className={styles.links} aria-label="Legal">
        {links.map((link, index) => (
          <span key={link.href} className={styles.linkItem}>
            {index > 0 ? <Divider orientation="vertical" /> : null}
            <a href={link.href}>{link.label}</a>
          </span>
        ))}
      </nav>
      <p className={styles.meta}>
        <span>Site is secured using 256-bit SSL encryption.</span>
        <span>2025 SouthEast Bank. All rights reserves.</span>
      </p>
    </footer>
  );
}
