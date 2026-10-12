interface BadgeProps {
  label: string;
  bg: string;
  text: string;
  dot?: string;
  size?: "sm" | "xs";
}

export default function Badge({ label, bg, text, dot, size = "sm" }: BadgeProps) {
  const sz = size === "xs" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-1";
  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full ${bg} ${text} ${sz}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />}
      {label}
    </span>
  );
}
