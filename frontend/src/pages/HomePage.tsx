import figmaIconUrl from "../../assets/Figma.svg";
import reactIconUrl from "../../assets/React.svg";
import vueIconUrl from "../../assets/Vue.svg";
import tailwindIconUrl from "../../assets/Tailwind.svg";
import htmlIconUrl from "../../assets/Html.svg";
import { useNavigate } from "react-router-dom";
import { useFigmaUrlParser } from "../hooks/useFigmaUrlParser";
import { runConvertFlow } from "../utils/convert-flow";
import { Brand } from "../components/Topbar/Brand";

export function HomePage() {
  const navigate = useNavigate();
  const { url, setUrl, state, parse, clearError } = useFigmaUrlParser();
  const isLoading = state.status === "loading";
  const error = state.status === "error" ? state.error : null;

  const handleConvert = async () => {
    const result = await parse(url);
    if (result) {
      // 初始化状态
      const roomId = await runConvertFlow(result);
      navigate(`/room/${encodeURIComponent(roomId)}`);
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#101322] text-white">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1337EC]/10 blur-[48px]" />
      </div>

      <div className="relative z-10 flex h-[64px] w-full items-center justify-between px-12">
        <Brand />
        <div className="text-sm text-slate-300">Sign In</div>
      </div>

      <div className="relative z-10 mx-auto flex h-[calc(100%-64px)] w-full max-w-5xl flex-col items-center justify-center px-6">
        <div className="text-center text-[48px] font-semibold leading-[56px]">
          <span>Turn your designs into </span>
          <span className="text-[#1337EC]">clean code</span>
          <span>.</span>
        </div>
        <div className="mt-4 max-w-2xl text-center text-lg text-slate-400">
          Paste your Figma link and get production-ready code instantly.
        </div>

        <div className="mt-10 w-full max-w-2xl">
          <div className="relative w-full">
            <div className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border border-white/10 bg-white/5 flex items-center justify-center">
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <img src={figmaIconUrl} alt="Figma" className="h-4 w-4" />
              )}
            </div>
            <input
              value={url}
              disabled={isLoading}
              onChange={(e) => {
                if (error) clearError();
                setUrl(e.target.value);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleConvert()}
              placeholder={error || "Paste your Figma file URL here..."}
              className="h-[56px] w-full rounded-xl border border-[#2A2F4C] bg-[#15182A] px-12 pr-44 text-base text-slate-200 outline-none ring-1 ring-[#1337EC]/20 focus:ring-[#1337EC]/60"
            />
            <button
              onClick={handleConvert}
              disabled={isLoading}
              className="absolute right-2 top-1/2 h-[44px] -translate-y-1/2 rounded-lg px-6 text-sm font-semibold text-white"
              style={{ backgroundColor: isLoading ? "#4B5563" : "#1337EC" }}
            >
              {isLoading ? "Converting..." : "Convert to Code"}
            </button>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Supported Frameworks
          </div>
          <div className="flex items-center gap-8 text-xs text-slate-500">
            {[
              { label: "React", icon: reactIconUrl },
              { label: "Vue", icon: vueIconUrl },
              { label: "Tailwind", icon: tailwindIconUrl },
              { label: "HTML", icon: htmlIconUrl },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1A1E32]">
                  <img src={item.icon} alt={item.label} className="h-4 w-4" />
                </div>
                <div>{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-[#1337EC]/30 bg-[#1337EC]/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#1337EC]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1337EC]" />
            Real-time Collaboration
          </div>
          <div className="text-[10px] text-slate-500">
            Yjs-powered Multi-user editing
          </div>
        </div>

      </div>

      <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-slate-500">
        © 2026 Figma2Code Inc. All rights reserved.
      </div>
    </div>
  );
}
