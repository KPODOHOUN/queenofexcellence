import { cn } from "@/lib/utils";
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

interface FormFieldProps {
  label: string;
  hint?: string;
  icon?: ReactNode;
  className?: string;
}

export function FormInput({
  label,
  hint,
  icon,
  className,
  ...props
}: FormFieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={className}>
      <label className="block text-[13px] font-medium text-foreground/80 mb-2 tracking-wide">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/70 pointer-events-none">
            {icon}
          </span>
        )}
        <input
          {...props}
          className={cn(
            "input-field w-full",
            icon && "pl-11"
          )}
        />
      </div>
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function FormTextarea({
  label,
  hint,
  className,
  ...props
}: FormFieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className={className}>
      <label className="block text-[13px] font-medium text-foreground/80 mb-2 tracking-wide">
        {label}
      </label>
      <textarea {...props} className="input-field w-full resize-none min-h-[140px]" />
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function FormSelect({
  label,
  hint,
  icon,
  className,
  children,
  ...props
}: FormFieldProps & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={className}>
      <label className="block text-[13px] font-medium text-foreground/80 mb-2 tracking-wide">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/70 pointer-events-none z-10">
            {icon}
          </span>
        )}
        <select
          {...props}
          className={cn("input-field w-full appearance-none cursor-pointer", icon && "pl-11")}
        >
          {children}
        </select>
      </div>
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}
