import { cn } from "../../lib/utils";

function Label({ className, ...props }) {
  return (
    <label
      className={cn("text-xs font-semibold uppercase tracking-widest text-slate-400", className)}
      {...props}
    />
  );
}

export default Label;
