import { SetMetadata } from '@nestjs/common';

export const OWNER_OR_ADMIN_PARAM_KEY = 'ownerOrAdminParamKey';

export const OwnerOrAdmin = (paramKey = 'id') =>
  SetMetadata(OWNER_OR_ADMIN_PARAM_KEY, paramKey);
