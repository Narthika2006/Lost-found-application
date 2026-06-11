import { cn } from "../../lib/utils";

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-slate-800 bg-slate-950/70 shadow-[0_30px_70px_rgba(2,8,23,0.45)] backdrop-blur",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return <div className={cn("px-8 pt-8", className)} {...props} />;
}

export function CardContent({ className, ...props }) {
  return <div className={cn("px-8 pb-8", className)} {...props} />;
}
