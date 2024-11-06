import { WebServer } from '@/build-app';
import { z } from 'zod';
import { getUserByToken } from '@/query/user';
import { HttpError } from '@/errors';
import { handleRpc } from 'typed-rpc/server';
import { RpcService } from '@/rpc-service';

const rpcSchema = { schema: { params: z.object({ token: z.string() }) } };

export function rpcRoutes(app: WebServer) {
  app.post('/:token', rpcSchema, async (req, reply) => {
    const user = await getUserByToken(app.context.db, req.params.token).then(
      (maybe) => maybe.expect(new HttpError('Unauthorized', 401)),
    );

    const res = await handleRpc(
      req.body,
      new RpcService(user.address, app.context.targetRpc, app.context.allRules),
    );
    reply.send(res);
  });
}
