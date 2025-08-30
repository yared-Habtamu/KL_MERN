import React from "react";
import { cn } from "../../lib/utils";

interface InputFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label: string;
  error?: string;
  helperText?: string;
  multiline?: boolean;
  rows?: number;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  error,
  helperText,
  multiline = false,
  rows = 3,
  className,
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const inputClasses = cn(
    "input-base",
    error && "border-kiya-red focus:border-kiya-red focus:ring-kiya-red",
    className,
  );

  const InputComponent = multiline ? "textarea" : "input";

  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        className="block text-label font-medium text-kiya-text"
      >
        {label}
      </label>

      <InputComponent
        id={inputId}
        className={inputClasses}
        rows={multiline ? rows : undefined}
        {...(props as any)}
      />

      {error && <p className="text-kiya-red text-label">{error}</p>}

      {helperText && !error && (
        <p className="text-kiya-text-secondary text-label">{helperText}</p>
      )}
    </div>
  );
};
