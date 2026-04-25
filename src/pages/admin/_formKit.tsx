// Shared form primitives for the admin pages — keeps the edit forms terse.
import React from "react";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-2 block">
    {children}
  </label>
);

export const Field: React.FC<{
  label: string;
  hint?: string;
  children: React.ReactNode;
}> = ({ label, hint, children }) => (
  <div>
    <Label>{label}</Label>
    {children}
    {hint && <p className="mt-1.5 text-xs text-zinc-600">{hint}</p>}
  </div>
);

const baseInput =
  "w-full bg-black border border-zinc-800 px-4 py-2.5 text-sm focus:border-red-600 focus:outline-none transition placeholder:text-zinc-700";

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} className={`${baseInput} ${props.className ?? ""}`} />
);

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
  <textarea
    rows={4}
    {...props}
    className={`${baseInput} resize-y ${props.className ?? ""}`}
  />
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <select {...props} className={`${baseInput} ${props.className ?? ""}`} />
);

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "ghost" | "danger";
    loading?: boolean;
  }
> = ({ variant = "primary", loading, children, ...rest }) => {
  const styles = {
    primary: "bg-red-600 hover:bg-red-500 text-white",
    ghost: "border border-zinc-800 text-zinc-300 hover:bg-zinc-900",
    danger: "border border-red-900 text-red-400 hover:bg-red-950",
  }[variant];
  return (
    <button
      {...rest}
      disabled={rest.disabled || loading}
      className={`px-6 py-3 text-xs font-black uppercase tracking-[0.3em] transition flex items-center justify-center gap-2 disabled:opacity-50 ${styles} ${rest.className ?? ""}`}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
};

export const PageHeader: React.FC<{ title: string; sub?: string }> = ({ title, sub }) => (
  <div className="mb-8">
    <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic">
      {title}<span className="text-red-600">.</span>
    </h1>
    {sub && <p className="text-zinc-500 text-sm mt-2">{sub}</p>}
  </div>
);

export const Banner: React.FC<{ kind: "error" | "success" | "info"; children: React.ReactNode }> = ({
  kind,
  children,
}) => {
  const styles = {
    error: "bg-red-950/40 border-red-900 text-red-300",
    success: "bg-green-950/40 border-green-900 text-green-300",
    info: "bg-zinc-900 border-zinc-800 text-zinc-300",
  }[kind];
  const Icon = kind === "error" ? AlertCircle : CheckCircle2;
  return (
    <div className={`mb-6 flex items-start gap-2 border px-4 py-3 text-sm ${styles}`}>
      <Icon size={16} className="mt-0.5 flex-shrink-0" />
      <span>{children}</span>
    </div>
  );
};
