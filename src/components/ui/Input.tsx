"use client";

import { forwardRef } from "react";
import { cn } from "@/utils/helpers";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, onRightIconClick, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-neutral-700">
            {label}
            {props.required && <span className="text-[#E84672] ml-0.5">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-neutral-400 pointer-events-none text-base">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-800",
              "placeholder:text-neutral-400 transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-[#E84672]/30 focus:border-[#E84672]",
              "disabled:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60",
              error && "border-red-400 focus:ring-red-300 focus:border-red-400",
              !!leftIcon && "pl-10",
              !!rightIcon && "pr-10",
              className,
            )}
            {...props}
          />
          {rightIcon && (
            <button
              type="button"
              onClick={onRightIconClick}
              className="absolute right-3 text-neutral-400 hover:text-neutral-600 transition-colors"
              tabIndex={-1}
            >
              {rightIcon}
            </button>
          )}
        </div>
        {error && <p className="text-xs text-red-500 flex items-center gap-1">{error}</p>}
        {hint && !error && <p className="text-xs text-neutral-400">{hint}</p>}
      </div>
    );
  },
);
Input.displayName = "Input";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-neutral-700">
            {label}
            {props.required && <span className="text-[#E84672] ml-0.5">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            "w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800",
            "placeholder:text-neutral-400 transition-all duration-200 resize-none min-h-[100px]",
            "focus:outline-none focus:ring-2 focus:ring-[#E84672]/30 focus:border-[#E84672]",
            error && "border-red-400 focus:ring-red-300",
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs text-neutral-400">{hint}</p>}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";
