const HUBSPOT_TOKEN = process.env.HUBSPOT_PRIVATE_APP_TOKEN;

interface ContactProperties {
  firstname?: string;
  lastname?: string;
  email?: string;
  phone?: string;
  message?: string;
  lead_source?: string;
  hs_lead_status?: string;
}

export async function createOrUpdateHubSpotContact(props: ContactProperties & { pageUrl?: string; pageTitle?: string }) {
  if (!HUBSPOT_TOKEN) {
    console.warn("[LeadWidget] HUBSPOT_PRIVATE_APP_TOKEN not set — skipping HubSpot");
    return { ok: false, reason: "no_token" };
  }

  // Split name into first/last
  let firstname = props.firstname || "";
  let lastname = props.lastname || "";
  if (firstname && !lastname) {
    const parts = firstname.split(" ");
    firstname = parts[0];
    lastname = parts.slice(1).join(" ");
  }

  const properties: Record<string, string> = {
    lead_status: props.hs_lead_status || "NEW",
  };

  if (firstname) properties.firstname = firstname;
  if (lastname) properties.lastname = lastname;
  if (props.email) properties.email = props.email;
  if (props.phone) properties.phone = props.phone;
  if (props.message) properties.message = props.message;
  if (props.lead_source) properties.hs_analytics_source = props.lead_source;

  // Add page context as a note
  if (props.pageUrl) {
    properties.hs_analytics_last_url = props.pageUrl;
  }

  try {
    // Try to create a new contact
    const res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${HUBSPOT_TOKEN}`,
      },
      body: JSON.stringify({ properties }),
    });

    if (res.ok) {
      const data = await res.json();
      return { ok: true, contactId: data.id };
    }

    // If 409 conflict (contact exists), update instead
    if (res.status === 409) {
      const err = await res.json();
      const existingId = err?.message?.match(/Existing ID: (\d+)/)?.[1];
      if (existingId) {
        const updateRes = await fetch(
          `https://api.hubapi.com/crm/v3/objects/contacts/${existingId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${HUBSPOT_TOKEN}`,
            },
            body: JSON.stringify({ properties }),
          }
        );
        if (updateRes.ok) {
          return { ok: true, contactId: existingId, updated: true };
        }
      }
    }

    const errorBody = await res.text();
    console.error("[LeadWidget] HubSpot error:", res.status, errorBody);
    return { ok: false, reason: "hubspot_error", status: res.status };
  } catch (e) {
    console.error("[LeadWidget] HubSpot fetch error:", e);
    return { ok: false, reason: "network_error" };
  }
}
