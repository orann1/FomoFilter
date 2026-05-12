import { mockDiscoverSetups } from "@/src/lib/mock-data";

export default function DiscoverSetups() {
  return (
    <div className="bg-[#111318] border border-slate-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <h2 className="text-white font-semibold text-sm">Discover Setups</h2>
        <button className="text-xs text-purple-400 hover:text-purple-300 transition-colors" suppressHydrationWarning>All Views</button>
      </div>
      <div className="p-4 grid grid-cols-2 gap-3">
        {mockDiscoverSetups.map((setup) => (
          <div
            key={setup.slug}
            className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3 hover:border-slate-600 hover:bg-slate-800/50 transition-colors cursor-pointer"
          >
            <div className="flex items-start gap-2 mb-1.5">
              <span className="text-base leading-none">{setup.icon}</span>
              <div className="min-w-0">
                <p className="text-white text-xs font-semibold leading-tight">{setup.name}</p>
                <p className="text-slate-500 text-xs mt-0.5 leading-tight">{setup.description}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {setup.tickers.slice(0, 3).map((t) => (
                <span key={t} className="text-xs text-slate-400 bg-slate-700/50 px-1.5 py-0.5 rounded">
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
