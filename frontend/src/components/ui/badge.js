import { cn } from "../../lib/utils";

function Badge({ className, tone = "default", ...props }) {
  const tones = {
    default: "bg-slate-800 text-slate-200 border border-slate-700",
    ocean: "bg-teal-500/15 text-teal-200 border border-teal-400/30",
    ember: "bg-orange-500/15 text-orange-200 border border-orange-400/30",
    ink: "bg-cyan-400 text-slate-950",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}

export default Badge;
