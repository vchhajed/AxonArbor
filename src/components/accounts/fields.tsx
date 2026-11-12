"use client";

import { createContext, startTransition, useContext, type FormEvent, type ReactNode } from "react";

/**
 * Submits through the action without React's automatic form reset, so a
 * validation error never wipes what the person typed (passwords included).
 */
export function submitWithoutReset(action: (form: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
    startTransition(() => action(form));
  };
}

/** Values sent back by the last submit; when present they replace each field's default. */
const SubmittedValues = createContext<Record<string, string> | undefined>(undefined);

export function KeepValues({ values, children }: { values?: Record<string, string>; children: ReactNode }) {
  return <SubmittedValues.Provider value={values}>{children}</SubmittedValues.Provider>;
}

function useSubmitted(name: string, fallback: string | number | null | undefined) {
  const values = useContext(SubmittedValues);
  return values ? (values[name] ?? "") : (fallback ?? "");
}

const control =
  "mt-2 block w-full rounded-none border-0 border-b bg-transparent px-0 py-3 text-base text-ink placeholder:text-grey-400 focus:border-ink focus:outline-none focus-visible:border-b-2";

type Base = { name: string; label: string; required?: boolean; error?: string; hint?: string; className?: string };

function Wrap({ name, label, required, error, hint, className, children }: Base & { children: ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={`f-${name}`} className="eyebrow text-grey-700">
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {hint && (
        <p id={`f-${name}-hint`} className="mt-1 text-sm text-grey-500">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p id={`f-${name}-error`} className="mt-2 flex items-start gap-2 text-sm text-ink">
          <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 bg-amber" />
          {error}
        </p>
      )}
    </div>
  );
}

const describedBy = (name: string, error?: string, hint?: string) =>
  [error && `f-${name}-error`, hint && `f-${name}-hint`].filter(Boolean).join(" ") || undefined;

export function TextField({
  type = "text",
  defaultValue,
  autoComplete,
  maxLength,
  multiline,
  rows = 4,
  ...base
}: Base & {
  type?: string;
  defaultValue?: string | number | null;
  autoComplete?: string;
  maxLength?: number;
  multiline?: boolean;
  rows?: number;
}) {
  const value = useSubmitted(base.name, defaultValue);
  const props = {
    id: `f-${base.name}`,
    name: base.name,
    required: base.required,
    defaultValue: value,
    autoComplete,
    maxLength,
    "aria-invalid": base.error ? true : undefined,
    "aria-describedby": describedBy(base.name, base.error, base.hint),
    className: `${control} ${base.error ? "border-b-2 border-ink" : "border-grey-300"}`,
  };
  return (
    <Wrap {...base}>{multiline ? <textarea rows={rows} {...props} className={`${props.className} resize-y`} /> : <input type={type} {...props} />}</Wrap>
  );
}

export function SelectField({
  options,
  defaultValue,
  placeholder = "Choose…",
  ...base
}: Base & { options: readonly string[]; defaultValue?: string | null; placeholder?: string }) {
  const value = useSubmitted(base.name, defaultValue);
  return (
    <Wrap {...base}>
      <select
        id={`f-${base.name}`}
        name={base.name}
        required={base.required}
        defaultValue={value}
        aria-invalid={base.error ? true : undefined}
        aria-describedby={describedBy(base.name, base.error, base.hint)}
        className={`${control} ${base.error ? "border-b-2 border-ink" : "border-grey-300"}`}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </Wrap>
  );
}

export function CheckboxField({
  name,
  label,
  defaultChecked,
  error,
}: {
  name: string;
  label: ReactNode;
  defaultChecked?: boolean;
  error?: string;
}) {
  const values = useContext(SubmittedValues);
  const checked = values ? values[name] === "on" : defaultChecked;
  return (
    <div>
      <label htmlFor={`f-${name}`} className="flex items-start gap-3 text-sm leading-relaxed text-grey-700">
        <input
          id={`f-${name}`}
          type="checkbox"
          name={name}
          defaultChecked={checked}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(name, error)}
          className="mt-1 size-4 shrink-0 accent-black"
        />
        <span>{label}</span>
      </label>
      {error && (
        <p id={`f-${name}-error`} className="mt-2 flex items-start gap-2 text-sm text-ink">
          <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 bg-amber" />
          {error}
        </p>
      )}
    </div>
  );
}

export function FormMessage({ error, ok }: { error?: string | null; ok?: string }) {
  if (!error && !ok) return null;
  return (
    <p
      role={error ? "alert" : "status"}
      className={`flex items-start gap-2 border-l-4 px-4 py-3 text-sm ${error ? "border-amber bg-grey-50" : "border-ink bg-grey-50"}`}
    >
      {error ?? ok}
    </p>
  );
}

/** Hidden field that bots fill in and people never see. */
export function Honeypot() {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        Website
        <input type="text" name="website_url" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}
