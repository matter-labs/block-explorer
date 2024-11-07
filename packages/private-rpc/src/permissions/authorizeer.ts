import { Address, Hex, toFunctionSelector } from 'viem';
import {
  AccessDeniedRule,
  AccessRule,
  GroupRule,
  Permission,
  PublicRule,
} from '@/permissions/access-rules';
import YAML from 'yaml';
import { z } from 'zod';
import { hexSchema } from '@/db/hex-row';
import { Group } from '@/permissions/group';
import { YamlParser } from '@/permissions/yaml-parser';

const yamlParser = z.object({
  groups: z.array(
    z.object({
      name: z.string(),
      members: z.array(hexSchema),
    }),
  ),

  contracts: z.array(
    z.object({
      address: hexSchema,
      methods: z.array(
        z
          .object({
            selector: z.optional(hexSchema),
            signature: z.optional(z.string()),
            read: z.union([z.literal('public'), z.array(z.string())]),
            write: z.union([z.literal('public'), z.array(z.string())]),
          })
          .refine(
            (obj) => obj.signature !== undefined || obj.selector !== undefined,
          ),
      ),
    }),
  ),
});

export class Authorizer {
  permissions: Map<string, AccessRule>;

  constructor(permissions: Permission[]) {
    this.permissions = new Map();
    for (const permission of permissions) {
      this.permissions.set(permission.key, permission.rule);
    }
  }

  checkContractRead(address: Address, method: Hex, user: Address) {
    const rule =
      this.permissions.get(`read_contract:${address}:${method}`) ||
      new AccessDeniedRule();
    return rule.canDo(user);
  }

  checkContractWrite(address: Address, method: Hex, user: Address) {
    const rule =
      this.permissions.get(`write_contract:${address}:${method}`) ||
      new AccessDeniedRule();
    return rule.canDo(user);
  }

  static fromBuffer(buf: Buffer): Authorizer {
    const raw = YAML.parse(buf.toString());
    return new YamlParser(raw).parse();
  }
}
