import { Authorizer } from '@/permissions/authorizer';
import { readFileSync } from 'node:fs';

const buf = readFileSync('./example-permissions.yaml');
export const authorizer = Authorizer.fromBuffer(buf);
