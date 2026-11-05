import type { LegalContent } from "./types";

const UPDATED = "22 October 2026";

export const privacy: LegalContent = {
  meta: {
    title: "Privacy Policy",
    description: "How Axon Arbor collects, uses and protects personal data on this website and platform.",
    path: "/privacy",
  },
  header: {
    eyebrow: "Legal",
    heading: "Privacy Policy",
    lede: "What we collect, why we collect it, and the choices you have.",
  },
  updated: UPDATED,
  intro: [
    "This policy explains how Axon Arbor Consulting (“Axon Arbor”, “we”, “us”) handles personal data when you visit axonarbor.in, contact us, or use our consultant and company accounts (together, the “Platform”).",
    "We process personal data in line with India’s Digital Personal Data Protection Act, 2023, the Information Technology Act, 2000 and the rules made under them.",
  ],
  sections: [
    {
      heading: "1. Who we are",
      paragraphs: [
        "Axon Arbor Consulting, Jaypee Wishtown, Sector 128, Noida, Uttar Pradesh 201304, India. For anything to do with your data, email info@axonarbor.in.",
        "For the purposes of data protection law, we are the “data fiduciary” for the personal data described in this policy.",
      ],
      points: [],
    },
    {
      heading: "2. What we collect",
      paragraphs: ["We only collect what you give us, plus the minimum technical data needed to run the site."],
      points: [
        "Contact form: your name, organisation, role, work email, phone number and message.",
        "Consultant accounts: name, email, password (stored only in scrambled, hashed form), phone, city, expertise, years of experience, industries, delivery mode, languages, bio, and optionally your photo, LinkedIn profile, certifications, notable clients, day-rate range and availability, and the services you’re interested in.",
        "Company accounts: company name, website, industry, head-office city, company size, and the name, role, work email, phone and password of the person registering.",
        "Account activity: when an account was created, last signed in, and the status of profiles and approvals, including any notes our team adds.",
        "Technical data: our hosting provider records basic server logs (such as IP address, browser type and the pages requested) to keep the site secure and working.",
      ],
    },
    {
      heading: "3. How we use it",
      paragraphs: [],
      points: [
        "To reply to enquiries sent through the contact form.",
        "To create and run your account, and to keep it secure.",
        "To review consultant profiles and verify companies before giving them access.",
        "To match consultant profiles to company requests and arrange introductions.",
        "To keep records of approvals and decisions, and to meet legal obligations.",
      ],
    },
    {
      heading: "4. Our grounds for using it",
      paragraphs: [
        "We rely on your consent, which you give when you send the contact form, create an account, or tick the consent box on your consultant profile. You can withdraw consent at any time (see section 9); this doesn’t affect anything we did before you withdrew it.",
        "We may also process data where the law allows without consent, for example to comply with a legal obligation or a request from a lawful authority.",
      ],
      points: [],
    },
    {
      heading: "5. How consultant profiles are shared",
      paragraphs: [
        "Consultant profiles are only shown to companies that Axon Arbor has verified, and only once our team has approved the profile.",
        "Before an introduction, companies see a profile without your name, photo, LinkedIn link or contact details. Your day-rate range is never shown to companies.",
        "Your identifying details are shared with a company only when an introduction is made with your agreement.",
      ],
      points: [],
    },
    {
      heading: "6. Who else sees your data",
      paragraphs: ["We don’t sell personal data and we don’t share it for advertising. We share it only with:"],
      points: [
        "Our service providers, who process it on our behalf under contract: Supabase (database and file storage), Vercel (website hosting) and Resend (sending email).",
        "Verified companies, as described in section 5.",
        "Authorities, courts or advisers where the law requires it or to protect our legal rights.",
      ],
    },
    {
      heading: "7. Where it is stored",
      paragraphs: [
        "Our database, files and website servers are located in Mumbai, India. Our providers may access data from other countries to support their services, under their own security and confidentiality obligations.",
      ],
      points: [],
    },
    {
      heading: "8. How long we keep it",
      paragraphs: [],
      points: [
        "Accounts and profiles: for as long as the account is open. If you ask us to delete your account, we delete it within 30 days, unless we must keep something to meet a legal obligation.",
        "Contact form enquiries: for up to 24 months after our last contact with you.",
        "Server logs: for the short period our hosting provider keeps them.",
      ],
    },
    {
      heading: "9. Your rights",
      paragraphs: ["You can ask us to:"],
      points: [
        "Give you a summary of the personal data we hold about you and how we use it.",
        "Correct, complete or update your data. Most account details can be edited yourself from your account page.",
        "Delete your data or close your account.",
        "Stop using your data where you withdraw consent. Consultants can also request removal of their profile from their account page.",
        "Nominate another person to exercise these rights for you if you die or become unable to.",
      ],
    },
    {
      heading: "10. Security",
      paragraphs: [
        "Data is encrypted in transit. Passwords are stored only as secure hashes, never in readable form. Account data can only be read by our servers, and access to the admin dashboard is limited to authorised Axon Arbor staff.",
        "No system is perfectly secure. If a breach affecting your personal data occurs, we will notify you and the authorities as the law requires.",
      ],
      points: [],
    },
    {
      heading: "11. Cookies",
      paragraphs: [
        "We use only the cookies needed for signing in. We don’t use advertising or analytics cookies.",
      ],
      points: [
        "aa_account: keeps consultants and companies signed in. It expires after 30 days or when you sign out.",
        "aa_admin: keeps Axon Arbor staff signed in to the admin dashboard.",
      ],
    },
    {
      heading: "12. Children",
      paragraphs: ["The Platform is for professionals aged 18 or over. We don’t knowingly collect data from children."],
      points: [],
    },
    {
      heading: "13. Grievances and complaints",
      paragraphs: [
        "If you have a question or complaint about your data, contact our Grievance Officer at info@axonarbor.in (subject line “Data protection”), or write to the address in section 1. We will acknowledge your complaint within 48 hours and aim to resolve it within 30 days.",
        "If you’re not satisfied with our response, you may complain to the Data Protection Board of India.",
      ],
      points: [],
    },
    {
      heading: "14. Changes to this policy",
      paragraphs: [
        "We may update this policy as the Platform develops. We will change the date at the top, and for significant changes we will tell account holders when they next sign in or by email.",
      ],
      points: [],
    },
  ],
};

export const terms: LegalContent = {
  meta: {
    title: "Terms of Use",
    description: "The terms for using the Axon Arbor website and consultant and company accounts.",
    path: "/terms",
  },
  header: {
    eyebrow: "Legal",
    heading: "Terms of Use",
    lede: "The rules for using our website and accounts, in plain English.",
  },
  updated: UPDATED,
  intro: [
    "These terms apply to your use of axonarbor.in and the consultant and company accounts offered on it (the “Platform”), run by Axon Arbor Consulting (“Axon Arbor”, “we”, “us”). By using the Platform or creating an account, you agree to these terms and to our Privacy Policy.",
  ],
  sections: [
    {
      heading: "1. Who can use the Platform",
      paragraphs: [],
      points: [
        "You must be at least 18 and able to enter into a binding contract.",
        "If you register a company, you confirm that you work for it and are authorised to act for it.",
      ],
    },
    {
      heading: "2. Your account",
      paragraphs: [],
      points: [
        "Give accurate information and keep it up to date.",
        "Keep your password private. You are responsible for activity on your account. Tell us at once if you think someone else has used it.",
        "One account per person. Company accounts must be registered with a work email address at the company’s own domain.",
        "We may approve, decline, pause or close accounts at our discretion, for example to verify a company or where these terms are broken.",
      ],
    },
    {
      heading: "3. For consultants",
      paragraphs: [],
      points: [
        "Your profile must be truthful. Only list qualifications you hold and clients you are allowed to name.",
        "You must own, or have permission to use, the photo and other content you upload.",
        "You give Axon Arbor a non-exclusive, royalty-free licence to store, review and display your profile on the Platform, including in the anonymised form described in our Privacy Policy, for as long as it is live.",
        "Every profile is reviewed before it goes live. We may ask for changes or decline a profile.",
        "Joining doesn’t guarantee introductions or work. You remain an independent professional, not an employee or agent of Axon Arbor.",
        "Any engagement that follows an introduction is agreed separately, in writing, between the parties involved.",
        "You can ask for your profile to be removed at any time from your account page.",
      ],
    },
    {
      heading: "4. For companies",
      paragraphs: [],
      points: [
        "We verify every company before access is granted and may decline a registration.",
        "Use consultant information only to consider and arrange engagements through Axon Arbor, and keep it confidential.",
        "Don’t try to identify or contact anonymised consultants other than by requesting an introduction through Axon Arbor.",
        "Commercial terms for any engagement are agreed separately, in writing.",
      ],
    },
    {
      heading: "5. Acceptable use",
      paragraphs: ["You must not:"],
      points: [
        "Upload anything false, misleading, offensive, unlawful or that infringes someone else’s rights.",
        "Collect data from the Platform in bulk (for example by scraping), or use it to send unsolicited messages.",
        "Try to access accounts or areas you aren’t authorised to use, or interfere with the Platform’s security or operation.",
        "Impersonate any person or organisation.",
      ],
    },
    {
      heading: "6. Our content",
      paragraphs: [
        "The Platform, including its design, text, graphics, logos and programme materials, belongs to Axon Arbor or its licensors. You may view it for your own use but may not copy, reproduce or reuse it without our written permission.",
      ],
      points: [],
    },
    {
      heading: "7. Availability and changes",
      paragraphs: [
        "We work to keep the Platform running and secure but can’t promise it will always be available or error-free. We may change, suspend or withdraw features at any time.",
      ],
      points: [],
    },
    {
      heading: "8. Our liability",
      paragraphs: [
        "Information on the Platform is provided for general purposes. Profiles are written by consultants; we review them but can’t guarantee every detail or the outcome of any engagement.",
        "To the extent the law allows, Axon Arbor is not liable for indirect or consequential loss, or for loss of profit, business or data arising from use of the Platform. Nothing in these terms limits liability that cannot be limited by law.",
      ],
      points: [],
    },
    {
      heading: "9. Indemnity",
      paragraphs: [
        "You agree to compensate Axon Arbor for reasonable losses and costs arising from your breach of these terms or your misuse of the Platform.",
      ],
      points: [],
    },
    {
      heading: "10. Ending your use",
      paragraphs: [
        "You can stop using the Platform and ask us to close your account at any time. We may pause or close an account that breaks these terms. Sections 6, 8, 9 and 12 continue to apply after an account is closed.",
      ],
      points: [],
    },
    {
      heading: "11. Changes to these terms",
      paragraphs: [
        "We may update these terms. We will change the date at the top and, for significant changes, tell account holders. Continuing to use the Platform after a change means you accept the updated terms.",
      ],
      points: [],
    },
    {
      heading: "12. Law and disputes",
      paragraphs: [
        "These terms are governed by the laws of India. Disputes will be subject to the exclusive jurisdiction of the courts at Gautam Buddh Nagar (Noida), Uttar Pradesh. We will always try to resolve concerns informally first.",
      ],
      points: [],
    },
    {
      heading: "13. Contact",
      paragraphs: [
        "Questions about these terms: info@axonarbor.in, or Axon Arbor Consulting, Jaypee Wishtown, Sector 128, Noida, Uttar Pradesh 201304, India.",
      ],
      points: [],
    },
  ],
};
