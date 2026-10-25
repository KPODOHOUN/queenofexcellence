import { getSiteContent } from "@/lib/data";
import { defaultSocialLinks, type SocialLinks } from "@/types/social";

/** Corrige les liens collés avec le nom du réseau devant l'URL. */
export function normalizeSocialUrl(raw: string): string {
  let url = raw.trim();
  if (!url) return "";

  url = url.replace(
    /^(YouTube|Facebook|TikTok|Instagram|WhatsApp|Whatsapp)(\s+groupe\s+Whatsapp)?\s+/i,
    ""
  );

  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url.replace(/^\/+/, "")}`;
  }

  return url;
}

export function normalizeSocialLinks(links: Partial<SocialLinks>): SocialLinks {
  const out = { ...defaultSocialLinks };
  for (const key of Object.keys(defaultSocialLinks) as (keyof SocialLinks)[]) {
    const val = links[key];
    if (typeof val === "string") {
      out[key] = normalizeSocialUrl(val);
    }
  }
  return out;
}

export async function getSocialLinks(): Promise<SocialLinks> {
  const content = await getSiteContent("social_links");
  if (!content || typeof content !== "object") {
    return defaultSocialLinks;
  }
  return normalizeSocialLinks(content as Partial<SocialLinks>);
}
