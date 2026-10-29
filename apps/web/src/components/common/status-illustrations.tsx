import type { CSSProperties } from 'react';

/**
 * Illustrations of the 404 and error pages (see `StatusScene`). Drawn with theme colours only; the
 * motion is plain CSS (`scene-*` in globals.css) and switches off for visitors who prefer reduced
 * motion, leaving a calm still picture.
 */

/** Electron orbits: the tilt of each ellipse and how long one lap takes. */
const ORBITS = [
  { angle: 0, lap: '3.2s' },
  { angle: 60, lap: '4.4s' },
  { angle: 120, lap: '3.8s' },
] as const;

const ORBIT_RX = 62;
const ORBIT_RY = 24;

/** "4 (atom) 4": the zero is an atom whose electrons keep circling, as if still looking for the page. */
export function NotFoundIllustration() {
  return (
    <div
      aria-hidden
      className="flex items-center justify-center text-[clamp(5.5rem,24vw,10.5rem)] leading-none font-bold"
    >
      <span className="scene-drop text-primary" style={{ '--d': '0ms' } as CSSProperties}>
        4
      </span>
      <svg viewBox="0 0 160 160" className="size-[0.85em] shrink-0 overflow-visible">
        <circle cx="80" cy="80" r="24" className="scene-breathe fill-primary/20" />
        {ORBITS.map(({ angle, lap }) => (
          <g key={angle} transform={`rotate(${angle} 80 80)`}>
            <ellipse
              cx="80"
              cy="80"
              rx={ORBIT_RX}
              ry={ORBIT_RY}
              fill="none"
              strokeWidth="2.5"
              className="stroke-accent-blue/45"
            />
            <g className="scene-orbit-x" style={{ '--r': ORBIT_RX, '--t': lap } as CSSProperties}>
              <g className="scene-orbit-y" style={{ '--r': ORBIT_RY, '--t': lap } as CSSProperties}>
                <circle cx="80" cy="80" r="6" className="fill-accent-blue" />
              </g>
            </g>
          </g>
        ))}
        <circle cx="80" cy="80" r="13" className="fill-primary" />
        <circle cx="75" cy="75" r="4" className="fill-primary-foreground/60" />
      </svg>
      <span className="scene-drop text-primary" style={{ '--d': '160ms' } as CSSProperties}>
        4
      </span>
    </div>
  );
}

/**
 * Three atoms in a row. The current runs along the left bond, but the right one is broken: a spark
 * flickers in the gap and the detached atom wobbles.
 */
export function ErrorIllustration() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 320 140"
      className="h-auto w-full max-w-sm overflow-visible"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g className="scene-drop" style={{ '--d': '0ms' } as CSSProperties}>
        {/* Bonds */}
        <line
          x1="62"
          y1="70"
          x2="150"
          y2="70"
          strokeWidth="8"
          className="stroke-muted-foreground/35"
        />
        <line
          x1="62"
          y1="70"
          x2="150"
          y2="70"
          strokeWidth="8"
          pathLength="100"
          className="scene-flow stroke-primary"
        />
        <line
          x1="174"
          y1="70"
          x2="200"
          y2="70"
          strokeWidth="8"
          className="stroke-muted-foreground/35"
        />
        <line
          x1="232"
          y1="70"
          x2="250"
          y2="70"
          strokeWidth="8"
          className="stroke-muted-foreground/35"
        />

        {/* The spark in the gap */}
        <g className="scene-spark">
          <path d="M219 44 L209 72 L222 72 L212 98" strokeWidth="5" className="stroke-primary" />
        </g>
        {[
          { dx: -16, dy: -22, d: '0ms' },
          { dx: 18, dy: -26, d: '120ms' },
          { dx: -20, dy: 24, d: '240ms' },
          { dx: 22, dy: 20, d: '60ms' },
        ].map(({ dx, dy, d }) => (
          <circle
            key={`${dx}${dy}`}
            cx="216"
            cy="70"
            r="3"
            className="scene-fizz fill-primary"
            style={{ '--dx': `${dx}px`, '--dy': `${dy}px`, '--d': d } as CSSProperties}
          />
        ))}

        {/* Atoms */}
        <circle cx="40" cy="70" r="26" className="scene-breathe fill-accent-blue/20" />
        <circle cx="40" cy="70" r="22" className="fill-accent-blue" />
        <circle cx="33" cy="62" r="6" className="fill-primary-foreground/50" />

        <circle cx="160" cy="70" r="26" className="fill-primary/20" />
        <circle cx="160" cy="70" r="22" className="fill-primary" />
        <circle cx="153" cy="62" r="6" className="fill-primary-foreground/50" />

        <g className="scene-wobble">
          <circle cx="276" cy="70" r="22" className="fill-accent-blue" />
          <circle cx="269" cy="62" r="6" className="fill-primary-foreground/50" />
        </g>
      </g>
    </svg>
  );
}
