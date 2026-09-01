import { getSiteContent } from "@/lib/data";
import { defaultSocialLinks, type SocialLinks } from "@/types/social";

export async function getSocialLinks(): Promise<SocialLinks> {
  const content = await getSiteContent("social_links");
  if (!content || typeof content !== "object") {
    return defaultSocialLinks;
  }
  return { ...defaultSocialLinks, ...(content as Partial<SocialLinks>) };
}
