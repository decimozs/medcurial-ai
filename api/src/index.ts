import { cors } from "hono/cors";
import { auth } from "./auth";
import { API_VERSION, APP_CONFIG, WORKER_API_KEY } from "./constants";
import { errorMiddleware } from "./middlewares";
import { chatRoutes, documentRoutes, signatureRoutes } from "./routes";
import { factory } from "./utils";
import { LogLayer } from "loglayer";
import { serializeError } from "serialize-error";
import {
  getSimplePrettyTerminal,
  moonlight,
} from "@loglayer/transport-simple-pretty-terminal";
import { honoLogLayer } from "@loglayer/hono";

const log = new LogLayer({
  errorSerializer: serializeError,
  transport: getSimplePrettyTerminal({
    runtime: "node",
    theme: moonlight,
  }),
});

const app = factory
  .createApp()
  .use(
    honoLogLayer({
      instance: log,
      autoLogging: {
        request: { logLevel: "debug" },
        response: { logLevel: "info" },
      },
    }),
  )
  .use("*", cors(APP_CONFIG.cors as any))
  .use("*", errorMiddleware)
  .use("*", async (c, next) => {
    const workerKey = c.req.header("X-Worker-Key");
    const isWorkerAuth = workerKey && workerKey === WORKER_API_KEY;

    if (isWorkerAuth) {
      c.set("isWorker", true);
      c.set("user", null);
      c.set("session", null);
      await next();
      return;
    }

    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) {
      c.set("user", null);
      c.set("session", null);
      await next();
      return;
    }
    c.set("user", session.user);
    c.set("session", session.session);
    await next();
  })
  .basePath(API_VERSION)
  .on(["POST", "GET"], "/auth/*", (c) => auth.handler(c.req.raw))
  .get("/", (c) => {
    return c.text("Hello from Medcurial API");
  })
  .get("/session", (c) => {
    const session = c.get("session");
    const user = c.get("user");

    if (!user) return c.body(null, 401);

    return c.json({
      session,
      user,
    });
  })
  .route("/chat", chatRoutes)
  .route("/signatures", signatureRoutes)
  .route("/documents", documentRoutes);

export default app;
