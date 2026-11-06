// Shared by the browser and API. The Apps Script validates independently.
export const caseMaterials = ["zirconia", "zircomax", "emax", "veneers", "pfm", "other"] as const;
// Add only laboratory-approved steps, with matching IDs in Apps Script NEXT_STEPS.
export const requestedNextSteps: { id: string; en: string; ar: string }[] = [];
export const permanentTeeth = [1, 2, 3, 4].flatMap(q => Array.from({ length: 8 }, (_, i) => q * 10 + i + 1));
export const textLimits = { dentist: 100, clinic: 120, phone: 32, email: 254, patientReference: 80, instructions: 2000, externalLink: 500 } as const;
export const toothTextLimits = { otherMaterial: 120, shade: 60, notes: 300 } as const;
export const maxTotalAttachmentBytes = 3.5 * 1024 * 1024; // 3.5 MB max direct base64 upload
export const maxAttachmentCount = 5;

// Version 2 has one restoration unit per tooth. Version 3 adds file attachments and Drive storage.
export const caseSchemaVersion = 3;
export type ToothRestoration = { toothNumber: string; material: string; otherMaterial: string; shade: string; notes: string };
export type CaseAttachment = { name: string; mimeType: string; data: string; size: number };

export function newTooth(toothNumber: string): ToothRestoration {
  return { toothNumber, material: "", otherMaterial: "", shade: "", notes: "" };
}
export function reconcileTeeth(current: ToothRestoration[], selected: number[]) {
  return [...selected].sort((a, b) => a - b).map(number => current.find(t => t.toothNumber === String(number)) ?? newTooth(String(number)));
}
export const restorationQuantity = (teeth: ToothRestoration[]) => teeth.length;
export function applyToothDefaults(teeth: ToothRestoration[], selected: string[], material: string, otherMaterial: string, shade?: string) {
  return teeth.map(tooth => selected.includes(tooth.toothNumber) ? {
    ...tooth, material, otherMaterial: material === "other" ? otherMaterial : "",
    ...(shade !== undefined ? { shade } : {}),
  } : tooth);
}
export type CaseData = {
  dentist: string; clinic: string; phone: string; email: string;
  patientReference: string; age: string; sex: string;
  nextStep: string; instructions: string; teeth: ToothRestoration[];
  externalLink: string;
  attachments: CaseAttachment[];
  acknowledged: boolean;
};
export type ErrorCode = "required" | "length" | "phone" | "email" | "age" | "choice" | "teeth" | "configuration" | "attachments" | "externalLink" | "acknowledged";
export type CaseErrors = Partial<Record<keyof CaseData, ErrorCode>>;
export type ToothErrors = Record<string, Partial<Record<"material" | keyof typeof toothTextLimits, ErrorCode>>>;
export const emptyCase: CaseData = {
  dentist: "", clinic: "", phone: "", email: "", patientReference: "", age: "", sex: "",
  nextStep: "",
  instructions: "", teeth: [],
  externalLink: "",
  attachments: [],
  acknowledged: false,
};
export function latinDigits(value: string) {
  return value.replace(/[٠-٩۰-۹]/g, digit => String(digit.charCodeAt(0) - (digit >= "۰" ? 1776 : 1632)));
}
export function cleanText(value: string) {
  // Keep ordinary punctuation and multiline instructions; remove control and bidi override characters.
  return value.normalize("NFC").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g, "").trim();
}
export function sanitizeFilename(name: string) {
  return cleanText(name).replace(/[/\\]/g, "_").slice(0, 150);
}
export function normalizePhone(value: string) {
  let phone = latinDigits(value).replace(/[\s().-]/g, "");
  if (phone.startsWith("00")) phone = `+${phone.slice(2)}`;
  if (/^01[0125]\d{8}$/.test(phone)) phone = `+20${phone.slice(1)}`;
  return phone;
}
export function validateCase(input: unknown): { data: CaseData; errors: CaseErrors; toothErrors: ToothErrors; valid: boolean } {
  const raw = input && typeof input === "object" && !Array.isArray(input) ? input as Record<string, unknown> : {};
  const data: CaseData = { ...emptyCase, teeth: [], attachments: [] };
  const errors: CaseErrors = {};
  const toothErrors: ToothErrors = {};
  for (const [key, limit] of Object.entries(textLimits)) {
    const field = key as keyof typeof textLimits;
    if (raw[field] !== undefined && typeof raw[field] !== "string") errors[field] = "choice";
    const value = typeof raw[field] === "string" ? raw[field] as string : "";
    if (value.length > limit) errors[field] = "length";
    data[field] = cleanText(value);
  }
  for (const key of ["age", "sex", "nextStep"] as const) {
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
  if (data.nextStep && !requestedNextSteps.some(step => step.id === data.nextStep)) errors.nextStep = "choice";
  const seen = new Set<string>();
  if (!Array.isArray(raw.teeth) || raw.teeth.length < 1 || raw.teeth.length > 32) errors.teeth = "teeth";
  else for (const rawTooth of raw.teeth) {
    if (!rawTooth || typeof rawTooth !== "object" || Array.isArray(rawTooth) ||
      typeof rawTooth.toothNumber !== "string" || !/^[1-4][1-8]$/.test(rawTooth.toothNumber) || seen.has(rawTooth.toothNumber)) {
      errors.teeth = "teeth"; continue;
    }
    seen.add(rawTooth.toothNumber);
    const tooth = newTooth(rawTooth.toothNumber);
    const rowErrors: ToothErrors[string] = {};
    if (typeof rawTooth.material !== "string" || !(caseMaterials as readonly string[]).includes(rawTooth.material)) rowErrors.material = "required";
    else tooth.material = rawTooth.material;
    for (const [key, limit] of Object.entries(toothTextLimits)) {
      const field = key as keyof typeof toothTextLimits;
      const value = rawTooth[field] === undefined ? "" : rawTooth[field];
      if (typeof value !== "string") rowErrors[field] = "choice";
      else {
        if (value.length > limit) rowErrors[field] = "length";
        tooth[field] = cleanText(value);
      }
    }
    if (tooth.material === "other" && !tooth.otherMaterial) rowErrors.otherMaterial = "required";
    if (tooth.material !== "other") tooth.otherMaterial = "";
    if (Object.keys(rowErrors).length) { toothErrors[tooth.toothNumber] = rowErrors; errors.teeth ||= "configuration"; }
    data.teeth.push(tooth);
  }
  data.teeth.sort((a, b) => Number(a.toothNumber) - Number(b.toothNumber));

  // Validate externalLink
  if (data.externalLink) {
    if (!/^https?:\/\/[^\s$.?#].[^\s]*$/i.test(data.externalLink)) {
      errors.externalLink = "choice";
    }
  }

  // Validate attachments
  if (raw.attachments !== undefined) {
    if (!Array.isArray(raw.attachments)) {
      errors.attachments = "choice";
    } else if (raw.attachments.length > maxAttachmentCount) {
      errors.attachments = "length";
    } else {
      let totalBytes = 0;
      for (const item of raw.attachments) {
        if (!item || typeof item !== "object" || Array.isArray(item)) {
          errors.attachments = "choice";
          break;
        }
        const rawAtt = item as Record<string, unknown>;
        const name = typeof rawAtt.name === "string" ? sanitizeFilename(rawAtt.name) : "";
        const mimeType = typeof rawAtt.mimeType === "string" ? cleanText(rawAtt.mimeType).slice(0, 100) : "application/octet-stream";
        const dataStr = typeof rawAtt.data === "string" ? rawAtt.data : "";
        const size = typeof rawAtt.size === "number" && Number.isSafeInteger(rawAtt.size) && rawAtt.size > 0 ? rawAtt.size : 0;
        if (!name || !dataStr || size <= 0) {
          errors.attachments = "choice";
          break;
        }
        totalBytes += size;
        if (totalBytes > maxTotalAttachmentBytes) {
          errors.attachments = "length";
          break;
        }
        data.attachments.push({ name, mimeType, data: dataStr, size });
      }
    }
  }

  // Reject obsolete case-wide values rather than silently discarding contradictory prescriptions.
  if (["restoration", "otherMaterial", "shade", "quantity"].some(key => key in raw)) errors.teeth = "configuration";
  data.acknowledged = raw.acknowledged === true;
  if (!data.acknowledged) errors.acknowledged = "acknowledged";
  return { data, errors, toothErrors, valid: Object.keys(errors).length === 0 };
}
