"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SiteSettingService = void 0;
const common_1 = require("@nestjs/common");
const connection_1 = require("../../database/connection");
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
};
const ALL_KEYS = Object.values(SETTING_KEYS);
let SiteSettingService = class SiteSettingService {
    db;
    constructor(db) {
        this.db = db;
    }
    get sql() {
        return this.db.$client;
    }
    async getSettings() {
        rawLog('[SiteSettingService.getSettings] STEP1 enter');
        rawLog('[SiteSettingService.getSettings] STEP2 before SQL');
        const rows = await this.sql `
      SELECT setting_key, setting_value
      FROM site_setting
      WHERE setting_key = ANY(${this.sql.array(ALL_KEYS)}::text[])
    `;
        rawLog(`[SiteSettingService.getSettings] STEP3 SQL returned rows=${rows.length}`);
        const map = new Map();
        for (const row of rows) {
            map.set(row.setting_key, row.setting_value);
        }
        const get = (key) => map.get(key) ?? '';
        let services = [];
        try {
            const raw = get(SETTING_KEYS.services);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    services = parsed;
                }
            }
        }
        catch {
            services = [];
        }
        let designProcess = [];
        try {
            const raw = get(SETTING_KEYS.designProcess);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    designProcess = parsed;
                }
            }
        }
        catch {
            designProcess = [];
        }
        const contact = {
            phone: get(SETTING_KEYS.contactPhone),
            email: get(SETTING_KEYS.contactEmail),
            address: get(SETTING_KEYS.contactAddress),
        };
        const footer = {
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
    async updateSettings(settings) {
        rawLog('[SiteSettingService.updateSettings] STEP1 enter');
        const values = [
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
        const promises = values.map((v) => sql `
        INSERT INTO site_setting (setting_key, setting_value)
        VALUES (${v.key}, ${v.value})
        ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, _updated_at = CURRENT_TIMESTAMP
      `);
        await Promise.all(promises);
        rawLog('[SiteSettingService.updateSettings] STEP3 SQL completed');
        return { success: true };
    }
};
exports.SiteSettingService = SiteSettingService;
exports.SiteSettingService = SiteSettingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(connection_1.DRIZZLE_DATABASE)),
    __metadata("design:paramtypes", [Function])
], SiteSettingService);
