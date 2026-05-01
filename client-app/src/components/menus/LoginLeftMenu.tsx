import {
  BookOpenCheckIcon,
  FileSearchIcon,
  LightbulbIcon,
  ScaleIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
} from "lucide-react";

const LoginLeftMenu = () => {
  return (
    <div className="flex-1 flex flex-col gap-2 justify-start">
      <div className="flex flex-col gap-1 /h-14">
        <p className="text-4xl /font-noto-serif-jp font-bj-cree -translate-x-1">
          CaseOS
        </p>
        <p className="text-[1rem] font-inconsolata -translate-y-px">
          Agent-driven case intelligence workspace
        </p>
      </div>
      <div className="w-full /bg-black/10 grid grid-cols-2 gap-4">
        <div className="w-full h-52 p-4 border rounded-2xl bg-white/40 backdrop-blur-sm border-black/15 shadow-md">
          <div className="flex flex-row gap-4 items-start h-full">
            {/* content */}
            {/* LEFT */}
            <div className="flex-1 h-full flex justify-center items-center">
              <div className="w-full aspect-square bg-black/10 rounded-full"></div>
            </div>
            {/* LEFT */}
            {/* RIGHT */}
            <div className="flex flex-col w-36 h-full items-start">
              <div className="flex flex-col flex-1">
                <p className="text-sm font-medium">
                  Structured Case Intelligence
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  We turn scattered documents, facts, and evidence into a
                  connected, searchable system our AI can reason over, so you
                  never miss what matters.
                </p>
              </div>
              <div className="text-[.625rem] flex px-2.5 py-1 justify-start items-center bg-blue-200/50 text-blue-500 rounded-full">
                <div>Facts</div>

                <div className="px-1 text-[.6rem]">•</div>
                <div>Evidence</div>
                <div className="px-1 text-[.6rem]">•</div>
                <div>Arguments</div>
              </div>
            </div>
            {/* RIGHT */}
            {/* content */}
          </div>
        </div>
        <div className="w-full h-52 p-4 border rounded-2xl bg-white/40 backdrop-blur-sm border-black/15 shadow-md">
          <div className="flex flex-row gap-4 items-start h-full">
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
                  Timeline. Always Up-to-Date.
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Automatically build and maintain chronologies from your case
                  data. See key events, deadlines, and milestones at a glance.
                </p>
              </div>
              <div className="text-[.625rem] flex px-2.5 py-1 justify-start items-center bg-blue-200/50 text-blue-500 rounded-full">
                <div>Events</div>
                <div className="px-1 text-[.6rem]">•</div>
                <div>Deadlines</div>
                <div className="px-1 text-[.6rem]">•</div>
                <div>Filings</div>
              </div>
            </div>
            {/* RIGHT */}
            {/* content */}
          </div>
        </div>
        <div className="w-full h-48 p-4 border rounded-2xl bg-white/40 backdrop-blur-sm border-black/15 shadow-md col-span-2">
          <div className="flex flex-row gap-4 items-start h-full">
            {/* content */}
            {/* LEFT */}
            <div className="flex-1 h-full flex text-[.6rem] pr-2 py-0.5">
              <div className="flex-1 flex flex-col justify-center">
                <div className="w-full h-14 rounded-lg bg-sky-100/80 border border-sky-300/60 flex flex-col text-blue-700/75 justify-center items-center gap-0.5">
                  <ScaleIcon className="h-5 w-5" strokeWidth={1.75} />
                  <p>Legal Issue</p>
                </div>
              </div>
              <div className="w-8"></div>
              <div className="flex-1 flex flex-col justify-between">
                <div className="w-full h-14 rounded-lg bg-emerald-100/80 border border-emerald-300/70 flex flex-col text-emerald-700/85 justify-center items-center gap-0.5">
                  <ShieldCheckIcon className="h-5 w-5" strokeWidth={1.75} />
                  <p>Facts</p>
                </div>

                <div className="w-full h-14 rounded-lg bg-rose-100/80 border border-rose-300/70 flex flex-col text-rose-700/85 justify-center items-center gap-0.5">
                  <ShieldAlertIcon className="h-5 w-5" strokeWidth={1.75} />
                  <p>Challenges</p>
                </div>
              </div>
              <div className="w-8"></div>
              <div className="flex-1 flex flex-col justify-between">
                <div className="w-full h-14 rounded-lg bg-violet-100/80 border border-violet-300/70 flex flex-col text-violet-700/80 justify-center items-center gap-0.5">
                  <BookOpenCheckIcon className="h-5 w-5" strokeWidth={1.75} />
                  <p>Precedent</p>
                </div>
                <div className="w-full h-14 rounded-lg bg-slate-200/70 border border-slate-300/80 flex flex-col text-slate-600/90 justify-center items-center gap-0.5">
                  <FileSearchIcon className="h-5 w-5" strokeWidth={1.75} />
                  <p>Evidence</p>
                </div>
              </div>
              <div className="w-8"></div>
              <div className="flex-1 flex flex-col justify-center">
                <div className="w-full h-14 rounded-lg bg-amber-100/80 border border-amber-300/70 flex flex-col text-amber-700/85 justify-center items-center gap-0.5">
                  <LightbulbIcon className="h-5 w-5" strokeWidth={1.75} />
                  <p>Insights</p>
                </div>
              </div>
            </div>
            {/* LEFT */}
            {/* RIGHT */}
            <div className="flex flex-col w-36 h-full items-start">
              <div className="flex flex-col flex-1">
                <p className="text-sm font-medium">
                  AI That Reasons About Your Case
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  CaseOS analyzes your case, maps strengths and risks, and
                  recommends the best actions, so you can move with confidence.
                </p>
              </div>
              <div className="text-[.625rem] flex px-2.5 py-1 justify-start items-center bg-blue-200/50 text-blue-500 rounded-full">
                <div>Reason</div>
                <div className="px-1 text-[.6rem]">•</div>
                <div>Recommend</div>
                <div className="px-1 text-[.6rem]">•</div>
                <div>Act</div>
              </div>
            </div>
            {/* RIGHT */}
            {/* content */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginLeftMenu;
