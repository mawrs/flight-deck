const LINKS = [
  "Privacy Policy",
  "USA PATRIOT Act",
  "Notices",
  "Contact Us",
  "Terms and Conditions",
  "FAQ",
];

export function SiteFooter() {
  return (
    <footer className="flex shrink-0 flex-wrap items-center justify-between gap-md border-t border-gray-light bg-gray-lightest px-lg py-md">
      <p className="text-sm font-semibold text-gray-dark">12700 Kingston Pike, Knoxville, TN 37934</p>
      <nav className="flex flex-wrap items-center justify-center gap-[30px]">
        {LINKS.map((label) => (
          <span key={label} className="text-sm font-semibold text-gray-dark">
            {label}
          </span>
        ))}
      </nav>
      <p className="text-sm font-semibold text-gray-dark">© SouthEast Bank. All rights reserved</p>
    </footer>
  );
}
