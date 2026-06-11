import { cn } from "../../lib/utils";

function Button({ className, variant = "primary", ...props }) {
  const variants = {
    primary:
      "bg-cyan-400 text-slate-950 shadow-[0_18px_40px_rgba(34,211,238,0.18)] hover:-translate-y-0.5 hover:bg-cyan-300",
    ghost: "bg-slate-900/50 text-slate-100 border border-slate-700 hover:bg-slate-800/70",
    outline:
      "border border-slate-700 text-slate-100 bg-transparent hover:bg-slate-800/60",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export default Button;
