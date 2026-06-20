export type SubscribePayload = {
  email: string;
  firstName?: string;
  sourcePage?: string;
  placement?: string;
  leadMagnet?: string;
  articleSlug?: string;
  category?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
};

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
}

export function readString(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}
