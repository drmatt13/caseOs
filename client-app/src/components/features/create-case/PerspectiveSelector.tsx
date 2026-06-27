import { Scale, User, Check } from "lucide-react";

import type { IntakePerspective } from "#/types/caseWorkspace";

type PerspectiveOption = {
  value: IntakePerspective;
  icon: typeof Scale;
  title: string;
  description: string;
};

const PERSPECTIVE_OPTIONS: PerspectiveOption[] = [
  {
    value: "attorney",
    icon: Scale,
    title: "An attorney or firm",
    description: "Set up a matter on behalf of a client.",
  },
  {
    value: "self",
    icon: User,
    title: "I'm representing myself",
    description: "Handle your own case, in plain language.",
  },
];

type PerspectiveSelectorProps = {
  value: IntakePerspective;
  onChange: (value: IntakePerspective) => void;
};

// The fork-in-the-road at the top of intake: a self-represented (pro se)
// litigant and an attorney think about a case differently, so the whole wizard
// adapts to this choice. Two equal-weight cards — neither path is the
// afterthought.
const PerspectiveSelector = ({ value, onChange }: PerspectiveSelectorProps) => (
  <fieldset className="flex flex-col gap-2">
    <legend className="text-md font-medium text-black mb-2">
      Who's setting up this case?
    </legend>
    <div role="radiogroup" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {PERSPECTIVE_OPTIONS.map((option) => {
        const Icon = option.icon;
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`relative flex items-start gap-3 rounded-2xl border p-4 text-left shadow-sm backdrop-blur-sm transition cursor-pointer ${
              selected
                ? "border-black/40 bg-black/5 ring-2 ring-black/5"
                : "border-black/15 bg-white/40 hover:border-black/25 hover:bg-white/60"
            }`}
          >
            <span
              className={`rounded-lg p-2 ${
                selected ? "bg-black/15" : "bg-black/10"
              }`}
            >
              <Icon className="h-5 w-5 text-black/90" />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-md font-medium text-black">
                {option.title}
              </span>
              <span className="text-sm text-black/60">
                {option.description}
              </span>
            </span>
            {selected ? (
              <Check className="absolute right-3 top-3 h-4 w-4 text-black/70" />
            ) : null}
          </button>
        );
      })}
    </div>
  </fieldset>
);

export default PerspectiveSelector;
