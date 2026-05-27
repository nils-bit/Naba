import { optionsResponse, jsonResponse } from "../cors";
import { createOrUpdateHubSpotContact } from "@/lib/hubspot";
import { notifyNewLead } from "@/lib/notify";

export async function OPTIONS(request: Request) {
  return optionsResponse(request);
}

export async function POST(request: Request) {
  try {
    const { name, phone, pageUrl, pageTitle } = await request.json();

    if (!phone || typeof phone !== "string") {
      return jsonResponse({ error: "phone required" }, request, 400);
    }

    const result = await createOrUpdateHubSpotContact({
      firstname: name || "",
      phone,
      hs_lead_status: "NEW",
      lead_source: "Callback Widget",
      pageUrl,
      pageTitle,
    });

    console.log("[LeadWidget] Callback request:", { name, phone, pageUrl, result });

    await notifyNewLead("callback", { name, phone, pageUrl });

    return jsonResponse({ ok: true, hubspot: result }, request);
  } catch {
    return jsonResponse({ error: "invalid request" }, request, 400);
  }
}
