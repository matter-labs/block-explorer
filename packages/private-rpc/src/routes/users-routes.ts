import { WebServer } from '@/build-app';
import { z } from 'zod';
import { addressSchema } from '@/schemas/address';
import { usersTable } from '@/db/schema';
import { nanoid } from 'nanoid';

const createUserSchema = {
  schema: {
    body: z.object({
      address: addressSchema,
    }),
  },
};

export function usersRoutes(app: WebServer) {
  app.post('/', createUserSchema, async (req, reply) => {
    const address = req.body.address;
    const token = nanoid(32);

    await app.context.db.insert(usersTable).values({
      address,
      token,
    });

    reply.send({ ok: true, token });
  });
}
