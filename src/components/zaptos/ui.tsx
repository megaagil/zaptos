import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>
      {children}
    </label>
  );
}

export const fieldClass =
  "h-11 w-full rounded-xl border border-line bg-card px-3 text-base text-ink outline-none placeholder:text-muted focus:border-lime-deep focus:ring-2 focus:ring-lime-soft";

export function Btn({
  variant = "primary",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "ink" | "danger";
}) {
  const styles = {
    primary: "bg-lime text-ink hover:bg-lime-deep hover:text-paper",
    ink: "bg-ink text-paper hover:bg-olive",
    ghost: "border border-line bg-card text-ink hover:bg-lime-soft",
    danger: "border border-line bg-card text-danger hover:bg-danger-soft",
  }[variant];
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors disabled:opacity-50",
        styles,
        className,
      )}
      {...props}
    />
  );
}

export function Chip({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
        className,
      )}
    >
      {children}
    </span>
  );
}
