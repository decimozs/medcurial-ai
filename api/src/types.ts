import type { auth } from "./auth";
import { type HonoLogLayerVariables } from "@loglayer/hono";

export interface AppBindings {
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
    isWorker?: boolean;
    logger: HonoLogLayerVariables;
  };
}
