import logo from "../assets/logo.png";

const sizeClasses = {
  sidebar: "h-10 w-10 sm:h-11 sm:w-11",
  hero: "h-12 w-12 sm:h-[3.5rem] sm:w-[3.5rem]",
};

export default function BrandLogo({
  size = "sidebar",
  align = "center",
  showTagline = true,
  stackOnMobile = false,
  className = "",
}) {
  const logoSizeClass = sizeClasses[size] ?? sizeClasses.sidebar;
  const titleClassName =
    size === "hero"
      ? "text-[clamp(2rem,6vw,3.1rem)] leading-[0.98] tracking-tight"
      : "text-base";
  const taglineClassName =
    size === "hero"
      ? "mt-1.5 text-sm leading-tight sm:text-base"
      : "text-xs";
  const alignmentClass = align === "start" ? "items-start" : "items-center";
  const layoutClass = stackOnMobile ? "flex-col sm:flex-row" : "flex-row";
  const titleOverflowClass = size === "hero" ? "whitespace-normal" : "truncate";
  const taglineOverflowClass =
    size === "hero" ? "whitespace-normal" : "truncate";

  return (
    <div
      className={`flex min-w-0 max-w-full gap-3 ${layoutClass} ${alignmentClass} ${className}`.trim()}
    >
      <img
        alt="LedgerView logo"
        className={`${logoSizeClass} shrink-0 object-contain drop-shadow-[0_14px_24px_rgba(30,35,65,0.12)]`}
        src={logo}
      />

      <div className="min-w-0">
        <p
          className={`${titleOverflowClass} font-semibold text-[var(--finova-text)] ${titleClassName}`.trim()}
        >
          LedgerView
        </p>

        {showTagline ? (
          <p
            className={`${taglineOverflowClass} text-[var(--finova-muted)] ${taglineClassName}`.trim()}
          >
            Smart finance workspace
          </p>
        ) : null}
      </div>
    </div>
  );
}
