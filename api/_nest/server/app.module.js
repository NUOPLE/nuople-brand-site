"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const fullstack_nestjs_core_1 = require("@lark-apaas/fullstack-nestjs-core");
const exception_filter_1 = require("./common/filters/exception.filter");
const view_module_1 = require("./modules/view/view.module");
const auth_module_1 = require("./modules/auth/auth.module");
const dashboard_module_1 = require("./modules/dashboard/dashboard.module");
const work_module_1 = require("./modules/work/work.module");
const message_module_1 = require("./modules/message/message.module");
const keyword_rule_module_1 = require("./modules/keyword-rule/keyword-rule.module");
const site_setting_module_1 = require("./modules/site-setting/site-setting.module");
const public_module_1 = require("./modules/public/public.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            fullstack_nestjs_core_1.PlatformModule.forRoot(),
            auth_module_1.AuthModule,
            dashboard_module_1.DashboardModule,
            work_module_1.WorkModule,
            message_module_1.MessageModule,
            keyword_rule_module_1.KeywordRuleModule,
            site_setting_module_1.SiteSettingModule,
            public_module_1.PublicModule,
            view_module_1.ViewModule,
        ],
        providers: [
            {
                provide: core_1.APP_FILTER,
                useClass: exception_filter_1.GlobalExceptionFilter,
            },
        ],
    })
], AppModule);
