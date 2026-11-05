/** Wording of the account emails. Draft, awaiting approval (see ACCOUNT_EMAILS in .env.example). */

const SIGN_OFF = "The Axon Arbor team";
/** Letters only, so a form can't be used to send someone a link or other text. */
const firstName = (name: string) => {
  const first = name.trim().split(" ")[0];
  return /^[\p{L}'’-]{1,40}$/u.test(first) ? first : "there";
};
const lines = (...parts: string[]) => parts.join("\n\n");

export function companyRequestReceived(name: string, confirmUrl: string) {
  return {
    subject: "We’ve received your registration",
    text: lines(
      `Hi ${firstName(name)},`,
      "Thank you for registering your organisation with Axon Arbor. We check every organisation before granting access, and we’ll be in touch once yours has been reviewed.",
      `Please confirm your email address to help us review it: ${confirmUrl}`,
      "The link works for 7 days. If you didn’t register, you can ignore this email.",
      SIGN_OFF,
    ),
  };
}

export function companyWelcome(name: string, company: string, signInUrl: string, manager: string | null) {
  return {
    subject: "Welcome to Axon Arbor",
    text: lines(
      `Hi ${firstName(name)},`,
      `${company} is approved. You can now sign in: ${signInUrl}`,
      ...(manager ? [`Your account manager is ${manager}, who will be your point of contact.`] : []),
      SIGN_OFF,
    ),
  };
}

export function consultantWelcome(name: string, accountUrl: string) {
  return {
    subject: "Welcome to Axon Arbor",
    text: lines(
      `Hi ${firstName(name)},`,
      `Thank you for joining the Axon Arbor network. Your next step is to complete your profile and submit it for review: ${accountUrl}`,
      "Our team reviews every profile before it goes live, and your name, photo and contact details stay private.",
      SIGN_OFF,
    ),
  };
}

/** For anyone added by the team: they choose their own password from the link. */
export function invitedWelcome(name: string, setPasswordUrl: string) {
  return {
    subject: "Welcome to Axon Arbor",
    text: lines(
      `Hi ${firstName(name)},`,
      `Axon Arbor has set up your account. Choose a password to get started: ${setPasswordUrl}`,
      "The link works for 30 days.",
      SIGN_OFF,
    ),
  };
}

export function passwordReset(setPasswordUrl: string) {
  return {
    subject: "Reset your Axon Arbor password",
    text: lines(
      "Hello,",
      `We received a request to reset your password. Choose a new one here: ${setPasswordUrl}`,
      "The link works once, for one hour. If you didn’t ask for this, you can ignore this email and your password will stay the same.",
      SIGN_OFF,
    ),
  };
}

export function enquiryReceived(name: string) {
  return {
    subject: "We’ve received your message",
    text: lines(
      `Hi ${firstName(name)},`,
      "Thank you for contacting Axon Arbor. We’ve received your message and someone from our team will be in touch shortly.",
      SIGN_OFF,
    ),
  };
}
