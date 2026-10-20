import { handleCaseSubmission } from "@/lib/case-backend";

export const runtime = "nodejs";
export const maxDuration = 60;
export const POST = handleCaseSubmission;
