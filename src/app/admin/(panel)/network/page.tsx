import type { Metadata } from "next";
import Image from "next/image";
import { requireAdmin } from "@/lib/admin/auth";
import { getRoster, type RosterTrainer } from "@/lib/admin/roster";

export const metadata: Metadata = { title: "Trainer network" };

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="eyebrow text-grey-500">{label}</dt>
      <dd className="mt-1 whitespace-pre-line text-grey-800">{value}</dd>
    </div>
  );
}

function TrainerCard({ t }: { t: RosterTrainer }) {
  return (
    <li className="border border-grey-200 bg-white">
      <details>
        <summary className="flex cursor-pointer items-center gap-4 p-4">
          <span className="relative size-14 shrink-0 overflow-hidden bg-grey-100">
            {t.photo_path && <Image src={t.photo_path} alt="" fill sizes="56px" className="object-cover" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-serif text-xl">{t.full_name}</span>
            <span className="block truncate text-sm text-grey-600">
              {[t.city, t.years_experience].filter(Boolean).join(" · ")}
            </span>
            <span className="block truncate text-sm text-grey-500">{t.specialities.slice(0, 4).join(", ")}</span>
          </span>
          {t.account_id && <span className="bg-amber px-2 py-0.5 font-label text-[0.65rem] font-bold">Has account</span>}
        </summary>
        <dl className="grid gap-4 border-t border-grey-200 p-4 text-sm sm:grid-cols-2">
          <Field label="Specialities" value={t.specialities.join(", ")} />
          <Field label="Certifications" value={t.certifications} />
          <Field label="Qualifications" value={t.qualifications} />
          <Field label="Key clients" value={t.key_clients} />
          <Field label="Testimonials" value={t.testimonials} />
          <Field label="Email" value={t.email} />
          <Field label="Phone" value={t.phone} />
          <Field label="LinkedIn" value={t.linkedin_url} />
          <Field label="Price per hour" value={t.price_per_hour} />
          <Field label="Price per half day" value={t.price_half_day} />
          <Field label="Availability" value={t.availability} />
          <Field label="Notes" value={t.verification_note} />
        </dl>
      </details>
    </li>
  );
}

export default async function NetworkPage() {
  const session = await requireAdmin();
  const roster = await getRoster(session);
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-serif text-4xl tracking-tight">Trainer network</h1>
      <p className="mt-2 text-grey-600">
        Every trainer and consultant in the network, with contact details and rates. Only admins can see this page.
      </p>
      {roster === null ? (
        <p className="mt-8 border-l-4 border-amber bg-paper px-5 py-4 text-grey-700">
          The trainer list isn’t set up yet. Apply the trainer roster migration and load the data, then refresh.
        </p>
      ) : (
        <>
          <p className="mt-6 text-sm text-grey-500">{roster.length} trainers</p>
          <ul className="mt-3 space-y-3">
            {roster.map((t) => (
              <TrainerCard key={t.id} t={t} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
