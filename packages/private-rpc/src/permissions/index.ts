import { Authorizer, Permission, GroupRule } from '@/permissions/group';

const CONTRACT_1 = '0x0000000000000000000000000000000000008008';
const CONTRACT_1_METHOD_1 = '0x62f84b24';
const USER_1 = '0xb4e748293eb03143b2268abd81e5c8e822086911';

const allPermissions = [
  Permission.contractRead(
    CONTRACT_1,
    CONTRACT_1_METHOD_1,
    new GroupRule([USER_1]),
  ),
];

export const authorizer = new Authorizer(allPermissions);
