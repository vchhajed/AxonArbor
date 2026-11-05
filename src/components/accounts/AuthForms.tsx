"use client";

import Link from "next/link";
import { useActionState } from "react";
import { setPasswordFromLink, signInAccount, signUpCompany, signUpConsultant, type FormState } from "@/app/account-actions";
import { Button } from "@/components/ui/Button";
import { CITIES, EMPLOYEE_BANDS } from "@/lib/phase2/options";
import { CheckboxField, FormMessage, KeepValues, submitWithoutReset, Honeypot, SelectField, TextField } from "./fields";

const initial: FormState = { error: null };

export function SignInForm({ submitLabel = "Sign in" }: { submitLabel?: string }) {
  const [state, action, pending] = useActionState(signInAccount, initial);
  return (
    <KeepValues values={state.values}>
      <form action={action} onSubmit={submitWithoutReset(action)} className="max-w-md space-y-7">
        <TextField name="email" label="Email" type="email" autoComplete="email" required />
        <TextField name="password" label="Password" type="password" autoComplete="current-password" required />
        <FormMessage error={state.error} />
        <Button type="submit" arrow disabled={pending}>
          {pending ? "Signing in…" : submitLabel}
        </Button>
      </form>
    </KeepValues>
  );
}

export function SetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(setPasswordFromLink, initial);
  return (
    <form action={action} onSubmit={submitWithoutReset(action)} noValidate className="max-w-md space-y-7">
      <input type="hidden" name="token" value={token} />
      <TextField
        name="new_password"
        label="New password"
        type="password"
        autoComplete="new-password"
        required
        hint="At least 10 characters, with letters and numbers."
      />
      <FormMessage error={state.error} />
      <Button type="submit" arrow disabled={pending}>
        {pending ? "Saving…" : "Set password"}
      </Button>
    </form>
  );
}

const legalLink = "text-ink underline decoration-amber decoration-2 underline-offset-4";

const terms = (
  <>
    I agree to the{" "}
    <Link href="/terms" target="_blank" className={legalLink}>
      Terms of Use
    </Link>{" "}
    and{" "}
    <Link href="/privacy" target="_blank" className={legalLink}>
      Privacy Policy
    </Link>
    , and confirm I’m 18 or over.
  </>
);

export function ConsultantSignUpForm() {
  const [state, action, pending] = useActionState(signUpConsultant, initial);
  const fe = state.fieldErrors ?? {};
  return (
    <KeepValues values={state.values}>
      <form action={action} onSubmit={submitWithoutReset(action)} noValidate className="relative max-w-xl space-y-7">
        <Honeypot />
        <TextField name="full_name" label="Full name" autoComplete="name" required error={fe.full_name} />
        <TextField name="email" label="Email" type="email" autoComplete="email" required error={fe.email} hint="This becomes your login." />
        <TextField
          name="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          error={fe.password}
          hint="At least 10 characters, with letters and numbers."
        />
        <CheckboxField name="terms" label={terms} error={fe.terms} />
        <FormMessage error={state.error} />
        <Button type="submit" arrow disabled={pending}>
          {pending ? "Creating account…" : "Create my account"}
        </Button>
        <p className="text-base text-grey-600">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-ink underline decoration-amber decoration-2 underline-offset-4">
            Sign in
          </Link>
          .
        </p>
      </form>
    </KeepValues>
  );
}

export function CompanySignUpForm() {
  const [state, action, pending] = useActionState(signUpCompany, initial);
  const fe = state.fieldErrors ?? {};
  return (
    <KeepValues values={state.values}>
      <form action={action} onSubmit={submitWithoutReset(action)} noValidate className="relative space-y-10">
        <Honeypot />
        <fieldset className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
          <legend className="mb-6 font-serif text-2xl">Your company</legend>
          <TextField name="company_name" label="Company name" autoComplete="organization" required error={fe.company_name} />
          <TextField name="website" label="Website" type="url" autoComplete="url" error={fe.website} />
          <TextField name="industry" label="Industry" hint="e.g. Hospitality, BFSI, Manufacturing" />
          <SelectField name="city" label="Head office" options={CITIES} error={fe.city} />
          <SelectField name="employee_count" label="Number of employees" options={EMPLOYEE_BANDS} error={fe.employee_count} />
        </fieldset>
        <fieldset className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
          <legend className="mb-6 font-serif text-2xl">You</legend>
          <TextField name="contact_name" label="Your name" autoComplete="name" required error={fe.contact_name} />
          <TextField name="contact_role" label="Your role" autoComplete="organization-title" />
          <TextField
            name="email"
            label="Work email"
            type="email"
            autoComplete="email"
            required
            error={fe.email}
            hint="Your company address. Personal addresses (Gmail, Yahoo, Outlook…) can’t be used."
          />
          <TextField name="phone" label="Phone" type="tel" autoComplete="tel" error={fe.phone} />
          <TextField
            name="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            required
            error={fe.password}
            hint="At least 10 characters, with letters and numbers."
            className="sm:col-span-2"
          />
        </fieldset>
        <CheckboxField name="terms" label={terms} error={fe.terms} />
        <FormMessage error={state.error} />
        <div className="flex flex-wrap items-center gap-6">
          <Button type="submit" arrow disabled={pending}>
            {pending ? "Creating account…" : "Register my company"}
          </Button>
          <p className="text-base text-grey-600">We review every company before access is granted, usually within one working day.</p>
        </div>
      </form>
    </KeepValues>
  );
}
