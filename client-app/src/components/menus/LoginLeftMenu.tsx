import {
  FileSearchIcon,
  FileCheck2Icon,
  BriefcaseBusinessIcon,
  LandmarkIcon,
  LockKeyholeIcon,
  LightbulbIcon,
  ScaleIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
  UsersRoundIcon,
} from "lucide-react";

const connectorClassName =
  "h-full w-8 shrink-0 overflow-visible text-slate-400/80 [--arrow-stroke:1.5]";

const SplitConnector = () => (
  <svg
    className={connectorClassName}
    viewBox="0 0 32 220"
    fill="none"
    aria-hidden="true"
  >
    <defs>
      <marker
        id="split-arrow"
        markerWidth="4.5"
        markerHeight="4.5"
        refX="4"
        refY="2.25"
        orient="auto"
      >
        <path d="M0 0L4.5 2.25L0 4.5Z" fill="currentColor" />
      </marker>
    </defs>
    <path
      d="M0 110H9Q13 110 13 106V50Q13 46 17 46H31"
      stroke="currentColor"
      strokeWidth="var(--arrow-stroke)"
      markerEnd="url(#split-arrow)"
    />
    <path
      d="M0 110H9Q13 110 13 114V170Q13 174 17 174H31"
      stroke="currentColor"
      strokeWidth="var(--arrow-stroke)"
      markerEnd="url(#split-arrow)"
    />
  </svg>
);

const ParallelConnector = () => (
  <svg
    className={connectorClassName}
    viewBox="0 0 32 220"
    fill="none"
    aria-hidden="true"
  >
    <defs>
      <marker
        id="parallel-arrow"
        markerWidth="4.5"
        markerHeight="4.5"
        refX="4"
        refY="2.25"
        orient="auto"
      >
        <path d="M0 0L4.5 2.25L0 4.5Z" fill="currentColor" />
      </marker>
    </defs>
    <path
      d="M0 46H31"
      stroke="currentColor"
      strokeWidth="var(--arrow-stroke)"
      markerEnd="url(#parallel-arrow)"
    />
    <path
      d="M0 174H31"
      stroke="currentColor"
      strokeWidth="var(--arrow-stroke)"
      markerEnd="url(#parallel-arrow)"
    />
  </svg>
);

const MergeConnector = () => (
  <svg
    className={connectorClassName}
    viewBox="0 0 32 220"
    fill="none"
    aria-hidden="true"
  >
    <defs>
      <marker
        id="merge-arrow"
        markerWidth="4.5"
        markerHeight="4.5"
        refX="4"
        refY="2.25"
        orient="auto"
      >
        <path d="M0 0L4.5 2.25L0 4.5Z" fill="currentColor" />
      </marker>
    </defs>
    <path
      d="M0 46H15Q19 46 19 50V106Q19 110 23 110H31"
      stroke="currentColor"
      strokeWidth="var(--arrow-stroke)"
      markerEnd="url(#merge-arrow)"
    />
    <path
      d="M0 174H15Q19 174 19 170V114Q19 110 23 110H31"
      stroke="currentColor"
      strokeWidth="var(--arrow-stroke)"
      markerEnd="url(#merge-arrow)"
    />
  </svg>
);

const LoginLeftMenu = () => {
  return (
    <div className="flex-1 flex flex-col gap-1 justify-start">
      <div className="flex flex-col gap-1 h-14 -translate-y-2.5">
        <p className="text-4xl /font-noto-serif-jp font-bj-cree -translate-x-0.5">
          CaseOS
        </p>
        <p className="text-[.8rem] font-inconsolata -translate-y-0.5 translate-x-px">
          Structured case intelligence, built for real cases.
        </p>
      </div>
      <div className="w-full /bg-black/10 grid grid-cols-2 gap-4">
        <div className="w-full h-52 p-4 border rounded-2xl bg-white/40 backdrop-blur-sm border-black/15 shadow-md">
          <div className="flex flex-row-reverse gap-4 items-start h-full">
            {/* content */}
            {/* LEFT */}
            <div className="flex-1 h-full flex justify-center items-center">
              <div className="w-full h-full p-2 opacity-80">
                <img
                  // fit
                  className="object-contain w-full h-full"
                  src="/d9a8f907-592a-4a6c-afdf-3d81f8c1aaee.png"
                  alt=""
                />
              </div>
            </div>
            {/* LEFT */}
            {/* RIGHT */}
            <div className="flex flex-col w-36 h-full items-start">
              <div className="flex flex-col flex-1">
                <p className="text-sm font-medium">
                  Structured Case Intelligence
                </p>
                <div className="flex-1 flex flex-col gap-1 justify-start text-xs text-gray-600 mt-1.5">
                  <p>
                    CaseOS helps you create and connect structured records from
                    facts, issues, and claims as they evolve to surface relevant
                    context across your cases.
                  </p>
                </div>
              </div>
              <div className="text-[.625rem] flex px-2.5 py-1 justify-start items-center bg-blue-200/50 text-blue-500 rounded-full -translate-x-1 translate-y-1.5">
                <div>Facts</div>
                <div className="px-1 text-[.6rem]">•</div>
                <div>Issues</div>
                <div className="px-1 text-[.6rem]">•</div>
                <div>Claims</div>
              </div>
            </div>
            {/* RIGHT */}
            {/* content */}
          </div>
        </div>
        <div className="w-full h-52 p-4 border rounded-2xl bg-white/40 backdrop-blur-sm border-black/15 shadow-md">
          <div className="flex flex-row-reverse gap-4 items-start h-full">
            {/* content */}
            {/* LEFT */}
            <div className="flex-1 h-full flex">
              <div className="h-full flex flex-col">
                <div className="w-4 h-2 flex justify-center">
                  <div className="w-0.5 h-full bg-blue-200" />
                </div>
                <div className="w-4 h-4 bg-blue-200 rounded-full flex justify-center items-center">
                  <div className="w-2 h-2 bg-white rounded-full border-2 border-blue-400" />
                </div>
                <div className="flex-1 w-4 flex justify-center">
                  <div className="w-0.5 h-full bg-blue-200" />
                </div>
                <div className="w-4 h-4 bg-blue-200 rounded-full flex justify-center items-center">
                  <div className="w-2 h-2 bg-white rounded-full border-2 border-blue-400" />
                </div>
                <div className="flex-1 w-4 flex justify-center">
                  <div className="w-0.5 h-full bg-blue-200" />
                </div>
                <div className="w-4 h-4 bg-blue-200 rounded-full flex justify-center items-center">
                  <div className="w-2 h-2 bg-white rounded-full border-2 border-blue-400" />
                </div>
                <div className="flex-1 w-4 flex justify-center">
                  <div className="w-0.5 h-full bg-blue-200" />
                </div>
                <div className="w-4 h-4 bg-blue-200 rounded-full flex justify-center items-center">
                  <div className="w-2 h-2 bg-white rounded-full border-2 border-blue-400" />
                </div>
                <div className="w-4 h-2 flex justify-center">
                  <div className="w-0.5 h-full bg-blue-200" />
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-start items-start text-[.7rem] pl-1.5">
                <div className="h-2 w-full" />
                <div className="flex-1 flex flex-col -translate-y-0.5">
                  <p>Complaint Filed</p>
                  <p className="text-gray-600 text-[.6rem]">Jan 12, 2024</p>
                </div>
                <div className="flex-1 flex flex-col -translate-y-0.5">
                  <p>Discovery Requests</p>
                  <p className="text-gray-600 text-[.6rem]">Feb 03, 2024</p>
                </div>
                <div className="flex-1 flex flex-col -translate-y-0.5">
                  <p>Motion to Dismiss</p>
                  <p className="text-gray-600 text-[.6rem]">Mar 18, 2024</p>
                </div>
                <div className="h-6 flex flex-col -translate-y-0.5">
                  <p>Hearing</p>
                  <p className="text-gray-600 text-[.6rem]">Apr 22, 2024</p>
                </div>
              </div>
            </div>
            {/* LEFT */}
            {/* RIGHT */}
            <div className="flex flex-col w-36 h-full items-start">
              <div className="flex flex-col flex-1">
                <p className="text-sm font-medium">
                  Timeline That Builds Itself
                </p>
                <div className="flex-1 flex flex-col gap-1 justify-start text-xs text-gray-600 mt-1.5">
                  <p>
                    Documents, events, and filings are automatically organized
                    in context.
                  </p>
                  <p>
                    Track what has happened, what matters now, and how things
                    are unfolding.
                  </p>
                </div>
              </div>
              <div className="text-[.625rem] flex px-2.5 py-1 justify-start items-center bg-blue-200/50 text-blue-500 rounded-full -translate-x-1 translate-y-1.5">
                <div>Events</div>
                <div className="px-1 text-[.6rem]">•</div>
                <div>Dates</div>
                <div className="px-1 text-[.6rem]">•</div>
                <div>Filings</div>
              </div>
            </div>
            {/* RIGHT */}
            {/* content */}
          </div>
        </div>
        <div className="w-full h-52 p-4 border rounded-2xl bg-white/40 backdrop-blur-sm border-black/15 shadow-md col-span-2">
          <div className="flex flex-row-reverse gap-4 items-start h-full text-[.6rem]">
            {/* content */}
            {/* LEFT */}
            <div className="flex-1 h-full flex text-center pl-2 py-1">
              <div className="flex-1 flex flex-col justify-center">
                <div className="w-full h-16 rounded-xl bg-sky-100/50 flex flex-col text-sky-700/80 justify-center items-center gap-1 px-2 border border-blue-300/60">
                  <ScaleIcon className="h-5 w-5" strokeWidth={1.5} />
                  <p className="font-semibold text-blue-950/75">Legal Issues</p>
                </div>
              </div>
              <SplitConnector />
              <div className="flex-1 flex flex-col justify-between">
                <div className="w-full h-16 rounded-xl bg-emerald-100/50 flex flex-col text-emerald-700 justify-center items-center gap-1 px-2 border border-green-300/60">
                  <FileCheck2Icon className="h-5 w-5" strokeWidth={1.5} />
                  <p className="font-semibold text-emerald-950/75">Key Facts</p>
                </div>

                <div className="w-full h-16 rounded-xl bg-rose-100/50 flex flex-col text-rose-800/70 justify-center items-center gap-1 px-2 border border-red-300/60">
                  <TriangleAlertIcon className="h-5 w-5" strokeWidth={1.5} />
                  <p className="font-semibold text-rose-900/80 grayscale-25">
                    Challenges & Risks
                  </p>
                </div>
              </div>
              <ParallelConnector />
              <div className="flex-1 flex flex-col justify-between">
                <div className="w-full h-16 rounded-xl bg-violet-100/50 flex flex-col text-violet-700/90 justify-center items-center gap-1 px-2 border border-violet-300/60">
                  <LandmarkIcon
                    className="h-5 w-5 grayscale-10"
                    strokeWidth={1.5}
                  />
                  <p className="font-semibold text-violet-950/75">
                    Relevant Precedent
                  </p>
                </div>
                <div className="w-full h-16 rounded-2xl bg-gray-200/50 flex flex-col text-gray-700 justify-center items-center gap-1 px-2 border border-gray-300/60">
                  <FileSearchIcon className="h-5 w-5" strokeWidth={1.5} />
                  <p className="font-semibold text-gray-950/75">
                    Supporting Evidence
                  </p>
                </div>
              </div>
              <MergeConnector />
              <div className="flex-1 flex flex-col justify-center">
                <div className="w-full h-16 rounded-xl bg-amber-100/50 flex flex-col text-amber-700 justify-center items-center gap-1 px-2 border border-yellow-300/60">
                  <LightbulbIcon className="h-5 w-5" strokeWidth={1.5} />
                  <p className="font-semibold text-amber-950/75">
                    Strategic Insights
                  </p>
                </div>
              </div>
            </div>
            {/* LEFT */}
            {/* RIGHT */}
            <div className="flex flex-col w-36 h-full items-start">
              <div className="flex flex-col flex-1">
                <p className="text-sm font-medium">
                  AI That Understands Your Case
                </p>
                <div className="flex-1 flex flex-col gap-1 justify-start text-xs text-gray-600 mt-1.5">
                  <p>
                    CaseOS links facts, issues, evidence, and precedent through
                    its contextual reasoning system to uncover material insights
                    across your cases.
                  </p>
                </div>
              </div>
              <div className="text-[.625rem] flex px-2.5 py-1 justify-start items-center bg-blue-200/50 text-blue-500 rounded-full -translate-x-1 translate-y-1.5">
                <div>Analyze</div>
                <div className="px-1 text-[.6rem]">•</div>
                <div>Link</div>
                <div className="px-1 text-[.6rem]">•</div>
                <div>Organize</div>
                <div className="px-1 text-[.6rem]">•</div>
                <div>Understand</div>
              </div>
            </div>
            {/* RIGHT */}
            {/* content */}
          </div>
        </div>
      </div>
      <div className="mt-3.5 w-full flex flex-row justify-between gap-6">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <BriefcaseBusinessIcon
            className="mt-0.5 h-6 w-6 shrink-0 text-blue-500"
            strokeWidth={1.5}
          />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-900">
              Built for Legal Work
            </p>
            <p className="mt-0.75 text-[.68rem] leading-snug text-gray-600">
              Matches how you build cases, linking facts, issues, evidence, and
              arguments together.
            </p>
          </div>
        </div>
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <ShieldCheckIcon
            className="mt-0.5 h-6 w-6 shrink-0 text-blue-500"
            strokeWidth={1.5}
          />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-900">
              Fully Traceable
            </p>
            <p className="mt-0.75 text-[.68rem] leading-snug text-gray-600">
              Every record links to its source and connects through your case,
              so nothing is assumed.
            </p>
          </div>
        </div>
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <UsersRoundIcon
            className="mt-0.5 h-6 w-6 shrink-0 text-blue-500"
            strokeWidth={1.5}
          />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-900">Work Together</p>
            <p className="mt-0.75 text-[.68rem] leading-snug text-gray-600">
              Invite your team into shared workspaces to build and reason across
              cases together.
            </p>
          </div>
        </div>
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <LockKeyholeIcon
            className="mt-0.5 h-6 w-6 shrink-0 text-blue-500"
            strokeWidth={1.5}
          />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-900">
              Private & Secure
            </p>
            <p className="mt-0.75 text-[.68rem] leading-snug text-gray-600">
              Your data remains encrypted, isolated, and fully under your
              control at every step.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginLeftMenu;
