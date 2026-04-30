import { db } from "@workspace/db";
import { siteSettings } from "@workspace/db/schema";
import { inArray } from "drizzle-orm";

const CONTACT_KEYS = [
  "contact_phone",
  "contact_email",
  "whatsapp_number",
  "address_line1",
  "address_city",
  "maps_url",
  "facebook_url",
  "youtube_url",
  "instagram_url",
] as const;

export type ContactSettings = {
  contact_phone: string;
  contact_email: string;
  whatsapp_number: string;
  address_line1: string;
  address_city: string;
  maps_url: string;
  facebook_url: string;
  youtube_url: string;
  instagram_url: string;
};

const DEFAULTS: ContactSettings = {
  contact_phone: "+91 98765 43210",
  contact_email: "info@pinnacleacademic.in",
  whatsapp_number: "+919876543210",
  address_line1: "Plot No. 45, Knowledge Park II, Greater Noida",
  address_city: "Uttar Pradesh — 201306",
  maps_url: "https://maps.google.com/?q=Greater+Noida+UP",
  facebook_url: "https://facebook.com",
  youtube_url: "https://youtube.com",
  instagram_url: "https://instagram.com",
};

export async function getContactSettings(): Promise<ContactSettings> {
  try {
    const rows = await db
      .select({ key: siteSettings.key, value: siteSettings.value })
      .from(siteSettings)
      .where(inArray(siteSettings.key, [...CONTACT_KEYS]));

    const map = Object.fromEntries(rows.map((r) => [r.key, r.value])) as Partial<ContactSettings>;
    return { ...DEFAULTS, ...map };
  } catch {
    return DEFAULTS;
  }
}
