import type { ReactNode } from "react";

type FormSectionProps = {
  title: string;
  description?: string;
  aside?: ReactNode;
  children: ReactNode;
};

export function FormSection({ title, description, aside, children }: FormSectionProps) {
  return (
    <section className="form-panel">
      <div className="form-panel-header">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
          {description ? <p className="text-sm leading-6 text-slate-500">{description}</p> : null}
        </div>
        {aside ? <div>{aside}</div> : null}
      </div>
      {children}
    </section>
  );
}
