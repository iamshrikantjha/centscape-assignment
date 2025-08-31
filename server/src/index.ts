import Fastify from "fastify";
import rateLimit from "@fastify/rate-limit";
import previewRoute from "./routes/preview.js";

const server = Fastify({
  logger: true
});

// Add CORS support
server.addHook('onRequest', async (request, reply) => {
  reply.header('Access-Control-Allow-Origin', '*');
  reply.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  reply.header('Access-Control-Allow-Headers', 'Content-Type, Accept');
  
  if (request.method === 'OPTIONS') {
    reply.send();
  }
});

// Fastify automatically handles JSON body parsing

server.register(rateLimit, {
  max: 10,
  timeWindow: "1 minute"
});

server.register(previewRoute, { prefix: "/preview" });

server.get('/health', async (request, reply) => {
  return { status: 'OK', timestamp: new Date().toISOString() };
});

const start = async () => {
  try {
    await server.listen({ port: 3001, host: "0.0.0.0" });
    console.log("🚀 Server running on http://localhost:3001");
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();