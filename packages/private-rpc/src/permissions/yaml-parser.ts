import { z } from 'zod';
import { hexSchema } from '@/db/hex-row';
import { Group } from '@/permissions/group';
import { Authorizer } from '@/permissions/authorizeer';
import { Address, Hex, toFunctionSelector } from 'viem';
import {
  AccessRule,
  GroupRule,
  Permission,
  PublicRule,
} from '@/permissions/access-rules';

const PUBLIC_LITERAL = '*';
const methodSchema = z
  .object({
    selector: z.optional(hexSchema),
    signature: z.optional(z.string()),
    read: z.union([z.literal(PUBLIC_LITERAL), z.array(z.string())]),
    write: z.union([z.literal(PUBLIC_LITERAL), z.array(z.string())]),
  })
  .refine((obj) => obj.signature !== undefined || obj.selector !== undefined);
type RawMethod = z.infer<typeof methodSchema>;

const yamlSchema = z.object({
  groups: z.array(
    z.object({
      name: z.string(),
      members: z.array(hexSchema),
    }),
  ),

  contracts: z.array(
    z.object({
      address: hexSchema,
      methods: z.array(methodSchema),
    }),
  ),
});

export class YamlParser {
  private yaml: z.infer<typeof yamlSchema>;
  private groups: Group[];

  constructor(yaml: unknown) {
    this.yaml = yamlSchema.parse(yaml);
    this.groups = this.yaml.groups.map(
      ({ name, members }) => new Group(name, members),
    );
  }

  private extractSelector(method: RawMethod): Hex {
    if (method.selector !== undefined) {
      return method.selector;
    } else if (method.signature !== undefined) {
      return toFunctionSelector(method.signature);
    } else {
      throw new Error('cannot extract selector');
    }
  }

  private membersForGroup(groupName: string): Address[] {
    return (
      this.groups
        .filter((g) => g.name === groupName)
        .map((g) => g.members)
        .flat() || ([] as Address[])
    );
  }

  private extractRule(method: RawMethod, key: 'read' | 'write'): AccessRule {
    if (method[key] === PUBLIC_LITERAL) {
      return new PublicRule();
    } else {
      const members = method[key]
        .map((name) => this.membersForGroup(name))
        .flat();
      return new GroupRule(members);
    }
  }

  parse(): Authorizer {
    const permissions = this.yaml.contracts.map((rawContract) => {
      const readPermissions = rawContract.methods.map((method) => {
        const selector = this.extractSelector(method);
        const readRule = this.extractRule(method, 'read');
        const writeRule = this.extractRule(method, 'write');

        return [
          Permission.contractRead(rawContract.address, selector, readRule),
          Permission.contractWrite(rawContract.address, selector, writeRule),
        ];
      });

      return readPermissions.flat();
    });

    return new Authorizer(permissions.flat());
  }
}
