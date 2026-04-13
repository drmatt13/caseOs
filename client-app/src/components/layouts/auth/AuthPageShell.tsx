import type { FormEventHandler, ReactNode } from "react";

import { ArrowRight, BrainCircuit, Network, ShieldCheck } from "lucide-react";

type AuthPageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  formId: string;
  submitLabel: string;
  onSubmit: FormEventHandler<HTMLFormElement>;
  children: ReactNode;
  footer: ReactNode;
  helper?: ReactNode;
  status?: ReactNode;
};

type AuthFieldProps = {
  label: string;
  description?: string;
  htmlFor: string;
  children: ReactNode;
};

type AuthBrandPanelProps = {
  className?: string;
};

export const authInputClassName =
  "w-full rounded-2xl border border-black/10 bg-[#fcfbf8] px-3.5 py-2.5 text-sm text-black shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] outline-none transition focus:border-black/25 focus:bg-white focus:ring-2 focus:ring-black/5";

export const AuthField = ({
  label,
  description,
  htmlFor,
  children,
}: AuthFieldProps) => (
  <label className="grid gap-2" htmlFor={htmlFor}>
    <span className="flex flex-col gap-0.5">
      <span className="text-sm font-medium text-black">{label}</span>
      {description ? (
        <span className="text-xs text-black/60">{description}</span>
      ) : null}
    </span>
    {children}
  </label>
);

export const AuthBrandPanel = ({ className = "" }: AuthBrandPanelProps) => (
  <section
    className={[
      "flex flex-col justify-between rounded-4xl border border-black/10 bg-[#182024]/94 px-6 py-6 text-white shadow-[0_24px_80px_rgba(28,35,39,0.16)] sm:px-8 sm:py-7 lg:px-9",
      className,
    ]
      .filter(Boolean)
      .join(" ")}
  >
    <div className="space-y-5">
      <div className="space-y-2.5">
        <div className="inline-flex items-center rounded-full border border-white/12 bg-white/7 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/70">
          Agent-Driven Case Management
        </div>

        <div className="space-y-2">
          <p className="text-4xl font-bj-cree tracking-[0.01em] sm:text-[2.8rem]">
            CaseOS
          </p>
          <p className="max-w-2xl text-[1.45rem] font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-[1.72rem]">
            A living case workspace that keeps strategy, facts, posture, and
            evidence in sync.
          </p>
          <p className="max-w-2xl text-sm leading-6 text-white/70 sm:text-[0.94rem]">
            CaseOS turns fragmented intake details, documents, facts, arguments,
            timelines, tasks, and testimony into a persistent operating system
            for legal work. Agents continuously extract, organize, and update
            what matters so the workspace reflects the actual state of the case
            over time.
          </p>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="rounded-3xl border border-white/10 bg-white/6 p-5">
          <BrainCircuit className="h-4.5 w-4.5 text-mist-300" />
          <p className="mt-3 text-sm font-semibold tracking-[-0.01em]">
            Structured from intake forward
          </p>
          <p className="mt-1.5 text-sm leading-5 text-white/63">
            Documents and intake become organized facts, issues, timelines, and
            argument state instead of isolated notes.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/6 p-5">
          <Network className="h-4.5 w-4.5 text-mist-300" />
          <p className="mt-3 text-sm font-semibold tracking-[-0.01em]">
            Linked case intelligence
          </p>
          <p className="mt-1.5 text-sm leading-5 text-white/63">
            Workspace records stay connected as posture changes, keeping the
            active matter readable and current.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] px-5 py-4 lg:col-span-2">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-4.5 w-4.5 text-mist-300" />
            <div className="space-y-1.5">
              <p className="text-sm font-semibold tracking-[-0.01em]">
                Built for high-context matters
              </p>
              <p className="max-w-2xl text-sm leading-5 text-white/64">
                Designed for legal work where continuity, context, and a
                trustworthy current source of truth matter more than generic
                workflow software.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const AuthPageShell = ({
  eyebrow,
  title,
  description,
  formId,
  submitLabel,
  onSubmit,
  children,
  footer,
  helper,
  status,
}: AuthPageShellProps) => {
  return (
    <div className="font-geist relative flex min-h-dvh items-center justify-center overflow-x-hidden overflow-y-auto bg-[radial-gradient(circle_at_top_left,#eef3f2_0%,#f6f1e8_42%,#f4f4f1_72%,#eef1f0_100%)] px-4 py-5 sm:px-6 sm:py-6 md:h-dvh md:overflow-hidden lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(31,37,40,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(31,37,40,0.03)_1px,transparent_1px)] bg-size-[72px_72px]" />
        <div className="absolute left-[8%] top-[10%] h-56 w-56 rounded-full bg-mist-300/40 blur-3xl" />
        <div className="absolute bottom-[8%] right-[10%] h-72 w-72 rounded-full bg-[#ddd0bc]/55 blur-3xl" />
      </div>

      <div className="relative grid w-full max-w-7xl items-stretch gap-4 md:h-[calc(100dvh-3rem)] md:max-h-230 md:grid-cols-[1.22fr_0.78fr] lg:gap-5">
        <AuthBrandPanel className="order-2 md:order-1 md:h-full md:overflow-hidden" />

        <section className="order-1 rounded-4xl border border-black/10 bg-[rgba(255,252,247,0.95)] px-5 py-5 shadow-[0_24px_80px_rgba(28,35,39,0.12)] backdrop-blur sm:px-6 sm:py-6 md:order-2 md:h-full md:overflow-hidden lg:px-7">
          <form
            className="flex h-full flex-col justify-between"
            id={formId}
            onSubmit={onSubmit}
          >
            <div>
              <div className="space-y-3">
                <div className="inline-flex items-center rounded-full border border-black/8 bg-white/80 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-black/55">
                  {eyebrow}
                </div>

                <div className="space-y-2">
                  <h1 className="text-[1.8rem] font-semibold tracking-[-0.04em] text-black sm:text-[2.05rem]">
                    {title}
                  </h1>
                  <p className="max-w-lg text-sm leading-6 text-black/64 sm:text-[0.94rem]">
                    {description}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3.5">{children}</div>

              {status ? (
                <div className="mt-3.5 rounded-[1.3rem] border border-[#d6c8b5] bg-[#f4ebe0] px-4 py-3 text-sm leading-5 text-black/70">
                  {status}
                </div>
              ) : null}
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-black/8 pt-4">
              <button
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#20292d] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-black/35"
                type="submit"
              >
                <span>{submitLabel}</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              {helper ? (
                <div className="text-sm leading-6 text-black/62">{helper}</div>
              ) : null}
              <div className="text-sm leading-6 text-black/68">{footer}</div>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default AuthPageShell;
