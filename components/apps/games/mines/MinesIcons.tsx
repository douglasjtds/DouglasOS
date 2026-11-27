/**
 * Original Mines artwork (stage 12): a round DouglasOS-blue status face, a
 * spiky dark orb for mines and a small pennant flag. Colors come from the
 * Luna tokens through CSS variables, never hardcoded.
 */

export type FaceState = "idle" | "pressing" | "won" | "lost";

const svgProps = { "aria-hidden": true, focusable: false } as const;

export function MinesFace({ state, className }: { state: FaceState; className?: string }) {
  const ink = "var(--color-titlebar-text)";
  return (
    <svg viewBox="0 0 24 24" className={className} {...svgProps}>
      <circle cx="12" cy="12" r="10.5" fill="var(--color-control)" stroke="var(--color-button-border)" />
      <circle cx="9" cy="8" r="5" fill="var(--color-control-highlight)" opacity="0.45" />
      {state === "won" && (
        <>
          {/* Visor-style shades: one rounded bar across both eyes. */}
          <rect x="5.5" y="8" width="13" height="3.6" rx="1.8" fill="var(--color-text)" />
          <path d="M8 15.5 Q12 19 16 15.5" fill="none" stroke={ink} strokeWidth="1.6" strokeLinecap="round" />
        </>
      )}
      {state === "lost" && (
        <>
          <path
            d="M7.2 7.8 l3 3 m0 -3 l-3 3 M13.8 7.8 l3 3 m0 -3 l-3 3"
            stroke={ink}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path d="M8.5 17.5 Q12 14.5 15.5 17.5" fill="none" stroke={ink} strokeWidth="1.6" strokeLinecap="round" />
        </>
      )}
      {state === "pressing" && (
        <>
          <circle cx="8.7" cy="9.3" r="1.7" fill={ink} />
          <circle cx="15.3" cy="9.3" r="1.7" fill={ink} />
          <ellipse cx="12" cy="16" rx="2" ry="2.4" fill={ink} />
        </>
      )}
      {state === "idle" && (
        <>
          <rect x="7.8" y="7.6" width="1.8" height="3.4" rx="0.9" fill={ink} />
          <rect x="14.4" y="7.6" width="1.8" height="3.4" rx="0.9" fill={ink} />
          <path d="M8 14.5 Q12 18 16 14.5" fill="none" stroke={ink} strokeWidth="1.6" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

export function MineIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} {...svgProps}>
      <g stroke="var(--color-text)" strokeWidth="1.4" strokeLinecap="round">
        <path d="M8 1.5v13M1.5 8h13M3.4 3.4l9.2 9.2M12.6 3.4l-9.2 9.2" />
      </g>
      <circle cx="8" cy="8" r="4.6" fill="var(--color-text)" />
      <circle cx="6.5" cy="6.5" r="1.3" fill="var(--color-surface)" />
    </svg>
  );
}

export function FlagIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} {...svgProps}>
      <path d="M5 2.5v10" stroke="var(--color-text)" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M5.6 2.6 L12.5 5.2 L5.6 7.9 Z" fill="var(--color-icon-error)" />
      <path d="M3 13.5h6" stroke="var(--color-text)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** A flag crossed out: shown on wrong flags after a loss. */
export function WrongFlagIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} {...svgProps}>
      <path d="M5 2.5v10" stroke="var(--color-text)" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M5.6 2.6 L12.5 5.2 L5.6 7.9 Z" fill="var(--color-icon-error)" />
      <path d="M3 13.5h6" stroke="var(--color-text)" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M2.5 2.5l11 11M13.5 2.5l-11 11" stroke="var(--color-icon-error)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
