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

function trackEvent(name: string, params: Record<string, string>) {
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag === "function") gtag("event", name, params);
}

function setStatus(form: HTMLFormElement, message: string) {
  const status = form.querySelector<HTMLElement>("[data-form-status]");
  if (status) status.textContent = message;
}

async function submitForm(form: SubscribeForm) {
  const formData = new FormData(form);
  formData.set("sourcePage", window.location.pathname);
  formData.set("utmSource", getUtm("utm_source"));
  formData.set("utmMedium", getUtm("utm_medium"));
  formData.set("utmCampaign", getUtm("utm_campaign"));
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
  trackEvent("generate_lead", {
    method: "newsletter",
    placement: String(formData.get("placement") || ""),
    lead_magnet: String(formData.get("leadMagnet") || ""),
  });
  form.reset();
  setStatus(form, result.message || "You're subscribed.");
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
  trackEvent("contact_submit", {
    inquiry_type: String(formData.get("inquiryType") || ""),
  });
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
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initForms, { once: true });
} else {
  initForms();
}
