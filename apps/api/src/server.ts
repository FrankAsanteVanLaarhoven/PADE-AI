import { serve } from "@hono/node-server";
import { FeedStore, MODEL_CLASSES, MemoryRegistry, RegistryError } from "@pade/registry";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { ZodError, z } from "zod";

const registry = new MemoryRegistry();
const feeds = new FeedStore();
const app = new Hono();

app.use("*", cors());

function environment(header: string | undefined): string {
  return header ?? "lab-uk";
}

function respond(header: string | undefined, produce: (env: string) => unknown) {
  try {
    return Response.json(produce(environment(header)));
  } catch (error) {
    if (error instanceof RegistryError) return Response.json({ error: error.message }, { status: error.status });
    if (error instanceof ZodError) return Response.json({ error: "Request did not match the contract." }, { status: 400 });
    console.error(error);
    return Response.json({ error: "Control plane API failed." }, { status: 500 });
  }
}

const actorBody = z.object({ actor: z.string().min(1).default("local-operator") });

app.get("/api/v1/health", (c) => c.json({ ok: true, service: "pade-api", mode: "fixture-registry" }));
app.get("/api/v1/meta", (c) => respond(c.req.header("x-pade-env"), (env) => registry.meta(env)));
app.get("/api/v1/overview", (c) => respond(c.req.header("x-pade-env"), (env) => registry.overview(env)));
app.get("/api/v1/registry", (c) => respond(c.req.header("x-pade-env"), (env) => registry.registry(env)));
app.get("/api/v1/demonstrations", (c) => respond(c.req.header("x-pade-env"), (env) => registry.demonstrations(env)));
app.get("/api/v1/embodiments", (c) => respond(c.req.header("x-pade-env"), (env) => registry.embodimentList(env)));
app.get("/api/v1/datasets", (c) => respond(c.req.header("x-pade-env"), (env) => registry.datasetFactory(env)));
app.get("/api/v1/experiments", (c) => respond(c.req.header("x-pade-env"), (env) => registry.experiments(env)));
app.get("/api/v1/simulation", (c) => respond(c.req.header("x-pade-env"), (env) => registry.simulation(env)));
app.get("/api/v1/fleetsafe", (c) => respond(c.req.header("x-pade-env"), (env) => registry.fleetsafe(env)));
app.get("/api/v1/verdicts", (c) => respond(c.req.header("x-pade-env"), (env) => registry.verdictList(env)));
app.get("/api/v1/sentinel", (c) => respond(c.req.header("x-pade-env"), (env) => registry.sentinel(env)));
app.get("/api/v1/failures", (c) => respond(c.req.header("x-pade-env"), (env) => registry.failureList(env)));
app.get("/api/v1/acquisitions", (c) => respond(c.req.header("x-pade-env"), (env) => registry.acquisitionList(env)));
app.get("/api/v1/deployments", (c) => respond(c.req.header("x-pade-env"), (env) => registry.deployments(env)));
app.get("/api/v1/evidence", (c) => respond(c.req.header("x-pade-env"), (env) => registry.evidence(env)));
app.get("/api/v1/search", (c) => respond(c.req.header("x-pade-env"), (env) => registry.search(env, c.req.query("q") ?? "")));
app.get("/api/v1/objects/:kind/:id", (c) =>
  respond(c.req.header("x-pade-env"), (env) => registry.object(env, c.req.param("kind"), c.req.param("id"))),
);

app.post("/api/v1/demonstrations/:id/review", (c) =>
  mutate(c, actorBody.extend({ action: z.enum(["admit", "quarantine", "reject"]) }), (env, body) =>
    registry.reviewDemonstration(env, c.req.param("id"), body.action, body.actor),
  ),
);

app.post("/api/v1/verdicts/:id/decision", (c) =>
  mutate(c, actorBody.extend({ action: z.enum(["allow", "conditional", "deny"]) }), (env, body) =>
    registry.decideVerdict(env, c.req.param("id"), body.action, body.actor),
  ),
);

app.post("/api/v1/acquisitions/:id/state", (c) =>
  mutate(c, actorBody.extend({ action: z.enum(["scheduled", "dismissed"]) }), (env, body) =>
    registry.setAcquisition(env, c.req.param("id"), body.action, body.actor),
  ),
);

async function mutate<T extends z.ZodTypeAny>(
  c: { req: { header: (name: string) => string | undefined; json: () => Promise<unknown> } },
  schema: T,
  run: (env: string, body: z.infer<T>) => unknown,
) {
  try {
    const body = schema.parse(await c.req.json());
    return respond(c.req.header("x-pade-env"), (env) => run(env, body));
  } catch (error) {
    if (error instanceof ZodError) return Response.json({ error: "Request did not match the contract." }, { status: 400 });
    throw error;
  }
}

const feedBody = z.object({
  name: z.string().trim().min(1).max(80),
  what: z.string().trim().min(1).max(160),
  use: z.string().trim().min(1).max(160),
  modelClass: z.enum(MODEL_CLASSES),
  endpoint: z.string().trim().max(500).optional(),
});

function endpointOf(value: string | undefined): string | null {
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new RegistryError(400, "Endpoint must be an http(s) URL.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new RegistryError(400, "Endpoint must be an http(s) URL.");
  }
  return url.toString();
}

app.get("/api/v1/feeds", (c) => c.json({ feeds: feeds.list() }));

app.post("/api/v1/feeds", async (c) => {
  try {
    const body = feedBody.parse(await c.req.json());
    return c.json(feeds.add({ ...body, endpoint: endpointOf(body.endpoint) }), 201);
  } catch (error) {
    if (error instanceof ZodError) return Response.json({ error: "Request did not match the contract." }, { status: 400 });
    if (error instanceof RegistryError) return Response.json({ error: error.message }, { status: error.status });
    throw error;
  }
});

app.post("/api/v1/feeds/:id/samples", async (c) => {
  try {
    const body = z.object({ body: z.unknown(), observedAt: z.string().optional() }).parse(await c.req.json());
    return c.json(feeds.pushSample(c.req.param("id"), body.body, body.observedAt), 201);
  } catch (error) {
    if (error instanceof ZodError) return Response.json({ error: "Request did not match the contract." }, { status: 400 });
    if (error instanceof Error && error.message.startsWith("No feed")) {
      return Response.json({ error: error.message }, { status: 404 });
    }
    throw error;
  }
});

async function pullFeeds() {
  await Promise.all(
    feeds.endpoints().map(async ({ id, endpoint }) => {
      try {
        const response = await fetch(endpoint, { redirect: "error", signal: AbortSignal.timeout(4000) });
        if (!response.ok) {
          feeds.markUnreachable(id, String(response.status));
          return;
        }
        const text = (await response.text()).slice(0, 64_000);
        let payload: unknown = text;
        try {
          payload = JSON.parse(text);
        } catch {
          /* the feed sent text, not JSON */
        }
        feeds.pushSample(id, payload);
      } catch (error) {
        feeds.markUnreachable(id, error instanceof Error ? error.message : "unreachable");
      }
    }),
  );
}

setInterval(() => {
  void pullFeeds();
}, 2000);

app.get("/api/v1/voice", (c) => c.json({ engine: "device" }));

app.post("/api/v1/voice/speak", (c) => c.json({ engine: "device", reason: "Remote speech is not configured." }, 503));

const port = Number(process.env.PADE_API_PORT ?? 8787);
serve({ fetch: app.fetch, port, hostname: "127.0.0.1" }, () => {
  console.log(`pade-api listening on ${port}`);
});
