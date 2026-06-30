type SubscribeForm = HTMLFormElement & {
  dataset: DOMStringMap;
};

type InquiryForm = HTMLFormElement & {
  dataset: DOMStringMap;
};

function getUtm(name: string) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name) ?? "";
}

type Attribution = {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term: string;
  utm_content: string;
  referrer: string;
  landing: string;
};

const ATTR_KEY = "rbmd-attribution";

// First-touch attribution: snapshot the source params + landing page ONCE, on the
// first page of the visit, and persist for the session. This is the fix for the
// common case where someone arrives on a UTM-tagged link, browses a few clean-URL
// pages (losing the query string), then converts — without this, every acq_* field
// would come back empty for that lead.
function recordFirstTouch() {
  try {
    if (sessionStorage.getItem(ATTR_KEY)) return;
    const data: Attribution = {
      utm_source: getUtm("utm_source"),
      utm_medium: getUtm("utm_medium"),
      utm_campaign: getUtm("utm_campaign"),
      utm_term: getUtm("utm_term"),
      utm_content: getUtm("utm_content"),
      referrer: document.referrer || "direct",
      landing: window.location.pathname + window.location.search,
    };
    sessionStorage.setItem(ATTR_KEY, JSON.stringify(data));
  } catch {
    /* storage unavailable */
  }
}

// Read the first-touch snapshot, falling back to the current URL per-field so
// attribution still works even if sessionStorage is unavailable.
function attribution(): Attribution {
  let stored: Partial<Attribution> = {};
  try {
    stored = JSON.parse(sessionStorage.getItem(ATTR_KEY) || "{}");
  } catch {
    /* ignore */
  }
  return {
    utm_source: stored.utm_source || getUtm("utm_source"),
    utm_medium: stored.utm_medium || getUtm("utm_medium"),
    utm_campaign: stored.utm_campaign || getUtm("utm_campaign"),
    utm_term: stored.utm_term || getUtm("utm_term"),
    utm_content: stored.utm_content || getUtm("utm_content"),
    referrer: stored.referrer || document.referrer || "direct",
    landing: stored.landing || window.location.pathname + window.location.search,
  };
}

// Coarse device class for "where do mobile vs desktop leads convert" reporting.
function deviceClass() {
  const ua = navigator.userAgent;
  if (/iPad|Tablet/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone/i.test(ua)) return "mobile";
  return "desktop";
}

// Human-readable source for GA4 `lead_source`: prefer an explicit utm_source,
// then the first-touch referrer hostname, else "direct".
function leadSource() {
  const attr = attribution();
  if (attr.utm_source) return attr.utm_source;
  if (!attr.referrer || attr.referrer === "direct") return "direct";
  try {
    return new URL(attr.referrer).hostname.replace(/^www\./, "");
  } catch {
    return "referral";
  }
}

function trackEvent(name: string, params: Record<string, string | number>) {
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag === "function") gtag("event", name, params);
}

function setStatus(form: HTMLFormElement, message: string) {
  const status = form.querySelector<HTMLElement>("[data-form-status]");
  if (status) status.textContent = message;
}

const SUBSCRIBED_KEY = "rbmd-subscribed";

function markSubscribed() {
  try {
    localStorage.setItem(SUBSCRIBED_KEY, "1");
  } catch {
    /* storage unavailable */
  }
}

function hasSubscribed() {
  try {
    return localStorage.getItem(SUBSCRIBED_KEY) === "1";
  } catch {
    return false;
  }
}

// Swap the form for a confirmation that gives the reader a clear next step,
// turning a one-time capture into engagement.
function showSuccess(form: HTMLFormElement, isLeadMagnet: boolean) {
  const card = form.closest(".cta-block, .gate-card, .mini-form, .modal-card") ?? form.parentElement;
  const target = card instanceof HTMLElement ? card : form;
  const next = isLeadMagnet
    ? "Check your inbox — your free download is on its way."
    : "You're on the list. Watch your inbox for Robin's next edition.";
  target.innerHTML = `
    <div class="form-success" role="status">
      <span class="form-success-check" aria-hidden="true">✓</span>
      <h3>You're in.</h3>
      <p>${next}</p>
      <a class="btn btn-secondary btn-sm" href="https://www.instagram.com/robinberzinmd" target="_blank" rel="noopener noreferrer">Follow Robin on Instagram</a>
    </div>`;
}

async function submitForm(form: SubscribeForm) {
  const formData = new FormData(form);
  const attr = attribution();
  // Conversion context (last touch).
  formData.set("sourcePage", window.location.pathname);
  formData.set("device", deviceClass());
  // First-touch source (survives multi-page sessions).
  formData.set("referrer", attr.referrer);
  formData.set("landingPage", attr.landing);
  formData.set("utmSource", attr.utm_source);
  formData.set("utmMedium", attr.utm_medium);
  formData.set("utmCampaign", attr.utm_campaign);
  formData.set("utmTerm", attr.utm_term);
  formData.set("utmContent", attr.utm_content);
  setStatus(form, "Submitting...");
  const response = await fetch("/api/subscribe/", {
    method: "POST",
    body: formData,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    setStatus(form, result.message || "Something went wrong. Please try again.");
    return;
  }
  // GA4 recommended `generate_lead` event. `value` + `currency` are required for
  // the stock Generate-leads report to compute lead value; the rest are
  // segmentation dimensions (register these as custom dimensions in GA4 Admin).
  trackEvent("generate_lead", {
    method: "newsletter",
    value: 1,
    currency: "USD",
    lead_source: leadSource(),
    placement: String(formData.get("placement") || ""),
    lead_magnet: String(formData.get("leadMagnet") || ""),
    source_page: String(formData.get("sourcePage") || ""),
    category: String(formData.get("category") || ""),
  });
  const leadMagnetValue = String(formData.get("leadMagnet") || "");
  markSubscribed();
  closeModal();
  const gate = form.closest("[data-article-gate]");
  if (gate) {
    unlockGate(gate);
    form.reset();
    setStatus(form, result.message || "Unlocked. Enjoy the full article.");
    return;
  }
  form.reset();
  showSuccess(form, Boolean(leadMagnetValue && leadMagnetValue !== "newsletter"));
}

function unlockGate(gate: Element) {
  gate.classList.add("is-unlocked");
  const key = gate.getAttribute("data-storage-key");
  if (key) {
    try {
      localStorage.setItem(`rbmd-gate:${key}`, "1");
    } catch {
      /* storage unavailable */
    }
  }
}

function initGates() {
  for (const gate of document.querySelectorAll("[data-article-gate]")) {
    const key = gate.getAttribute("data-storage-key");
    if (key) {
      try {
        if (localStorage.getItem(`rbmd-gate:${key}`)) gate.classList.add("is-unlocked");
      } catch {
        /* storage unavailable */
      }
    }
    const reveal = gate.querySelector("[data-gate-reveal]");
    reveal?.addEventListener("click", () => unlockGate(gate));
  }
}

// ---- Exit-intent / scroll capture modal -------------------------------------

const MODAL_SEEN_KEY = "rbmd-modal-seen";
const MODAL_COOLDOWN_DAYS = 14;

function modalRecentlySeen() {
  try {
    const ts = Number(localStorage.getItem(MODAL_SEEN_KEY) || "0");
    return ts > 0 && Date.now() - ts < MODAL_COOLDOWN_DAYS * 86_400_000;
  } catch {
    return false;
  }
}

function getModal() {
  return document.querySelector<HTMLElement>("[data-newsletter-modal]");
}

let modalArmed = false;

function openModal() {
  const modal = getModal();
  if (!modal || modal.classList.contains("is-open")) return;
  if (hasSubscribed() || modalRecentlySeen()) return;
  modal.classList.add("is-open");
  modal.removeAttribute("hidden");
  try {
    localStorage.setItem(MODAL_SEEN_KEY, String(Date.now()));
  } catch {
    /* storage unavailable */
  }
  modal.querySelector<HTMLInputElement>("input[type=email]")?.focus();
}

function closeModal() {
  const modal = getModal();
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("hidden", "");
}

function initModal() {
  const modal = getModal();
  if (!modal || modalArmed) return;
  if (hasSubscribed()) return; // never nag a known subscriber
  modalArmed = true;

  modal.querySelectorAll("[data-modal-close]").forEach((el) =>
    el.addEventListener("click", closeModal)
  );
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
  });

  // Desktop: exit intent (cursor leaves toward the top/address bar).
  const onExit = (event: MouseEvent) => {
    if (event.clientY <= 0) openModal();
  };
  document.addEventListener("mouseout", onExit);

  // Mobile/touch: scroll depth past ~55% of the page.
  let scrollFired = false;
  const onScroll = () => {
    if (scrollFired) return;
    const scrolled = window.scrollY + window.innerHeight;
    const depth = scrolled / document.documentElement.scrollHeight;
    if (depth >= 0.55) {
      scrollFired = true;
      openModal();
      window.removeEventListener("scroll", onScroll);
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
}

async function submitInquiry(form: InquiryForm) {
  const formData = new FormData(form);
  if (!formData.get("sourcePage")) {
    formData.set("sourcePage", window.location.pathname);
  }
  setStatus(form, "Sending...");
  const response = await fetch(form.action || "/api/inquiry/", {
    method: "POST",
    body: formData,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    setStatus(form, result.message || "Something went wrong. Please try again.");
    return;
  }
  const inquiryType = String(formData.get("inquiryType") || "");
  // Inquiries (media / podcast / speaking / advisory) are leads too — fire the
  // canonical `generate_lead` so they show in the stock Generate-leads report,
  // plus a granular `contact_submit` for funnel detail. Booking leads are worth
  // more than a newsletter signup, so weight the value higher.
  trackEvent("generate_lead", {
    method: "inquiry",
    value: 10,
    currency: "USD",
    lead_source: leadSource(),
    inquiry_type: inquiryType,
    source_page: String(formData.get("sourcePage") || ""),
  });
  trackEvent("contact_submit", { inquiry_type: inquiryType });
  form.reset();
  setStatus(form, result.message || "Thank you. Your inquiry was sent.");
}

function initForms() {
  for (const form of document.querySelectorAll<SubscribeForm>("[data-subscribe-form]")) {
    if (form.dataset.formBound === "true") continue;
    form.dataset.formBound = "true";
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      submitForm(form).catch(() => setStatus(form, "Something went wrong. Please try again."));
    });
  }

  for (const form of document.querySelectorAll<InquiryForm>("[data-inquiry-form]")) {
    if (form.dataset.formBound === "true") continue;
    form.dataset.formBound = "true";
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      submitInquiry(form).catch(() => setStatus(form, "Something went wrong. Please try again."));
    });
  }

  initGates();
  initModal();
}

// Capture first-touch source/landing as early as possible, before binding forms.
recordFirstTouch();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initForms, { once: true });
} else {
  initForms();
}
