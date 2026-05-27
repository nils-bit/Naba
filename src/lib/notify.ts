const RESEND_API_KEY = process.env.RESEND_API_KEY;
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || "nils@purasu.se";

type LeadType = "callback" | "form" | "chat";

interface LeadDetails {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  pageUrl?: string;
}

function buildEmailHtml(type: LeadType, details: LeadDetails): string {
  const typeLabel =
    type === "callback"
      ? "Callback-förfrågan"
      : type === "form"
        ? "Formulär"
        : "Chatt";

  const rows: string[] = [];

  if (details.name) {
    rows.push(`<tr><td style="padding:6px 12px;font-weight:600;color:#555;">Namn</td><td style="padding:6px 12px;">${esc(details.name)}</td></tr>`);
  }
  if (details.email) {
    rows.push(`<tr><td style="padding:6px 12px;font-weight:600;color:#555;">E-post</td><td style="padding:6px 12px;"><a href="mailto:${esc(details.email)}">${esc(details.email)}</a></td></tr>`);
  }
  if (details.phone) {
    rows.push(`<tr><td style="padding:6px 12px;font-weight:600;color:#555;">Telefon</td><td style="padding:6px 12px;"><a href="tel:${esc(details.phone)}">${esc(details.phone)}</a></td></tr>`);
  }
  if (details.message) {
    rows.push(`<tr><td style="padding:6px 12px;font-weight:600;color:#555;vertical-align:top;">Meddelande</td><td style="padding:6px 12px;">${esc(details.message)}</td></tr>`);
  }
  if (details.pageUrl) {
    rows.push(`<tr><td style="padding:6px 12px;font-weight:600;color:#555;">Sida</td><td style="padding:6px 12px;"><a href="${esc(details.pageUrl)}">${esc(details.pageUrl)}</a></td></tr>`);
  }

  const ctaButton = details.phone
    ? `<div style="margin-top:24px;text-align:center;">
        <a href="tel:${esc(details.phone)}" style="display:inline-block;padding:12px 28px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;font-size:16px;">Ring tillbaka</a>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f4f4f5;">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:#2563eb;padding:20px 24px;">
      <h1 style="margin:0;color:#fff;font-size:18px;font-weight:600;">Nytt lead — ${esc(typeLabel)}</h1>
    </div>
    <div style="padding:24px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#333;">
        ${rows.join("\n        ")}
      </table>
      ${ctaButton}
    </div>
    <div style="padding:12px 24px;background:#f9fafb;text-align:center;font-size:12px;color:#999;">
      Leadwidget &middot; Purasu
    </div>
  </div>
</body>
</html>`;
}

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function notifyNewLead(type: LeadType, details: LeadDetails) {
  if (!RESEND_API_KEY) {
    console.warn("[LeadWidget] RESEND_API_KEY not set — skipping email notification");
    return;
  }

  const subject =
    type === "callback"
      ? `Ny callback-förfrågan från ${details.name || details.phone || "okänd"}`
      : `Nytt lead via ${type === "form" ? "formulär" : "chatt"} — ${details.name || details.email || "okänd"}`;

  const html = buildEmailHtml(type, details);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Leadwidget <leads@purasu.agency>",
        to: NOTIFY_EMAIL,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      console.error("[LeadWidget] Resend API error:", res.status, await res.text());
    }
  } catch (e) {
    console.error("[LeadWidget] Email notification failed:", e);
  }
}
