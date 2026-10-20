// Shared by the browser and API. The Apps Script validates independently.
export const caseMaterials = ["zirconia", "zircomax", "emax", "veneers", "pfm", "other"] as const;
// Add only laboratory-approved steps, with matching IDs in Apps Script NEXT_STEPS.
export const requestedNextSteps: { id: string; en: string; ar: string }[] = [];
export const permanentTeeth = [1, 2, 3, 4].flatMap(q => Array.from({ length: 8 }, (_, i) => q * 10 + i + 1));
export const textLimits = { dentist: 100, clinic: 120, phone: 32, email: 254, patientReference: 80, otherMaterial: 120, shade: 60, instructions: 2000 } as const;
export type CaseData = {
  dentist: string; clinic: string; phone: string; email: string;
  patientReference: string; age: string; sex: string;
  restoration: string; otherMaterial: string; shade: string; quantity: string;
  nextStep: string; instructions: string; teeth: number[]; acknowledged: boolean;
};
export type CaseErrors = Partial<Record<keyof CaseData, "required" | "length" | "phone" | "email" | "age" | "quantity" | "choice" | "teeth" | "acknowledged">>;
export const emptyCase: CaseData = {
  dentist: "", clinic: "", phone: "", email: "", patientReference: "", age: "", sex: "",
  restoration: "", otherMaterial: "", shade: "", quantity: "1", nextStep: "",
  instructions: "", teeth: [], acknowledged: false,
};
export function latinDigits(value: string) {
  return value.replace(/[٠-٩۰-۹]/g, digit => String(digit.charCodeAt(0) - (digit >= "۰" ? 1776 : 1632)));
}
export function cleanText(value: string) {
  // Keep ordinary punctuation and multiline instructions; remove control and bidi override characters.
  return value.normalize("NFC").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g, "").trim();
}
export function normalizePhone(value: string) {
  let phone = latinDigits(value).replace(/[\s().-]/g, "");
  if (phone.startsWith("00")) phone = `+${phone.slice(2)}`;
  if (/^01[0125]\d{8}$/.test(phone)) phone = `+20${phone.slice(1)}`;
  return phone;
}
export function validateCase(input: unknown): { data: CaseData; errors: CaseErrors; valid: boolean } {
  const raw = input && typeof input === "object" && !Array.isArray(input) ? input as Record<string, unknown> : {};
  const data: CaseData = { ...emptyCase, teeth: [] };
  const errors: CaseErrors = {};
  for (const [key, limit] of Object.entries(textLimits)) {
    const field = key as keyof typeof textLimits;
    if (raw[field] !== undefined && typeof raw[field] !== "string") errors[field] = "choice";
    const value = typeof raw[field] === "string" ? raw[field] as string : "";
    if (value.length > limit) errors[field] = "length";
    data[field] = cleanText(value);
  }
  for (const key of ["age", "sex", "restoration", "quantity", "nextStep"] as const) {
    if (typeof raw[key] !== "string" || raw[key].length > 80) errors[key] = "choice";
    data[key] = typeof raw[key] === "string" ? cleanText(raw[key]) : "";
  }
  for (const key of ["dentist", "phone", "patientReference"] as const) {
    if (!data[key]) errors[key] = "required";
  }
  data.phone = normalizePhone(data.phone);
  if (data.phone && !/^\+?[1-9]\d{6,14}$/.test(data.phone)) errors.phone = "phone";
  if (data.phone.startsWith("+20") && !/^\+20(?:1[0125]\d{8}|[2-9]\d{7,8})$/.test(data.phone)) errors.phone = "phone";
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "email";
  data.age = latinDigits(data.age);
  if (data.age && (!/^\d{1,3}$/.test(data.age) || Number(data.age) > 120)) errors.age = "age";
  if (!["", "male", "female", "unspecified"].includes(data.sex)) errors.sex = "choice";
  if (!(caseMaterials as readonly string[]).includes(data.restoration)) errors.restoration = "required";
  if (data.restoration === "other" && !data.otherMaterial) errors.otherMaterial = "required";
  if (data.restoration !== "other") data.otherMaterial = "";
  data.quantity = latinDigits(data.quantity);
  if (!/^\d{1,3}$/.test(data.quantity) || Number(data.quantity) < 1 || Number(data.quantity) > 999) errors.quantity = "quantity";
  if (data.nextStep && !requestedNextSteps.some(step => step.id === data.nextStep)) errors.nextStep = "choice";
  if (!Array.isArray(raw.teeth) || raw.teeth.length < 1 || raw.teeth.length > 32 ||
    raw.teeth.some(t => typeof t !== "number" || !permanentTeeth.includes(t)) ||
    new Set(raw.teeth).size !== raw.teeth.length) errors.teeth = "teeth";
  else data.teeth = [...raw.teeth].sort((a, b) => a - b);
  data.acknowledged = raw.acknowledged === true;
  if (!data.acknowledged) errors.acknowledged = "acknowledged";
  return { data, errors, valid: Object.keys(errors).length === 0 };
}
