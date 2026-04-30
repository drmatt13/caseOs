import { ArrowRight, BrainCircuit, Network, ShieldCheck } from "lucide-react";

const LoginLeftMenu = () => {
  return (
    <div className="flex-1 flex flex-col gap-6 justify-start">
      <div className="flex flex-col gap-1 /h-14">
        <p className="text-4xl /font-noto-serif-jp font-bj-cree -translate-x-0.5">
          CaseOS
        </p>
        <p className="text-[1rem] font-inconsolata">
          Agent-driven case intelligence workspace
        </p>
      </div>
      <div className="w-full /bg-black/10 grid grid-cols-2 gap-4">
        <div className="w-full h-36 p-4 border rounded-2xl bg-white/40 backdrop-blur-sm border-black/15 shadow-md">
          <div className="flex flex-col">
            <div className="text-[1rem]">header</div>
            <div>content</div>
          </div>
        </div>
        <div className="w-full h-36 p-4 border rounded-2xl bg-white/40 backdrop-blur-sm border-black/15 shadow-md">
          <div className="flex flex-col">
            <div className="text-[1rem]">header</div>
            <div>content</div>
          </div>
        </div>
        <div className="w-full h-36 p-4 border rounded-2xl bg-white/40 backdrop-blur-sm border-black/15 shadow-md col-span-2">
          <div className="flex flex-col">
            <div className="text-[1rem]">header</div>
            <div>content</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginLeftMenu;
