import { ContractRule, Group, MethodRule } from '@/permissions/group';
import { Address } from 'viem';

const CONTRACT_1 = '0x0000000000000000000000000000000000008008';
const USER_1 = '0xb4e748293eb03143b2268abd81e5c8e822086911';

const rule1 = new ContractRule(CONTRACT_1, {
  '0x62f84b24': new MethodRule([new Group([USER_1])], []),
});

const ruleList = [rule1];

export const allRules = ruleList.reduce<Record<Address, ContractRule>>(
  (a, b) => {
    a[b.address] = b;
    return a;
  },
  {},
);

export type RulesType = typeof allRules;
