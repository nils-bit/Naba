import { optionsResponse, jsonResponse } from "../cors";

// Scripted responses — replace with Claude API later
const RESPONSES: { pattern: RegExp; reply: string }[] = [
  {
    pattern: /pris|kost|hur mycket/i,
    reply: "Våra priser beror på projektets omfattning. Lämna gärna dina kontaktuppgifter i formuläret så återkommer vi med en offert!",
  },
  {
    pattern: /tid|hur lång|leverans|snabbt/i,
    reply: "De flesta projekt levereras inom 2–4 veckor. Fyll i formuläret så kan vi ge en mer exakt tidsuppskattning.",
  },
  {
    pattern: /hej|hallå|tjena|hi|hello/i,
    reply: "Hej! Vad kan jag hjälpa dig med idag?",
  },
  {
    pattern: /hjälp|help/i,
    reply: "Självklart! Du kan ställa frågor här i chatten, begära att bli uppringd via Ring-fliken, eller lämna ett meddelande via formuläret.",
  },
  {
    pattern: /tack|thank/i,
    reply: "Tack själv! Hör gärna av dig om du har fler frågor.",
  },
  {
    pattern: /ring|callback|telefon/i,
    reply: "Klicka på Ring-fliken nedan så kan du lämna ditt telefonnummer. Vi ringer dig inom kort!",
  },
  {
    pattern: /hubspot|crm|hemsida|website|sajt/i,
    reply: "Vi hjälper företag med HubSpot-implementationer, hemsidor och digitala strategier. Vill du veta mer?",
  },
];

const DEFAULT_REPLY =
  "Tack för ditt meddelande! Jag kan hjälpa dig med grundläggande frågor. För mer detaljerad hjälp, lämna gärna dina uppgifter i formuläret så hör vi av oss personligen.";

export async function OPTIONS(request: Request) {
  return optionsResponse(request);
}

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== "string") {
      return jsonResponse({ error: "message required" }, request, 400);
    }

    // Find matching scripted response
    const match = RESPONSES.find((r) => r.pattern.test(message));
    const reply = match ? match.reply : DEFAULT_REPLY;

    // TODO: Replace with Claude API call for AI-powered responses
    // const reply = await generateAIResponse(message, pageContext);

    return jsonResponse({ reply }, request);
  } catch {
    return jsonResponse({ error: "invalid request" }, request, 400);
  }
}
