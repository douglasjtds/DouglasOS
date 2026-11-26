/**
 * Non-localized personal data (single source of truth for contact surfaces).
 * Content that needs translation lives in messages/*.json instead.
 */
export const PROFILE = {
  name: "Douglas Tertuliano",
  email: "douglasjtds@gmail.com",
  linkedin: "https://www.linkedin.com/in/douglasjtds",
  github: "https://github.com/douglasjtds",
  whatsapp: "https://wa.me/5531991848090?text=Hey%20Douglas!",
} as const;

/** The CV download (`public/resume.pdf`), shared by the launcher and the text version. */
export const RESUME = {
  href: "/resume.pdf",
  filename: "Douglas-Tertuliano-CV.pdf",
} as const;
