import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Container } from "./primitives";
import { Logo } from "./Logo";

const NAV = [
  ["problem", "Problem"],
  ["how-it-works", "How it works"],
  ["market-plan", "Market plan"],
  ["your-panel", "Your panel"],
  ["placement", "Placement"],
  ["trial", "Trial"],
  ["pricing", "Pricing"],
  ["results", "Results"],
] as const;

export function ScrollProgressBar() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const on = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setPct(max > 0 ? (h.scrollTop / max) * 100 : 0);
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <div
      className="fixed top-0 left-0 z-[60] h-0.5 bg-blue-500"
      style={{ width: `${pct}%` }}
      aria-hidden
    />
  );
}

export function Header() {
  const [active, setActive] = useState<string>("");
  const [pastHero, setPastHero] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-96px 0px -60% 0px", threshold: 0 },
    );
    for (const [id] of NAV) {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    }
    const on = () => setPastHero(window.scrollY > 520);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", on);
    };
  }, []);

  return (
    <>
      <ScrollProgressBar />
      <header className="sticky top-0 z-50 border-b border-hairline bg-[color:color-mix(in_oklab,white_88%,transparent)] backdrop-blur">
        <Container
          className={cn(
            "flex items-center justify-between gap-6 transition-[height] duration-300 ease-[var(--ease-standard)]",
            pastHero ? "h-[60px]" : "h-[76px]",
          )}
        >
          <a href="#top" aria-label="Coverline home" className="shrink-0">
            <span
              className={cn(
                "block origin-left transition-transform duration-300 ease-[var(--ease-standard)]",
                pastHero ? "scale-[0.88]" : "scale-100",
              )}
            >
              <Logo />
            </span>
          </a>

          <nav aria-label="Section navigation" className="hidden flex-1 xl:block">

            <ul className="flex items-center justify-center gap-5">
              {NAV.map(([id, label]) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className={cn(
                      "relative py-2 text-[13px] font-medium transition-colors duration-150",
                      active === id ? "text-blue-500" : "text-navy-700 hover:text-navy-900",
                    )}
                  >
                    {label}
                    <span
                      className={cn(
                        "absolute right-0 -bottom-0.5 left-0 h-px origin-left bg-blue-500 transition-transform duration-300 ease-[var(--ease-standard)]",
                        active === id ? "scale-x-100" : "scale-x-0",
                      )}
                    />
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="hidden shrink-0 items-center gap-3 lg:flex">
            <a
              href="#final-cta"
              className="inline-flex min-h-[44px] items-center rounded-[10px] border-[1.5px] border-navy-900 px-4 text-[14px] font-semibold text-navy-900 transition-colors duration-150 hover:bg-gray-100"
            >
              Book a demo
            </a>
            <a
              href="#final-cta"
              className={cn(
                "inline-flex min-h-[44px] items-center rounded-[10px] bg-navy-900 px-4 text-[14px] font-semibold text-white transition-all duration-150 hover:bg-navy-950",
                pastHero ? "opacity-100" : "pointer-events-none opacity-0",
              )}
            >
              Run a real submission free
            </a>
          </div>

          <button
            type="button"
            aria-expanded={menu}
            onClick={() => setMenu((m) => !m)}
            className="min-h-[44px] px-2 text-[14px] font-semibold text-navy-900 lg:hidden"
          >
            {menu ? "Close" : "Menu"}
          </button>
        </Container>

        {menu ? (
          <nav className="border-t border-hairline bg-white lg:hidden" aria-label="Mobile">
            <Container className="grid gap-1 py-4">
              {NAV.map(([id, label]) => (
                <a
                  key={id}
                  href={`#${id}`}
                  onClick={() => setMenu(false)}
                  className="flex min-h-[44px] items-center text-[15px] font-medium text-navy-900"
                >
                  {label}
                </a>
              ))}
            </Container>
          </nav>
        ) : null}
      </header>

      {/* mobile sticky bottom bar */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex gap-3 border-t border-hairline bg-white px-5 py-3 transition-all duration-300 ease-[var(--ease-standard)] lg:hidden",
          pastHero ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
        )}
      >
        <a
          href="#final-cta"
          className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-[10px] bg-navy-900 px-4 text-[14px] font-semibold text-white"
        >
          Run a real submission free
        </a>
        <a
          href="#market-plan"
          className="inline-flex min-h-[48px] items-center justify-center px-2 text-[14px] font-medium text-navy-700 underline-offset-4 hover:underline"
        >
          Sample market plan
        </a>
      </div>
    </>
  );
}
