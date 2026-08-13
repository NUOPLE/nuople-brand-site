"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NeedAdmin = exports.NEED_ADMIN_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.NEED_ADMIN_KEY = 'needAdmin';
const NeedAdmin = () => (0, common_1.SetMetadata)(exports.NEED_ADMIN_KEY, true);
exports.NeedAdmin = NeedAdmin;
