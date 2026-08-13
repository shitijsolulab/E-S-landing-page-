import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Button } from "./primitives";

/**
 * CTA MODAL — every "Run a real submission free", "Book a demo" and
 * "See a sample market plan" CTA sitewide opens a form here instead of
 * navigating. Flows follow the master prompt (SHARED FLOWS).
 */

type Kind = "trial" | "demo" | "sample";

const ROLES = [
  "Producer",
  "Placement specialist",
  "Head of placement",
  "Operations",
  "Principal",
] as const;

const CLASSES = ["Property", "Commercial auto", "Construction", "Other"] as const;

const emailField = z
  .string()
  .trim()
  .min(1, { message: "Work email is required" })
  .email({ message: "Enter a valid work email" })
  .max(255, { message: "Email must be under 255 characters" });

const brokerageField = z
  .string()
  .trim()
  .min(1, { message: "Brokerage name is required" })
  .max(120, { message: "Brokerage name must be under 120 characters" });

const trialSchema = z.object({
  email: emailField,
  brokerage: brokerageField,
  role: z.enum(ROLES, { errorMap: () => ({ message: "Select your role" }) }),
  classes: z.array(z.enum(CLASSES)).min(1, { message: "Select at least one class" }),
});

const demoSchema = z.object({
  email: emailField,
  brokerage: brokerageField,
  role: z.enum(ROLES, { errorMap: () => ({ message: "Select your role" }) }),
  notes: z.string().trim().max(500, { message: "Keep this under 500 characters" }),
});

const sampleSchema = z.object({ email: emailField, brokerage: brokerageField });

const COPY: Record<Kind, { eyebrow: string; title: string; sub: string; cta: string; foot: string }> = {
  trial: {
    eyebrow: "Start your trial",
    title: "Run a real submission through Coverline.",
    sub: "Use a submission you've already placed. 25 submissions. No credit card. Your carrier panel configured for you within 5 business days.",
    cta: "Start the trial →",
    foot: "No countdown starts today — the 14-day clock starts at panel go-live.",
  },
  demo: {
    eyebrow: "Book a demo",
    title: "See Coverline on your own carrier panel.",
    sub: "Thirty minutes with a placement specialist. We'll walk a live submission through the market plan and answer panel-configuration questions.",
    cta: "Request the demo →",
    foot: "We'll confirm a time within one business day.",
  },
  sample: {
    eyebrow: "Sample market plan",
    title: "A completed market plan, on a real trucking submission.",
    sub: "The same ranked market plan your placement team would receive, with citations intact.",
    cta: "Send me the market plan →",
    foot: "One email. No sequence you can't leave.",
  },
};

const STORAGE_KEY = "coverline.cta.draft";

export function openCtaModal(kind: Kind) {
  window.dispatchEvent(new CustomEvent("coverline:cta", { detail: kind }));
}

function detectKind(text: string): Kind | null {
  const t = text.toLowerCase();
  if (t.includes("sample market plan")) return "sample";
  if (t.includes("book a demo")) return "demo";
  if (t.includes("run a real submission")) return "trial";
  return null;
}

export function CtaModal() {
  const [kind, setKind] = useState<Kind | null>(null);
  const [done, setDone] = useState(false);
  const [otherPath, setOtherPath] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [email, setEmail] = useState("");
  const [brokerage, setBrokerage] = useState("");
  const [role, setRole] = useState("");
  const [classes, setClasses] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const panelRef = useRef<HTMLDivElement | null>(null);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);

  /* restore partially-completed state */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const d = JSON.parse(raw) as Record<string, unknown>;
      if (typeof d['email'] === "string") setEmail(d['email']);
      if (typeof d['brokerage'] === "string") setBrokerage(d['brokerage']);
      if (typeof d['role'] === "string") setRole(d['role']);
      if (Array.isArray(d['classes'])) setClasses(d['classes'] as string[]);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!kind || done) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ email, brokerage, role, classes }));
    } catch {
      /* ignore */
    }
  }, [kind, done, email, brokerage, role, classes]);

  const open = useCallback((k: Kind) => {
    setKind(k);
    setDone(false);
    setOtherPath(false);
    setErrors({});
  }, []);

  /* intercept every CTA on the page */
  useEffect(() => {
    const onEvent = (e: Event) => open((e as CustomEvent).detail as Kind);
    window.addEventListener("coverline:cta", onEvent);

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const el = target?.closest("a,button") as HTMLElement | null;
      if (!el || panelRef.current?.contains(el)) return;
      const k = detectKind(el.textContent ?? "");
      if (!k) return;
      e.preventDefault();
      e.stopPropagation();
      open(k);
    };
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("coverline:cta", onEvent);
      document.removeEventListener("click", onClick, true);
    };
  }, [open]);

  useEffect(() => {
    if (!kind) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setKind(null);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const id = window.setTimeout(() => firstFieldRef.current?.focus(), 60);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      window.clearTimeout(id);
    };
  }, [kind]);

  if (!kind) return null;
  const copy = COPY[kind];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    let result;
    if (kind === "trial") result = trialSchema.safeParse({ email, brokerage, role, classes });
    else if (kind === "demo") result = demoSchema.safeParse({ email, brokerage, role, notes });
    else result = sampleSchema.safeParse({ email, brokerage });

    if (!result.success) {
      const next: Record<string, string> = {};
      for (const issue of result.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    if (kind === "trial" && classes.includes("Other")) setOtherPath(true);
    setDone(true);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center overflow-y-auto bg-[color:color-mix(in_oklab,#0A1B3D_55%,transparent)] p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={copy.title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setKind(null);
      }}
    >
      <div
        ref={panelRef}
        className="relative max-h-[92vh] w-full max-w-[560px] overflow-y-auto rounded-t-[14px] border border-hairline bg-white p-6 shadow-tier2 sm:rounded-[14px] sm:p-9"
      >
        <button
          type="button"
          onClick={() => setKind(null)}
          aria-label="Close"
          className="absolute top-4 right-4 min-h-[40px] min-w-[40px] text-[14px] font-medium text-navy-700 hover:text-navy-900"
        >
          Close
        </button>

        {done ? (
          <div>
            <p className="type-eyebrow">{otherPath ? "We'll be in touch" : "Confirmed"}</p>
            {kind === "trial" ? (
              otherPath ? (
                <>
                  <h2 className="type-h3 mt-4">Let's talk before we provision you.</h2>
                  <p className="type-body mt-4">
                    Classes outside Property, Commercial auto and Construction need a short
                    conversation first so your panel is configured correctly. A placement
                    specialist will contact {email} within one business day.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="type-h3 mt-4">You're in.</h2>
                  <p className="type-body mt-4">
                    Two emails are coming to {email}: one to forward your first submission,
                    one to send your carrier appetite guides. Your assigned rep will confirm
                    within one business day, and we'll have your panel ready within 5
                    business days.
                  </p>
                  <p className="type-body-s mt-4">
                    Provisioned, awaiting panel — the 14-day trial clock starts at panel
                    go-live, not today.
                  </p>
                </>
              )
            ) : kind === "demo" ? (
              <>
                <h2 className="type-h3 mt-4">Demo requested.</h2>
                <p className="type-body mt-4">
                  We'll email {email} within one business day with times, and we'll come
                  prepared with your carrier panel in mind.
                </p>
              </>
            ) : (
              <>
                <h2 className="type-h3 mt-4">On its way.</h2>
                <p className="type-body mt-4">
                  The completed market plan is heading to {email}. One email. No sequence
                  you can't leave.
                </p>
              </>
            )}
            <div className="mt-8">
              <Button onClick={() => setKind(null)}>Done</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <p className="type-eyebrow">{copy.eyebrow}</p>
            <h2 className="type-h3 mt-4 pr-16">{copy.title}</h2>
            <p className="type-body-s mt-3">{copy.sub}</p>

            <div className="mt-7 grid gap-5">
              <Field label="Work email" error={errors['email']}>
                <input
                  ref={firstFieldRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={255}
                  autoComplete="email"
                  placeholder="you@brokerage.com"
                  className={inputCls(!!errors['email'])}
                />
              </Field>

              <Field label="Brokerage name" error={errors['brokerage']}>
                <input
                  type="text"
                  value={brokerage}
                  onChange={(e) => setBrokerage(e.target.value)}
                  maxLength={120}
                  autoComplete="organization"
                  placeholder="Your firm"
                  className={inputCls(!!errors['brokerage'])}
                />
              </Field>

              {kind !== "sample" ? (
                <Field label="Your role" error={errors['role']}>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className={inputCls(!!errors['role'])}
                  >
                    <option value="">Select a role</option>
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </Field>
              ) : null}

              {kind === "trial" ? (
                <Field label="Primary classes you place" error={errors['classes']}>
                  <div className="mt-1 grid gap-2 sm:grid-cols-2">
                    {CLASSES.map((c) => {
                      const on = classes.includes(c);
                      return (
                        <label
                          key={c}
                          className={cn(
                            "flex min-h-[44px] cursor-pointer items-center gap-3 rounded-[10px] border px-3 text-[15px] transition-colors duration-150",
                            on
                              ? "border-navy-900 bg-gray-050 text-navy-900"
                              : "border-hairline text-navy-700 hover:bg-gray-050",
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={() =>
                              setClasses((prev) =>
                                prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
                              )
                            }
                            className="h-4 w-4 shrink-0 accent-[color:var(--color-navy-900,#0A1B3D)]"
                          />
                          {c}
                        </label>
                      );
                    })}
                  </div>
                </Field>
              ) : null}

              {kind === "demo" ? (
                <Field label="Anything we should prepare? (optional)" error={errors['notes']}>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    maxLength={500}
                    rows={3}
                    className={cn(inputCls(!!errors['notes']), "h-auto py-3")}
                  />
                </Field>
              ) : null}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button type="submit">
                {copy.cta}
              </Button>
              <span className="type-body-s">{copy.foot}</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function inputCls(error: boolean) {
  return cn(
    "h-[48px] w-full rounded-[10px] border bg-white px-3 text-[15px] text-navy-900 outline-none transition-colors duration-150 focus:border-navy-900",
    error ? "border-[color:#B4231F]" : "border-hairline",
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[13px] font-semibold text-navy-900">{label}</span>
      {children}
      {error ? (
        <span className="mt-1.5 block text-[13px] text-[color:#B4231F]">{error}</span>
      ) : null}
    </label>
  );
}
