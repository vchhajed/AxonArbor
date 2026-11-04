"use client";

/* eslint-disable @next/next/no-img-element -- consultant photos uploaded at runtime */
import { useActionState, useRef, useState, useTransition } from "react";
import {
  changePassword,
  createProfilePhotoUpload,
  requestProfileRemoval,
  saveCompanyProfile,
  saveConsultantProfile,
  type FormState,
} from "@/app/account-actions";
import { Button } from "@/components/ui/Button";
import type { CompanyProfile, ConsultantProfile } from "@/lib/accounts/data";
import { CITIES, DAY_RATE_BANDS, DELIVERY_MODES, EMPLOYEE_BANDS, EXPERTISE } from "@/lib/phase2/options";
import { MEDIA_BUCKET } from "@/lib/supabase/config";
import { createPublicClient } from "@/lib/supabase/public";
import { CheckboxField, FormMessage, KeepValues, submitWithoutReset, SelectField, TextField } from "./fields";

const initial: FormState = { error: null };

function PhotoField({ initialUrl }: { initialUrl: string | null }) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    const target = await createProfilePhotoUpload({ type: file.type, size: file.size });
    if (!target.ok) {
      setError(target.error);
      setBusy(false);
      return;
    }
    const { error: uploadError } = await createPublicClient()
      .storage.from(MEDIA_BUCKET)
      .uploadToSignedUrl(target.path, target.token, file, { contentType: file.type });
    setBusy(false);
    if (uploadError) setError("Upload failed. Please try again.");
    else setUrl(target.publicUrl);
  }

  return (
    <div>
      <p className="eyebrow text-grey-700">Photo</p>
      <div className="mt-3 flex items-center gap-5">
        <div className="flex size-24 items-center justify-center overflow-hidden bg-grey-100">
          {url ? <img src={url} alt="Your profile photo" className="h-full w-full object-cover grayscale" /> : <span className="text-xs text-grey-500">No photo</span>}
        </div>
        <div className="space-y-2">
          <Button type="button" variant="outline" disabled={busy} onClick={() => fileRef.current?.click()}>
            {busy ? "Uploading…" : url ? "Change photo" : "Upload photo"}
          </Button>
          <p className="text-sm text-grey-500">JPG, PNG or WebP, up to 5 MB. Shown in black and white.</p>
        </div>
      </div>
      <input type="hidden" name="photo_url" value={url} />
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
      />
      {error && <p className="mt-2 text-sm text-ink">{error}</p>}
    </div>
  );
}

export function ConsultantProfileForm({ profile }: { profile: ConsultantProfile }) {
  const [state, action, pending] = useActionState(saveConsultantProfile, initial);
  const fe = state.fieldErrors ?? {};
  const [ex1, ex2, ex3] = profile.expertise;
  return (
    <KeepValues values={state.values}>
      <form action={action} onSubmit={submitWithoutReset(action)} noValidate className="space-y-12">
        <fieldset className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
          <legend className="mb-6 font-serif text-2xl">About you</legend>
          <TextField name="full_name" label="Full name" required defaultValue={profile.full_name} error={fe.full_name} />
          <TextField name="phone" label="Mobile number" type="tel" required defaultValue={profile.phone} error={fe.phone} hint="Include the country code." />
          <SelectField name="city" label="City / base location" required options={CITIES} defaultValue={profile.city} error={fe.city} />
          <TextField
            name="years_experience"
            label="Years of experience"
            type="number"
            required
            defaultValue={profile.years_experience}
            error={fe.years_experience}
          />
          <div className="sm:col-span-2">
            <PhotoField initialUrl={profile.photo_url} />
          </div>
        </fieldset>

        <fieldset className="grid gap-x-8 gap-y-7 sm:grid-cols-3">
          <legend className="mb-6 font-serif text-2xl">Expertise</legend>
          <SelectField name="expertise_1" label="Main expertise" required options={EXPERTISE} defaultValue={ex1} error={fe.expertise_1} />
          <SelectField name="expertise_2" label="Expertise 2" options={EXPERTISE} defaultValue={ex2} placeholder="(optional)" />
          <SelectField name="expertise_3" label="Expertise 3" options={EXPERTISE} defaultValue={ex3} placeholder="(optional)" />
          <TextField
            name="industries"
            label="Industries worked with"
            required
            defaultValue={profile.industries}
            error={fe.industries}
            hint="Comma-separated, e.g. Hospitality, BFSI"
            className="sm:col-span-2"
          />
          <SelectField name="delivery_mode" label="Delivery mode" required options={DELIVERY_MODES} defaultValue={profile.delivery_mode} error={fe.delivery_mode} />
          <TextField name="languages" label="Languages" required defaultValue={profile.languages} error={fe.languages} hint="e.g. English, Hindi" className="sm:col-span-3" />
          <TextField
            name="bio"
            label="Short bio"
            required
            multiline
            rows={5}
            maxLength={600}
            defaultValue={profile.bio}
            error={fe.bio}
            hint="Up to about 80 words. Companies see this (without your name) when you match their request."
            className="sm:col-span-3"
          />
        </fieldset>

        <fieldset className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
          <legend className="mb-6 font-serif text-2xl">More detail (optional)</legend>
          <TextField name="linkedin_url" label="LinkedIn URL" type="url" defaultValue={profile.linkedin_url} error={fe.linkedin_url} />
          <TextField name="certifications" label="Certifications" defaultValue={profile.certifications} hint="e.g. ICF-PCC, SHRM-CP" />
          <TextField name="notable_clients" label="Notable clients" defaultValue={profile.notable_clients} hint="Only clients you may name." />
          <TextField name="availability" label="Availability" defaultValue={profile.availability} hint="e.g. 6 days a month" />
          <SelectField
            name="day_rate_band"
            label="Day rate range"
            options={DAY_RATE_BANDS}
            defaultValue={profile.day_rate_band}
            error={fe.day_rate_band}
            hint="Never shown to companies."
          />
        </fieldset>

        <CheckboxField
          name="consent"
          defaultChecked={profile.consent}
          error={fe.consent}
          label={
          <>
            I agree that Axon Arbor may show my profile to verified client companies. Before an introduction, companies see it without my
            name, photo, LinkedIn or contact details, and never see my day rate. I can withdraw this at any time. See the{" "}
            <a href="/privacy" target="_blank" className="text-ink underline decoration-amber decoration-2 underline-offset-4">
              Privacy Policy
            </a>
            .
          </>
        }
        />

        <FormMessage error={state.error} ok={state.ok} />
        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" name="intent" value="submit" arrow disabled={pending}>
            {pending ? "Saving…" : "Save and submit for approval"}
          </Button>
          <Button type="submit" name="intent" value="save" variant="outline" disabled={pending}>
            Save draft
          </Button>
        </div>
      </form>
    </KeepValues>
  );
}

export function RemovalButton() {
  const [state, setState] = useState<FormState | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={() => {
          if (window.confirm("Ask Axon Arbor to remove your profile? Companies will no longer see it once removal is approved.")) {
            start(async () => setState(await requestProfileRemoval()));
          }
        }}
      >
        Request removal of my profile
      </Button>
      {state && <FormMessage error={state.error} ok={state.ok} />}
    </div>
  );
}

export function CompanyProfileForm({ company }: { company: CompanyProfile }) {
  const [state, action, pending] = useActionState(saveCompanyProfile, initial);
  const fe = state.fieldErrors ?? {};
  return (
    <KeepValues values={state.values}>
      <form action={action} onSubmit={submitWithoutReset(action)} noValidate className="space-y-8">
        <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
          <TextField name="company_name" label="Company name" required defaultValue={company.company_name} error={fe.company_name} />
          <TextField name="website" label="Website" type="url" defaultValue={company.website} error={fe.website} />
          <TextField name="industry" label="Industry" defaultValue={company.industry} />
          <SelectField name="city" label="Head office" options={CITIES} defaultValue={company.city} error={fe.city} />
          <SelectField name="employee_count" label="Number of employees" options={EMPLOYEE_BANDS} defaultValue={company.employee_count} error={fe.employee_count} />
          <TextField name="contact_name" label="Your name" required defaultValue={company.contact_name} error={fe.contact_name} />
          <TextField name="contact_role" label="Your role" defaultValue={company.contact_role} />
          <TextField name="phone" label="Phone" type="tel" defaultValue={company.phone} error={fe.phone} />
        </div>
        <FormMessage error={state.error} ok={state.ok} />
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Saving…" : "Save company details"}
        </Button>
      </form>
    </KeepValues>
  );
}

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePassword, initial);
  return (
    <form action={action} onSubmit={submitWithoutReset(action)} noValidate className="max-w-md space-y-6">
      <TextField name="current_password" label="Current password" type="password" autoComplete="current-password" required />
      <TextField name="new_password" label="New password" type="password" autoComplete="new-password" required hint="At least 10 characters, with letters and numbers." />
      <FormMessage error={state.error} ok={state.ok} />
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Saving…" : "Change password"}
      </Button>
    </form>
  );
}
