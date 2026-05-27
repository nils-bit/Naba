(function () {
  "use strict";

  // --- Configuration ---
  const scriptTag = document.currentScript;
  const CONFIG = {
    apiBase: scriptTag?.getAttribute("data-api") || scriptTag?.src.replace(/\/widget\/leadwidget\.js.*$/, "") || "https://purasu.agency",
    company: scriptTag?.getAttribute("data-company") || "Purasu",
    color: scriptTag?.getAttribute("data-color") || "#FF6B35",
    greeting: scriptTag?.getAttribute("data-greeting") || "Hej! Hur kan vi hjälpa dig?",
    position: scriptTag?.getAttribute("data-position") || "right",
    lang: scriptTag?.getAttribute("data-lang") || "sv",
  };

  // --- Prevent double-init ---
  if (window.__leadWidgetLoaded) return;
  window.__leadWidgetLoaded = true;

  // --- Labels ---
  const L =
    CONFIG.lang === "sv"
      ? {
          ring: "Ring",
          chatt: "Chatt",
          formular: "Formulär",
          sendBtn: "Skicka",
          callTitle: "Vi ringer dig inom 30 sek!",
          callDesc: "Lämna ditt nummer — helt kostnadsfritt, helt utan förpliktelser.",
          callBtn: "Ring mig nu",
          callTrust: "Ingen väntetid • Gratis",
          callSuccess: "Tack! Vi ringer dig snart.",
          formTitle: "Kontakta oss",
          formBtn: "Skicka",
          formSuccess: "Tack! Vi hör av oss.",
          name: "Namn",
          email: "E-post",
          phone: "Telefon",
          message: "Meddelande",
          placeholder: "Skriv ett meddelande…",
          typing: "skriver…",
          online: "Online",
          poweredBy: "Leadwidget by Purasu",
        }
      : {
          ring: "Call",
          chatt: "Chat",
          formular: "Form",
          sendBtn: "Send",
          callTitle: "We’ll call you in 30 seconds!",
          callDesc: "Leave your number — completely free, no obligations.",
          callBtn: "Call me now",
          callTrust: "No wait time • Free",
          callSuccess: "Thanks! We’ll call you soon.",
          formTitle: "Contact us",
          formBtn: "Send",
          formSuccess: "Thanks! We’ll be in touch.",
          name: "Name",
          email: "Email",
          phone: "Phone",
          message: "Message",
          placeholder: "Type a message…",
          typing: "typing…",
          online: "Online",
          poweredBy: "Leadwidget by Purasu",
        };

  // --- Styles ---
  const CSS = `
    :host {
      all: initial;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #1a1a2e;
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    /* Floating button */
    .lw-fab {
      position: fixed;
      bottom: 24px;
      ${CONFIG.position === "left" ? "left: 24px;" : "right: 24px;"}
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: ${CONFIG.color};
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0,0,0,0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s;
      z-index: 2147483647;
    }
    .lw-fab:hover { transform: scale(1.1); box-shadow: 0 6px 28px rgba(0,0,0,0.3); }
    .lw-fab svg { width: 28px; height: 28px; fill: white; transition: transform 0.3s; }
    .lw-fab.open svg { transform: rotate(90deg); }

    .lw-badge {
      position: absolute;
      top: -2px;
      right: -2px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #e74c3c;
      color: white;
      font-size: 11px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid white;
    }

    /* Panel */
    .lw-panel {
      position: fixed;
      bottom: 100px;
      ${CONFIG.position === "left" ? "left: 24px;" : "right: 24px;"}
      width: 380px;
      max-height: 560px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 12px 48px rgba(0,0,0,0.15);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: 2147483646;
      opacity: 0;
      transform: translateY(20px) scale(0.95);
      pointer-events: none;
      transition: opacity 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
                  transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .lw-panel.visible {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }

    /* Header */
    .lw-header {
      background: ${CONFIG.color};
      color: white;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .lw-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(255,255,255,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 16px;
      flex-shrink: 0;
    }
    .lw-header-text h3 { font-size: 16px; font-weight: 600; margin: 0; }
    .lw-header-text span {
      font-size: 12px;
      opacity: 0.85;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .lw-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #4ade80;
      display: inline-block;
    }
    .lw-close {
      margin-left: auto;
      background: none;
      border: none;
      cursor: pointer;
      color: white;
      opacity: 0.7;
      padding: 4px;
      transition: opacity 0.2s;
    }
    .lw-close:hover { opacity: 1; }
    .lw-close svg { width: 20px; height: 20px; fill: currentColor; }

    /* Tabs */
    .lw-tabs {
      display: flex;
      border-top: 1px solid #eee;
      background: #fafafa;
    }
    .lw-tab {
      flex: 1;
      padding: 10px 8px;
      border: none;
      background: none;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      color: #888;
      font-size: 11px;
      font-weight: 500;
      transition: color 0.2s, background 0.2s;
      position: relative;
    }
    .lw-tab:hover { background: #f0f0f0; }
    .lw-tab.active { color: ${CONFIG.color}; }
    .lw-tab.active::after {
      content: '';
      position: absolute;
      top: 0;
      left: 20%;
      right: 20%;
      height: 2px;
      background: ${CONFIG.color};
      border-radius: 0 0 2px 2px;
    }
    .lw-tab svg { width: 20px; height: 20px; fill: currentColor; }

    /* Content area */
    .lw-body {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }

    /* Chat */
    .lw-messages {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 10px;
      min-height: 200px;
      max-height: 320px;
    }
    .lw-msg {
      max-width: 80%;
      padding: 10px 14px;
      border-radius: 16px;
      font-size: 14px;
      line-height: 1.4;
      animation: lw-fade-in 0.3s ease;
    }
    @keyframes lw-fade-in {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .lw-msg.bot {
      background: #f1f3f5;
      color: #1a1a2e;
      align-self: flex-start;
      border-bottom-left-radius: 4px;
    }
    .lw-msg.user {
      background: ${CONFIG.color};
      color: white;
      align-self: flex-end;
      border-bottom-right-radius: 4px;
    }
    .lw-typing {
      align-self: flex-start;
      padding: 10px 14px;
      background: #f1f3f5;
      border-radius: 16px;
      border-bottom-left-radius: 4px;
      display: none;
    }
    .lw-typing.show { display: flex; gap: 4px; align-items: center; }
    .lw-typing-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #aaa;
      animation: lw-bounce 1.4s infinite ease-in-out both;
    }
    .lw-typing-dot:nth-child(1) { animation-delay: 0s; }
    .lw-typing-dot:nth-child(2) { animation-delay: 0.16s; }
    .lw-typing-dot:nth-child(3) { animation-delay: 0.32s; }
    @keyframes lw-bounce {
      0%, 80%, 100% { transform: scale(0.6); }
      40% { transform: scale(1); }
    }

    .lw-input-row {
      display: flex;
      padding: 12px 16px;
      gap: 8px;
      border-top: 1px solid #eee;
      background: white;
    }
    .lw-input-row input {
      flex: 1;
      border: 1px solid #ddd;
      border-radius: 24px;
      padding: 10px 16px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
      font-family: inherit;
    }
    .lw-input-row input:focus { border-color: ${CONFIG.color}; }
    .lw-input-row button {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: none;
      background: ${CONFIG.color};
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s;
      flex-shrink: 0;
    }
    .lw-input-row button:hover { transform: scale(1.05); }
    .lw-input-row button svg { width: 18px; height: 18px; fill: white; }

    /* Callback tab */
    .lw-callback, .lw-form-tab {
      padding: 24px 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .lw-callback h4, .lw-form-tab h4 {
      font-size: 18px;
      font-weight: 600;
      color: #1a1a2e;
    }
    .lw-callback p {
      font-size: 14px;
      color: #666;
      line-height: 1.5;
    }
    .lw-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .lw-field label {
      font-size: 12px;
      font-weight: 600;
      color: #555;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .lw-field input, .lw-field textarea {
      border: 1px solid #ddd;
      border-radius: 10px;
      padding: 12px 14px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
      font-family: inherit;
      resize: vertical;
    }
    .lw-field input:focus, .lw-field textarea:focus { border-color: ${CONFIG.color}; }
    .lw-field textarea { min-height: 80px; }
    .lw-submit {
      padding: 14px;
      border-radius: 10px;
      border: none;
      background: ${CONFIG.color};
      color: white;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s, transform 0.2s;
      font-family: inherit;
    }
    .lw-submit:hover { opacity: 0.9; transform: translateY(-1px); }
    .lw-submit:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

    .lw-success {
      text-align: center;
      padding: 40px 20px;
      display: none;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      animation: lw-fade-in 0.4s ease;
    }
    .lw-success.show { display: flex; }
    .lw-success-icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #dcfce7;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .lw-success-icon svg { width: 28px; height: 28px; fill: #22c55e; }
    .lw-success p { font-size: 16px; font-weight: 500; color: #1a1a2e; }

    /* Footer */
    .lw-footer {
      padding: 8px;
      text-align: center;
      font-size: 10px;
      color: #bbb;
      border-top: 1px solid #f0f0f0;
    }
    .lw-footer a {
      color: #999;
      text-decoration: none;
    }
    .lw-footer a:hover { color: ${CONFIG.color}; }

    /* Mobile */
    @media (max-width: 480px) {
      .lw-panel {
        bottom: 0;
        left: 0;
        right: 0;
        width: 100%;
        max-height: 85vh;
        border-radius: 16px 16px 0 0;
        transform: translateY(100%);
      }
      .lw-panel.visible {
        transform: translateY(0);
      }
    }

    /* Callback pulse animation */
    .lw-callback-pulse {
      display: inline-block;
      animation: lw-pulse 2s ease-in-out infinite;
    }
    @keyframes lw-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    .lw-callback-phone-icon {
      display: inline-block;
      margin-right: 6px;
      animation: lw-phone-ring 1.2s ease-in-out infinite;
      vertical-align: middle;
    }
    @keyframes lw-phone-ring {
      0%, 100% { transform: rotate(0deg); }
      10% { transform: rotate(14deg); }
      20% { transform: rotate(-10deg); }
      30% { transform: rotate(10deg); }
      40% { transform: rotate(-6deg); }
      50% { transform: rotate(0deg); }
    }
    .lw-trust {
      text-align: center;
      font-size: 12px;
      color: #888;
      letter-spacing: 0.3px;
      margin-top: -4px;
    }

    /* Hidden content sections */
    .lw-content { display: none; flex-direction: column; flex: 1; }
    .lw-content.active { display: flex; }
  `;

  // --- Icons ---
  const ICONS = {
    chat: '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z"/></svg>',
    phone: '<svg viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>',
    form: '<svg viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 15h8v2H8v-2zm0-3h8v2H8v-2z"/></svg>',
    send: '<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>',
  };

  // --- Build DOM ---
  const host = document.createElement("div");
  host.id = "leadwidget-host";
  const shadow = host.attachShadow({ mode: "closed" });

  const style = document.createElement("style");
  style.textContent = CSS;
  shadow.appendChild(style);

  // FAB button
  const fab = document.createElement("button");
  fab.className = "lw-fab";
  fab.innerHTML = ICONS.chat + '<span class="lw-badge">1</span>';
  shadow.appendChild(fab);

  // Panel
  const panel = document.createElement("div");
  panel.className = "lw-panel";
  panel.innerHTML = `
    <div class="lw-header">
      <div class="lw-avatar">${CONFIG.company.charAt(0).toUpperCase()}</div>
      <div class="lw-header-text">
        <h3>${CONFIG.company}</h3>
        <span><span class="lw-dot"></span> ${L.online}</span>
      </div>
      <button class="lw-close">${ICONS.close}</button>
    </div>

    <!-- Chat content -->
    <div class="lw-content active" data-tab="chatt">
      <div class="lw-messages">
        <div class="lw-msg bot">${CONFIG.greeting}</div>
        <div class="lw-typing">
          <span class="lw-typing-dot"></span>
          <span class="lw-typing-dot"></span>
          <span class="lw-typing-dot"></span>
        </div>
      </div>
      <div class="lw-input-row">
        <input type="text" placeholder="${L.placeholder}" />
        <button>${ICONS.send}</button>
      </div>
    </div>

    <!-- Callback content -->
    <div class="lw-content" data-tab="ring">
      <div class="lw-callback">
        <h4 class="lw-callback-pulse"><span class="lw-callback-phone-icon">${ICONS.phone.replace('viewBox="0 0 24 24"', 'viewBox="0 0 24 24" width="22" height="22" style="fill:' + CONFIG.color + ';vertical-align:middle"')}</span>${L.callTitle}</h4>
        <p>${L.callDesc}</p>
        <div class="lw-field">
          <label>${L.name}</label>
          <input type="text" id="cb-name" placeholder="Anna Svensson" />
        </div>
        <div class="lw-field">
          <label>${L.phone}</label>
          <input type="tel" id="cb-phone" placeholder="070-123 45 67" />
        </div>
        <button class="lw-submit" id="cb-submit">${L.callBtn}</button>
        <div class="lw-trust">${L.callTrust}</div>
      </div>
      <div class="lw-success" id="cb-success">
        <div class="lw-success-icon">${ICONS.check}</div>
        <p>${L.callSuccess}</p>
      </div>
    </div>

    <!-- Form content -->
    <div class="lw-content" data-tab="formular">
      <div class="lw-form-tab">
        <h4>${L.formTitle}</h4>
        <div class="lw-field">
          <label>${L.name}</label>
          <input type="text" id="form-name" placeholder="Anna Svensson" />
        </div>
        <div class="lw-field">
          <label>${L.email}</label>
          <input type="email" id="form-email" placeholder="anna@example.com" />
        </div>
        <div class="lw-field">
          <label>${L.phone}</label>
          <input type="tel" id="form-phone" placeholder="070-123 45 67" />
        </div>
        <div class="lw-field">
          <label>${L.message}</label>
          <textarea id="form-message" placeholder="${L.placeholder}"></textarea>
        </div>
        <button class="lw-submit" id="form-submit">${L.formBtn}</button>
      </div>
      <div class="lw-success" id="form-success">
        <div class="lw-success-icon">${ICONS.check}</div>
        <p>${L.formSuccess}</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="lw-tabs">
      <button class="lw-tab" data-target="ring">${ICONS.phone}<span>${L.ring}</span></button>
      <button class="lw-tab active" data-target="chatt">${ICONS.chat}<span>${L.chatt}</span></button>
      <button class="lw-tab" data-target="formular">${ICONS.form}<span>${L.formular}</span></button>
    </div>

    <div class="lw-footer"><a href="https://purasu.agency" target="_blank">${L.poweredBy}</a></div>
  `;
  shadow.appendChild(panel);

  // --- State ---
  let isOpen = false;
  const pageUrl = window.location.href;
  const pageTitle = document.title;

  // --- Helpers ---
  function $(sel) { return panel.querySelector(sel); }
  function $$(sel) { return panel.querySelectorAll(sel); }

  async function apiPost(endpoint, body) {
    try {
      const res = await fetch(`${CONFIG.apiBase}/api/widget/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, pageUrl, pageTitle }),
      });
      return await res.json();
    } catch (e) {
      console.error("[LeadWidget]", e);
      return { error: true };
    }
  }

  // --- Toggle panel ---
  function toggle() {
    isOpen = !isOpen;
    panel.classList.toggle("visible", isOpen);
    fab.classList.toggle("open", isOpen);
    if (isOpen) {
      const badge = fab.querySelector(".lw-badge");
      if (badge) badge.remove();
      fab.innerHTML = ICONS.close;
      fab.classList.add("open");
    } else {
      fab.innerHTML = ICONS.chat;
      fab.classList.remove("open");
    }
  }

  fab.addEventListener("click", toggle);
  panel.querySelector(".lw-close").addEventListener("click", toggle);

  // --- Tab switching ---
  $$(".lw-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      $$(".lw-tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      $$(".lw-content").forEach((c) => c.classList.remove("active"));
      panel.querySelector(`.lw-content[data-tab="${tab.dataset.target}"]`).classList.add("active");
    });
  });

  // --- Chat ---
  const messagesEl = $(".lw-messages");
  const typingEl = $(".lw-typing");
  const chatInput = $(".lw-input-row input");
  const chatSend = $(".lw-input-row button");

  function addMessage(text, sender) {
    const msg = document.createElement("div");
    msg.className = `lw-msg ${sender}`;
    msg.textContent = text;
    messagesEl.insertBefore(msg, typingEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showTyping() { typingEl.classList.add("show"); messagesEl.scrollTop = messagesEl.scrollHeight; }
  function hideTyping() { typingEl.classList.remove("show"); }

  async function sendChat() {
    const text = chatInput.value.trim();
    if (!text) return;
    chatInput.value = "";
    addMessage(text, "user");
    showTyping();

    const data = await apiPost("chat", { message: text });
    hideTyping();

    if (data.reply) {
      addMessage(data.reply, "bot");
    } else {
      addMessage(CONFIG.lang === "sv"
        ? "Tyvärr kunde jag inte svara just nu. Prova att lämna ett meddelande via formuläret!"
        : "Sorry, I couldn’t respond right now. Try leaving a message via the form!",
        "bot"
      );
    }
  }

  chatSend.addEventListener("click", sendChat);
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendChat();
  });

  // --- Callback ---
  const cbSubmit = $("#cb-submit");
  const cbSuccess = $("#cb-success");

  cbSubmit.addEventListener("click", async () => {
    const name = $("#cb-name").value.trim();
    const phone = $("#cb-phone").value.trim();
    if (!phone) { $("#cb-phone").focus(); return; }

    cbSubmit.disabled = true;
    cbSubmit.textContent = "...";
    await apiPost("callback", { name, phone });

    $(".lw-callback").style.display = "none";
    cbSuccess.classList.add("show");
    setTimeout(() => {
      $(".lw-callback").style.display = "";
      cbSuccess.classList.remove("show");
      cbSubmit.disabled = false;
      cbSubmit.textContent = L.callBtn;
      $("#cb-name").value = "";
      $("#cb-phone").value = "";
    }, 4000);
  });

  // --- Form ---
  const formSubmit = $("#form-submit");
  const formSuccess = $("#form-success");

  formSubmit.addEventListener("click", async () => {
    const name = $("#form-name").value.trim();
    const email = $("#form-email").value.trim();
    const phone = $("#form-phone").value.trim();
    const message = $("#form-message").value.trim();
    if (!email && !phone) { $("#form-email").focus(); return; }

    formSubmit.disabled = true;
    formSubmit.textContent = "...";
    await apiPost("lead", { name, email, phone, message });

    $(".lw-form-tab").style.display = "none";
    formSuccess.classList.add("show");
    setTimeout(() => {
      $(".lw-form-tab").style.display = "";
      formSuccess.classList.remove("show");
      formSubmit.disabled = false;
      formSubmit.textContent = L.formBtn;
      $("#form-name").value = "";
      $("#form-email").value = "";
      $("#form-phone").value = "";
      $("#form-message").value = "";
    }, 4000);
  });

  // --- Mount ---
  document.body.appendChild(host);
})();
