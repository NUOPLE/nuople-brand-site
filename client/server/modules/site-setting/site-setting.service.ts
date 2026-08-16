import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_DATABASE } from '../../database/connection';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import type {
  SiteSettings,
  ServiceItem,
  ProcessStep,
  ContactInfo,
  FooterInfo,
} from '@shared/api.interface';

const rawLog = globalThis.console.log.bind(globalThis.console);
const rawError = globalThis.console.error.bind(globalThis.console);

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

interface SettingRow {
  setting_key: string;
  setting_value: string;
}

@Injectable()
export class SiteSettingService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  private get sql(): ReturnType<typeof import('postgres')> {
    return (this.db as unknown as { $client: ReturnType<typeof import('postgres')> }).$client;
  }

  async getSettings(): Promise<SiteSettings> {
    rawLog('[SiteSettingService.getSettings] STEP1 enter');

    rawLog('[SiteSettingService.getSettings] STEP2 before SQL');
    const rows = await this.sql`
      SELECT setting_key, setting_value
      FROM site_setting
      WHERE setting_key = ANY(${this.sql.array(ALL_KEYS)}::text[])
    `;
    rawLog(`[SiteSettingService.getSettings] STEP3 SQL returned rows=${rows.length}`);

    const map = new Map<string, string>();
    for (const row of rows as unknown as SettingRow[]) {
      map.set(row.setting_key, row.setting_value);
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
    rawLog('[SiteSettingService.updateSettings] STEP1 enter');

    const values: Array<{ key: string; value: string }> = [
      { key: SETTING_KEYS.siteTitle, value: settings.siteTitle },
      { key: SETTING_KEYS.companyName, value: settings.companyName },
      { key: SETTING_KEYS.logoImage, value: settings.logoImage },
      { key: SETTING_KEYS.heroSlogan, value: settings.heroSlogan },
      { key: SETTING_KEYS.heroSubtitle, value: settings.heroSubtitle },
      { key: SETTING_KEYS.aboutUs, value: settings.aboutUs },
      { key: SETTING_KEYS.services, value: JSON.stringify(settings.services) },
      { key: SETTING_KEYS.designProcess, value: JSON.stringify(settings.designProcess) },
      { key: SETTING_KEYS.contactPhone, value: settings.contact.phone },
      { key: SETTING_KEYS.contactEmail, value: settings.contact.email },
      { key: SETTING_KEYS.contactAddress, value: settings.contact.address },
      { key: SETTING_KEYS.footerCopyright, value: settings.footer.copyright },
      { key: SETTING_KEYS.footerSocialLinks, value: settings.footer.socialLinks },
    ];

    rawLog(`[SiteSettingService.updateSettings] STEP2 before SQL (${values.length} keys)`);
    const sql = this.sql;
    const promises = values.map((v) =>
      sql`
        INSERT INTO site_setting (setting_key, setting_value)
        VALUES (${v.key}, ${v.value})
        ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, _updated_at = CURRENT_TIMESTAMP
      `,
    );
    await Promise.all(promises);
    rawLog('[SiteSettingService.updateSettings] STEP3 SQL completed');

    return { success: true };
  }
}
