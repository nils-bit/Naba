import { optionsResponse, jsonResponse } from "../cors";
import { createOrUpdateHubSpotContact } from "@/lib/hubspot";
import { notifyNewLead } from "@/lib/notify";

export async function OPTIONS(request: Request) {
  return optionsResponse(request);
}

export async function POST(request: Request) {
  try {
    const { name, email, phone, message, pageUrl, pageTitle } = await request.json();

    if (!email && !phone) {
      return jsonResponse({ error: "email or phone required" }, request, 400);
    }

    const result = await createOrUpdateHubSpotContact({
      firstname: name || "",
      email: email || undefined,
      phone: phone || undefined,
      message: message || undefined,
      hs_lead_status: "NEW",
      lead_source: "Contact Form Widget",
      pageUrl,
      pageTitle,
    });

    console.log("[LeadWidget] Form submission:", { name, email, phone, pageUrl, result });

    await notifyNewLead("form", { name, email, phone, message, pageUrl });

    return jsonResponse({ ok: true, hubspot: result }, request);
  } catch {
    return jsonResponse({ error: "invalid request" }, request, 400);
  }
}
