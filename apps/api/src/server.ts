import { serve } from "@hono/node-server";
import { admitSample, FeedStore, type Ledger, MemoryLedger, MemoryRegistry, MODEL_CLASSES, RegistryError, shadowStatus } from "@pade/registry";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { ZodError, z } from "zod";
import { assertListenAllowed, listenHost, operatorName, operatorToken } from "./bind.js";
import { OperatorError, resolveOperator, signAudit } from "./operator.js";
import { openPostgres } from "./postgres.js";

const token = operatorToken();
const operator = operatorName();
const host = listenHost();
assertListenAllowed(host, token);

const registry = new MemoryRegistry();
const feeds = new FeedStore();
let ledger: Ledger = new MemoryLedger();
const app = new Hono();

const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
registry.present({
  auth: token ? "required" : "local",
  session: token ? operator : "Unsigned local operator. No authentication.",
  persistence: databaseUrl
    ? "PostgreSQL. Operator actions and collection survive a restart."
    : "Process memory. Operator actions reset when the API process restarts.",
});
if (token) registry.signWith((event) => signAudit(token, event));

app.use("*", cors({ origin: "*", allowHeaders: ["authorization", "content-type", "accept", "x-pade-env"] }));

function environment(header: string | undefined): string {
  return header ?? "lab-uk";
}

function respond(header: string | undefined, produce: (env: string) => unknown) {
  try {
    return Response.json(produce(environment(header)));
  } catch (error) {
    if (error instanceof RegistryError || error instanceof OperatorError) return Response.json({ error: error.message }, { status: error.status });
    if (error instanceof ZodError) return Response.json({ error: "Request did not match the contract." }, { status: 400 });
    console.error(error);
    return Response.json({ error: "Control plane API failed." }, { status: 500 });
  }
}

const actorBody = z.object({ actor: z.string().min(1).default("local-operator") });

app.get("/api/v1/health", (c) => c.json({ ok: true, service: "pade-api", mode: "fixture-registry", auth: token ? "required" : "local" }));
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
app.get("/api/v1/demonstrations/:id/admission", (c) => {
  const row = registry.collectedRecords().find((item) => item.id === c.req.param("id"));
  if (!row?.input) return Response.json({ error: "This demonstration has no admission record." }, { status: 404 });
  return Response.json(row.input);
});

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
  run: (env: string, body: z.infer<T> & { actor: string }) => unknown,
) {
  try {
    const parsed = schema.parse(await c.req.json()) as z.infer<T> & { actor: string };
    parsed.actor = resolveOperator(c.req.header("authorization"), parsed.actor, token, operator);
    const response = respond(c.req.header("x-pade-env"), (env) => run(env, parsed));
    if (response.status < 400) await persist();
    return response;
  } catch (error) {
    if (error instanceof RegistryError || error instanceof OperatorError) return Response.json({ error: error.message }, { status: error.status });
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

function guard(authorization: string | undefined) {
  resolveOperator(authorization, "feed", token, operator);
}

app.get("/api/v1/feeds", (c) => c.json({ feeds: feeds.list() }));

app.get("/api/v1/training/admission", (c) => {
  const records = registry.admissionShadow();
  return c.json({ ...shadowStatus(records.length), records });
});

app.post("/api/v1/feeds", async (c) => {
  try {
    guard(c.req.header("authorization"));
    const body = feedBody.parse(await c.req.json());
    const created = feeds.add({ ...body, endpoint: endpointOf(body.endpoint) });
    await persist();
    return c.json(created, 201);
  } catch (error) {
    if (error instanceof ZodError) return Response.json({ error: "Request did not match the contract." }, { status: 400 });
    if (error instanceof RegistryError || error instanceof OperatorError) return Response.json({ error: error.message }, { status: error.status });
    throw error;
  }
});

app.post("/api/v1/feeds/:id/samples", async (c) => {
  try {
    guard(c.req.header("authorization"));
    const body = z.object({ body: z.unknown(), observedAt: z.string().optional() }).parse(await c.req.json());
    const sample = recordSample(c.req.param("id"), body.body, body.observedAt);
    await persist();
    return c.json(sample, 201);
  } catch (error) {
    if (error instanceof ZodError) return Response.json({ error: "Request did not match the contract." }, { status: 400 });
    if (error instanceof RegistryError || error instanceof OperatorError) return Response.json({ error: error.message }, { status: error.status });
    if (error instanceof Error && error.message.startsWith("No feed")) {
      return Response.json({ error: error.message }, { status: 404 });
    }
    throw error;
  }
});

function recordSample(id: string, body: unknown, observedAt?: string) {
  const feed = feeds.list().find((item) => item.id === id);
  if (!feed) throw new Error(`No feed ${id}`);
  const sample = feeds.pushSample(id, body, observedAt);
  registry.addCollected(
    admitSample({
      id: sample.id,
      source: sample.source,
      observedAt: sample.observedAt,
      body,
      what: feed.what,
      use: feed.use,
      modelClass: feed.modelClass,
    }),
  );
  return sample;
}

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
        recordSample(id, payload);
      } catch (error) {
        feeds.markUnreachable(id, error instanceof Error ? error.message : "unreachable");
      }
    }),
  );
  await persist();
}

async function persist() {
  await ledger.save({
    runtime: registry.exportRuntime(),
    feeds: feeds.list(),
    collected: registry.collectedRecords(),
    shadow: registry.admissionShadow(),
  });
}

app.get("/api/v1/voice", (c) => c.json({ engine: "device" }));

app.post("/api/v1/voice/speak", (c) => c.json({ engine: "device", reason: "Remote speech is not configured." }, 503));

const port = Number(process.env.PADE_API_PORT ?? 8787);

async function boot() {
  if (databaseUrl) ledger = await openPostgres(databaseUrl);
  const snapshot = await ledger.load();
  if (snapshot) {
    registry.restoreRuntime(snapshot.runtime);
    registry.replaceCollected(snapshot.collected);
    registry.replaceShadow(snapshot.shadow ?? []);
    feeds.restore(snapshot.feeds);
  }
  setInterval(() => {
    void pullFeeds();
  }, 2000);
  serve({ fetch: app.fetch, port, hostname: host }, () => {
    console.log(`pade-api listening on ${host}:${port}`);
  });
}

boot().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
