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
exports.PublicController = void 0;
const common_1 = require("@nestjs/common");
const rawLog = globalThis.console.log.bind(globalThis.console);
const rawError = globalThis.console.error.bind(globalThis.console);
const public_service_1 = require("./public.service");
let PublicController = class PublicController {
    publicService;
    constructor(publicService) {
        this.publicService = publicService;
    }
    async getFeaturedWorks(limit = '5') {
        const limitNum = Math.min(parseInt(limit, 10) || 5, 20);
        return this.publicService.getFeaturedWorks(limitNum);
    }
    async getWorkList(page = '1', pageSize = '12', category) {
        const pageNum = parseInt(page, 10) || 1;
        const pageSizeNum = Math.min(parseInt(pageSize, 10) || 12, 50);
        return this.publicService.getWorkList({
            page: pageNum,
            pageSize: pageSizeNum,
            category: category || undefined,
        });
    }
    async getWorkDetail(id) {
        const work = await this.publicService.getWorkById(id);
        if (!work) {
            throw new common_1.NotFoundException('作品不存在');
        }
        return work;
    }
    async getNextWork(id) {
        const work = await this.publicService.getNextWork(id);
        if (!work) {
            throw new common_1.NotFoundException('没有更多作品');
        }
        return work;
    }
    async getSiteSettings() {
        return this.publicService.getSiteSettings();
    }
    async getKeywordRules() {
        return this.publicService.getKeywordRules();
    }
    async submitMessage(req, body) {
        rawLog(`[PublicController] POST /api/public/messages rawBody=${JSON.stringify(req.body)} name="${body?.name}" email="${body?.email}" content_len=${body?.content?.length ?? 0}`);
        if (!body?.name?.trim()) {
            rawError(`[PublicController] Validation FAILED: name is empty, body keys=${Object.keys(body || {})}`);
            throw new common_1.BadRequestException('请输入姓名');
        }
        if (!body?.email?.trim()) {
            rawError(`[PublicController] Validation FAILED: email is empty`);
            throw new common_1.BadRequestException('请输入邮箱');
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(body.email)) {
            rawError(`[PublicController] Validation FAILED: invalid email format "${body.email}"`);
            throw new common_1.BadRequestException('邮箱格式不正确');
        }
        if (!body?.content?.trim()) {
            rawError(`[PublicController] Validation FAILED: content is empty`);
            throw new common_1.BadRequestException('请输入留言内容');
        }
        try {
            const result = await this.publicService.submitMessage(body);
            rawLog(`[PublicController] Message submitted successfully: id=${result.id}`);
            return result;
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            rawError(`[PublicController] submitMessage FAILED: ${msg}`);
            if (err instanceof Error && err.stack) {
                rawError(`[PublicController] Stack: ${err.stack}`);
            }
            throw err;
        }
    }
};
exports.PublicController = PublicController;
__decorate([
    (0, common_1.Get)('works/featured'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PublicController.prototype, "getFeaturedWorks", null);
__decorate([
    (0, common_1.Get)('works'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('pageSize')),
    __param(2, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], PublicController.prototype, "getWorkList", null);
__decorate([
    (0, common_1.Get)('works/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PublicController.prototype, "getWorkDetail", null);
__decorate([
    (0, common_1.Get)('works/:id/next'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PublicController.prototype, "getNextWork", null);
__decorate([
    (0, common_1.Get)('site-settings'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PublicController.prototype, "getSiteSettings", null);
__decorate([
    (0, common_1.Get)('keyword-rules'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PublicController.prototype, "getKeywordRules", null);
__decorate([
    (0, common_1.Post)('messages'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PublicController.prototype, "submitMessage", null);
exports.PublicController = PublicController = __decorate([
    (0, common_1.Controller)('api/public'),
    __metadata("design:paramtypes", [public_service_1.PublicService])
], PublicController);
