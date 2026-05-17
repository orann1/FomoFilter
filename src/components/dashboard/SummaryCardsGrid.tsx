import { Flame, Target, Bell } from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Flame,
  Target,
  Bell,
};

const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
  orange: { bg: "bg-orange-500/10", text: "text-orange-400", icon: "text-orange-400" },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400", icon: "text-emerald-400" },
  amber: { bg: "bg-amber-500/10", text: "text-amber-400", icon: "text-amber-400" },
};

const subtextMap: Record<string, string> = {
  "Hot Stocks Today": "Score > 80",
  "Top Opportunities": "Score > 75",
  "Active Alerts": "3 triggered today",
};

interface SummaryCard {
  label: string;
  value: number;
  icon: string;
  color: string;
}

interface SummaryCardsGridProps {
  cards: SummaryCard[];
}

export default function SummaryCardsGrid({ cards }: SummaryCardsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
      {cards.map((card) => {
        const Icon = iconMap[card.icon];
        const colors = colorMap[card.color];
        return (
          <div key={card.label} className="bg-[#111318] border border-slate-800 rounded-xl p-4 flex items-start gap-3">
            <div className={`w-9 h-9 rounded-lg ${colors.bg} flex items-center justify-center shrink-0`}>
              {Icon && <Icon size={16} className={colors.icon} />}
            </div>
            <div>
              <p className={`text-2xl font-bold ${colors.text}`}>{card.value}</p>
              <p className="text-slate-300 text-sm font-medium leading-tight">{card.label}</p>
              <p className="text-slate-500 text-xs mt-0.5">{subtextMap[card.label]}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
