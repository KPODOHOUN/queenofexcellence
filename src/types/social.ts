export interface SocialLinks {
  youtube: string;
  facebook: string;
  tiktok: string;
  instagram: string;
  whatsapp: string;
}

export const defaultSocialLinks: SocialLinks = {
  youtube: "",
  facebook: "",
  tiktok: "",
  instagram: "",
  whatsapp: "",
};

export const socialPlatforms: {
  key: keyof SocialLinks;
  label: string;
  placeholder: string;
  hint: string;
}[] = [
  {
    key: "youtube",
    label: "YouTube",
    placeholder: "https://youtube.com/@votre-chaine",
    hint: "URL complète de votre chaîne YouTube",
  },
  {
    key: "facebook",
    label: "Facebook",
    placeholder: "https://facebook.com/votre-page",
    hint: "URL de votre page Facebook",
  },
  {
    key: "tiktok",
    label: "TikTok",
    placeholder: "https://tiktok.com/@votre-compte",
    hint: "URL de votre profil TikTok",
  },
  {
    key: "instagram",
    label: "Instagram",
    placeholder: "https://instagram.com/votre-compte",
    hint: "URL de votre profil Instagram",
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    placeholder: "https://wa.me/237600000000",
    hint: "Lien wa.me ou api.whatsapp.com avec indicatif pays",
  },
];
