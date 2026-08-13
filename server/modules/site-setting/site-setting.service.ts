import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_DATABASE } from '../../database/connection';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { inArray, sql } from 'drizzle-orm';

import { siteSetting } from '../../database/schema';
import type {
  SiteSettings,
  ServiceItem,
  ProcessStep,
  ContactInfo,
  FooterInfo,
} from '@shared/api.interface';

const SETTING_KEYS = {
  siteTitle: 'site_title',
  companyName: 'company_name',
  logoImage: 'logo_image',
  heroSlogan: 'hero_slogan',
  heroSubtitle: 'hero_subtitle',
  aboutUs: 'about_us',
  services: 'services',
  designProcess: 'design_process',
  contactPhone: 'contact_phone',
  contactEmail: 'contact_email',
  contactAddress: 'contact_address',
  footerCopyright: 'footer_copyright',
  footerSocialLinks: 'footer_social_links',
} as const;

const ALL_KEYS = Object.values(SETTING_KEYS);

@Injectable()
export class SiteSettingService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async getSettings(): Promise<SiteSettings> {
    const rows = await this.db
      .select({ settingKey: siteSetting.settingKey, settingValue: siteSetting.settingValue })
      .from(siteSetting)
      .where(inArray(siteSetting.settingKey, ALL_KEYS));

    const map = new Map<string, string>();
    for (const row of rows) {
      map.set(row.settingKey, row.settingValue);
    }

    const get = (key: string): string => map.get(key) ?? '';

    let services: ServiceItem[] = [];
    try {
      const raw = get(SETTING_KEYS.services);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          services = parsed as ServiceItem[];
        }
      }
    } catch {
      services = [];
    }

    let designProcess: ProcessStep[] = [];
    try {
      const raw = get(SETTING_KEYS.designProcess);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          designProcess = parsed as ProcessStep[];
        }
      }
    } catch {
      designProcess = [];
    }

    const contact: ContactInfo = {
      phone: get(SETTING_KEYS.contactPhone),
      email: get(SETTING_KEYS.contactEmail),
      address: get(SETTING_KEYS.contactAddress),
    };

    const footer: FooterInfo = {
      copyright: get(SETTING_KEYS.footerCopyright),
      socialLinks: get(SETTING_KEYS.footerSocialLinks),
    };

    return {
      siteTitle: get(SETTING_KEYS.siteTitle),
      companyName: get(SETTING_KEYS.companyName),
      logoImage: get(SETTING_KEYS.logoImage),
      heroSlogan: get(SETTING_KEYS.heroSlogan),
      heroSubtitle: get(SETTING_KEYS.heroSubtitle),
      aboutUs: get(SETTING_KEYS.aboutUs),
      services,
      designProcess,
      contact,
      footer,
    };
  }

  async updateSettings(settings: SiteSettings): Promise<{ success: true }> {
    const values = [
      { settingKey: SETTING_KEYS.siteTitle, settingValue: settings.siteTitle },
      { settingKey: SETTING_KEYS.companyName, settingValue: settings.companyName },
      { settingKey: SETTING_KEYS.logoImage, settingValue: settings.logoImage },
      { settingKey: SETTING_KEYS.heroSlogan, settingValue: settings.heroSlogan },
      { settingKey: SETTING_KEYS.heroSubtitle, settingValue: settings.heroSubtitle },
      { settingKey: SETTING_KEYS.aboutUs, settingValue: settings.aboutUs },
      { settingKey: SETTING_KEYS.services, settingValue: JSON.stringify(settings.services) },
      { settingKey: SETTING_KEYS.designProcess, settingValue: JSON.stringify(settings.designProcess) },
      { settingKey: SETTING_KEYS.contactPhone, settingValue: settings.contact.phone },
      { settingKey: SETTING_KEYS.contactEmail, settingValue: settings.contact.email },
      { settingKey: SETTING_KEYS.contactAddress, settingValue: settings.contact.address },
      { settingKey: SETTING_KEYS.footerCopyright, settingValue: settings.footer.copyright },
      { settingKey: SETTING_KEYS.footerSocialLinks, settingValue: settings.footer.socialLinks },
    ];

    await this.db
      .insert(siteSetting)
      .values(values)
      .onConflictDoUpdate({
        target: siteSetting.settingKey,
        set: { settingValue: sql`EXCLUDED.setting_value` },
      });

    return { success: true };
  }
}
