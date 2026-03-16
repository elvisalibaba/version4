import type { AdminNoticeTone } from "@/types/admin";

const toneClasses: Record<AdminNoticeTone, string> = {
  info: "border-sky-200 bg-sky-50 text-sky-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  danger: "border-rose-200 bg-rose-50 text-rose-900",
};

type AdminNoticeProps = {
  tone: AdminNoticeTone;
  title: string;
  description: string;
};

export function AdminNotice({ tone, title, description }: AdminNoticeProps) {
  return (
    <div className={`rounded-[1.4rem] border p-4 ${toneClasses[tone]}`}>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-6 opacity-90">{description}</p>
    </div>
  );
}
