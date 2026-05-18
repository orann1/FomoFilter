import { Radar } from "lucide-react";

export default function ScannerHeader() {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2.5 mb-1">
        <Radar size={20} className="text-emerald-400" />
        <h1 className="text-xl font-bold text-white">Scanner</h1>
      </div>
      <p className="text-sm text-slate-400">
        Discover hot stocks, filter FOMO, and find setups worth tracking.
      </p>
    </div>
  );
}
