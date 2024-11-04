import Fastify from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { handleRpc } from 'typed-rpc/server';
import { rpcService } from './rpc-service.js';

export function buildApp(
    produceLogs = true,
) {
    const app = Fastify({
        logger: produceLogs,
    }).withTypeProvider<ZodTypeProvider>();

    app.post("/rpc", async (req, reply) => {
        const res = await handleRpc(req.body, rpcService);
        reply.send(res);
    })

    return app
}