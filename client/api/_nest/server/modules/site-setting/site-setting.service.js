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
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("../../database/schema");
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
    async getSettings() {
        const rows = await this.db
            .select({ settingKey: schema_1.siteSetting.settingKey, settingValue: schema_1.siteSetting.settingValue })
            .from(schema_1.siteSetting)
            .where((0, drizzle_orm_1.inArray)(schema_1.siteSetting.settingKey, ALL_KEYS));
        const map = new Map();
        for (const row of rows) {
            map.set(row.settingKey, row.settingValue);
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
            .insert(schema_1.siteSetting)
            .values(values)
            .onConflictDoUpdate({
            target: schema_1.siteSetting.settingKey,
            set: { settingValue: (0, drizzle_orm_1.sql) `EXCLUDED.setting_value` },
        });
        return { success: true };
    }
};
exports.SiteSettingService = SiteSettingService;
exports.SiteSettingService = SiteSettingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(connection_1.DRIZZLE_DATABASE)),
    __metadata("design:paramtypes", [Function])
], SiteSettingService);
