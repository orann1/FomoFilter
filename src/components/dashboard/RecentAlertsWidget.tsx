import { Bell, TrendingUp, Flame } from "lucide-react";
import { type RecentAlert } from "@/src/lib/mock-data";

const iconMap: Record<RecentAlert["icon"], React.ComponentType<{ size?: number; className?: string }>> = {
  "trending-up": TrendingUp,
  flame: Flame,
};

interface RecentAlertsWidgetProps {
  alerts: RecentAlert[];
}

export default function RecentAlertsWidget({ alerts }: RecentAlertsWidgetProps) {
  const newAlertCount = alerts.filter((a) => a.isNew).length;
  return (
    <div className="bg-[#111318] border border-slate-800 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-4 border-b border-slate-800">
        <Bell size={14} className="text-amber-400" />
        <h2 className="text-white font-semibold text-sm">Recent Alerts</h2>
        {newAlertCount > 0 && (
          <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-700/50 px-1.5 py-0.5 rounded-full font-medium ml-1">
            {newAlertCount} new
          </span>
        )}
      </div>
      <div className="divide-y divide-slate-800/60">
        {alerts.map((alert, i) => {
          const Icon = iconMap[alert.icon];
          return (
            <div key={i} className={`px-4 py-3 ${alert.isNew ? "bg-amber-500/5" : ""}`}>
              <div className="flex items-start gap-2.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${alert.isNew ? "bg-amber-500/15" : "bg-slate-700/40"}`}>
                  <Icon size={13} className={alert.isNew ? "text-amber-400" : "text-slate-400"} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-white text-xs font-semibold">{alert.symbol}</span>
                    <span className="text-slate-600 text-xs">{alert.minutesAgo} min ago</span>
                  </div>
                  <p className="text-slate-300 text-xs">{alert.message}</p>
                  <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{alert.note}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
