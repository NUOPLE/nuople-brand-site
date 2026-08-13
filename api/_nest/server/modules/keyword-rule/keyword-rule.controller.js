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
exports.KeywordRuleController = void 0;
const common_1 = require("@nestjs/common");
const keyword_rule_service_1 = require("./keyword-rule.service");
const admin_auth_guard_1 = require("../../common/guards/admin-auth.guard");
let KeywordRuleController = class KeywordRuleController {
    keywordRuleService;
    constructor(keywordRuleService) {
        this.keywordRuleService = keywordRuleService;
    }
    async list() {
        return this.keywordRuleService.list();
    }
    async create(body) {
        return this.keywordRuleService.create(body);
    }
    async update(id, body) {
        return this.keywordRuleService.update(id, body);
    }
    async remove(id) {
        return this.keywordRuleService.remove(id);
    }
    async move(id, body) {
        return this.keywordRuleService.move(id, body);
    }
};
exports.KeywordRuleController = KeywordRuleController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], KeywordRuleController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], KeywordRuleController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], KeywordRuleController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], KeywordRuleController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/move'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], KeywordRuleController.prototype, "move", null);
exports.KeywordRuleController = KeywordRuleController = __decorate([
    (0, common_1.Controller)('api/keyword-rules'),
    (0, common_1.UseGuards)(admin_auth_guard_1.AdminAuthGuard),
    __metadata("design:paramtypes", [keyword_rule_service_1.KeywordRuleService])
], KeywordRuleController);
