import { SetMetadata } from '@nestjs/common';

export const NEED_ADMIN_KEY = 'needAdmin';
export const NeedAdmin = () => SetMetadata(NEED_ADMIN_KEY, true);
