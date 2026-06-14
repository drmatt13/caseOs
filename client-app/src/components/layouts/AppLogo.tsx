interface AppLogoProps {
  NavigationPanel?: boolean;
}

const AppLogo = ({ NavigationPanel }: AppLogoProps) => {
  return (
    <div
      className={`flex gap-2.5 ${!NavigationPanel ? "h-14 -translate-y-1.5 translate-x-1" : "w-full flex justify-center"}`}
    >
      {!NavigationPanel && (
        <img
          className="-translate-y-2 h-16 w-auto object-contain"
          src="/logo1.png"
          alt="logo"
        />
      )}
      <div className="flex flex-col items-center justify-center -translate-y-0.5">
        <div className="text-[1.6rem] tracking-widest font-cormorant-garamond font-medium">
          LAWSTRUCT
        </div>

        <div className="flex items-center w-full -translate-y-0.75 gap-1">
          <div className="flex-1 flex justify-center">
            <div className="w-full border-b border-black h-1 select-none pointer-events-none text-transparent">
              x
            </div>
          </div>

          <div className="text-[0.575rem] whitespace-nowrap font-sans">
            {/* Build Structure From Case Complexity */}
            {/* Connected Legal Intelligence */}
            {/* Connected Case Intelligence */}
            {/* Agentic driven legal Reasoning */}
            Structured Intelligence for Litigation
          </div>

          <div className="flex-1 flex justify-center">
            <div className="w-full border-b border-black h-1 select-none pointer-events-none text-transparent">
              x
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppLogo;
