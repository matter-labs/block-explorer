import { Authorizer } from '@/permissions/authorizeer';
import { readFileSync } from 'node:fs';

const buf = readFileSync('./example-permissions.yaml');
export const authorizer = Authorizer.fromBuffer(buf);
