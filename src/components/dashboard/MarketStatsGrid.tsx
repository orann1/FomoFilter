import { mockMarketStats } from "@/src/lib/mock-data";

export default function MarketStatsGrid() {
  return (
    <div className="grid grid-cols-4 gap-3 mb-5">
      {mockMarketStats.map((stat) => (
        <div key={stat.label} className="bg-[#111318] border border-slate-800 rounded-xl p-4">
          <p className="text-slate-500 text-xs mb-1">{stat.label}</p>
          <p className="text-white font-semibold text-base">{stat.value}</p>
          <p className={`text-sm font-medium mt-0.5 ${stat.up ? "text-emerald-400" : "text-red-400"}`}>
            {stat.change}
          </p>
        </div>
      ))}
    </div>
  );
}
