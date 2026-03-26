import type { HonoLogLayerVariables } from '@loglayer/hono';
import type { auth } from './auth';

export interface AppBindings {
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
    isWorker?: boolean;
    logger: HonoLogLayerVariables;
  };
}
