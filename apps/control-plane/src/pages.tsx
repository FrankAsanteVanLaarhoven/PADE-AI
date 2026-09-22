import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { api } from "./api";
import { useEnv } from "./shell";
import type { ListView, Overview } from "./types";
import { useI18n } from "./i18n/context";
import type { MessageKey } from "./i18n/en";
import { ListBody, SourceLine, Tx, Unavailable, useTitle } from "./ui";

function useGet<T>(path: string, env: string) {
  const [state, setState] = useState<{ data?: T; error?: string; loading: boolean }>({ loading: true });
  useEffect(() => {
    let live = true;
    setState({ loading: true });
    api<T>(path, env)
      .then((data) => {
        if (live) setState({ loading: false, data });
      })
      .catch((error: Error) => {
        if (live) setState({ loading: false, error: error.message });
      });
    return () => {
      live = false;
    };
  }, [env, path]);
  return state;
}

function PageFrame({ title, children }: { title: string; children: ReactNode }) {
  useTitle(title);
  return (
    <div className="page">
      <h1>{title}</h1>
      {children}
    </div>
  );
}

function QueryNote({ loading, error }: { loading: boolean; error?: string }) {
  const { t } = useI18n();
  if (loading) return <p className="statusline">{t("loading")}</p>;
  if (error) return <p className="statusline tone-bad">{error}</p>;
  return null;
}

export function OverviewPage() {
  const { env } = useEnv();
  const { t } = useI18n();
  const query = useGet<Overview>("/api/v1/overview", env);
  return (
    <PageFrame title={t("pageOperations")}>
      <QueryNote loading={query.loading} error={query.error} />
      {query.data ? <OverviewBody data={query.data} /> : null}
    </PageFrame>
  );
}

function OverviewBody({ data }: { data: Overview }) {
  const { t } = useI18n();
  return (
    <>
      <SourceLine origin={data.deployments.origin} source={data.deployments.source} />
      <div className="health">
        {data.health.map((item) => (
          <Link key={item.label} to={item.href}>
            <small>{healthLabel(item.label, t)}</small>
            <strong className={item.tone ? `tone-${item.tone}` : undefined}><Tx text={item.value} /></strong>
          </Link>
        ))}
      </div>
      <div className="ops">
        <div>
          <div className="section-h">
            <span>{t("navDeployments")}</span>
            <Link to="/deployments">{t("all")}</Link>
          </div>
          <RecordTable view={data.deployments} />
        </div>
        <div className="ops-side">
          <Mini title={t("admissionQueue")} href="/demonstrations" empty={t("noRecords")}>
            {data.queue.map((item) => (
              <Link key={item.id} className="mini" to={`/o/demonstration/${item.id}`}>
                <b className="mono">{item.id}</b>
                <span>{item.task}</span>
                <em className={item.tone ? `tone-${item.tone}` : undefined}><Tx text={item.policy} /></em>
              </Link>
            ))}
          </Mini>
          <Mini title={t("openVerdicts")} href="/verdictplane" empty={t("noRecords")}>
            {data.verdicts.map((item) => (
              <Link key={item.id} className="mini" to={`/o/verdict/${item.id}`}>
                <b className="mono">{item.id}</b>
                <span>{item.gate}</span>
                <em className={item.tone ? `tone-${item.tone}` : undefined}><Tx text={item.recommendation} /></em>
              </Link>
            ))}
          </Mini>
          <Mini title={t("navFailures")} href="/failures" empty={t("noRecords")}>
            {data.failures.map((item) => (
              <Link key={item.id} className="mini" to={`/o/failure/${item.id}`}>
                <b className="mono">{item.id}</b>
                <span>{item.task}</span>
                <em><Tx text={item.mode} /></em>
              </Link>
            ))}
          </Mini>
          <Mini title={t("safetyCases")} href="/fleetsafe" empty={t("noRecords")}>
            {data.safety.map((item) => (
              <Link key={item.id} className="mini" to={`/o/safety-event/${item.id}`}>
                <b className="mono">{item.id}</b>
                <span><Tx text={item.summary} /></span>
                <em className="mono">{item.at}</em>
              </Link>
            ))}
          </Mini>
        </div>
      </div>
      <div className="panel" style={{ marginTop: 16 }}>
        <h2>{t("adapters")}</h2>
        <div className="table-wrap boxed">
          <table className="data">
            <thead>
              <tr>
                <th scope="col">Adapter</th>
                <th scope="col">Contract</th>
                <th scope="col">State</th>
                <th scope="col">Reason</th>
              </tr>
            </thead>
            <tbody>
              {data.adapters.map((adapter) => (
                <tr key={adapter.id}>
                  <td>
                    <Link to={`/o/adapter/${adapter.id}`}><Tx text={adapter.name} /></Link>
                  </td>
                  <td className="mono">{adapter.contract}</td>
                  <td className="tone-muted"><Tx text="unavailable" /></td>
                  <td><Tx text={adapter.reason} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function Mini({ title, href, empty, children }: { title: string; href: string; empty: string; children: ReactNode }) {
  const { t } = useI18n();
  const items = Array.isArray(children) ? children : [children];
  const present = items.some(Boolean);
  return (
    <section>
      <div className="section-h">
        <span>{title}</span>
        <Link to={href}>{t("all")}</Link>
      </div>
      {present ? children : <p className="note" style={{ padding: "8px 10px" }}>{empty}</p>}
    </section>
  );
}

function healthLabel(label: string, t: (key: MessageKey) => string): string {
  if (label === "Pending admission") return t("admissionQueue");
  if (label === "Open verdicts") return t("openVerdicts");
  if (label === "Safety cases") return t("safetyCases");
  if (label === "Evidence") return t("navEvidence");
  return label;
}

function RecordTable({ view }: { view: ListView }) {
  if (!view.rows.length) {
    return <p className="note" style={{ padding: "10px" }}>{view.lede}</p>;
  }
  return (
    <div className="table-wrap">
      <table className="data">
        <thead>
          <tr>
            {view.columns.map((column) => (
              <th key={column.key} scope="col" className={column.align === "right" ? "right" : undefined}>
                <Tx text={column.label} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {view.rows.map((row) => (
            <tr key={row.id}>
              {view.columns.map((column) => (
                <td
                  key={column.key}
                  className={`${column.mono || column.key === "id" ? "mono" : ""} ${column.align === "right" ? "right" : ""} ${row.tones?.[column.key] ? `tone-${row.tones[column.key]}` : ""}`.trim()}
                >
                  {column.key === "id" ? <Link to={`/o/${row.kind}/${row.id}`}>{row.cells[column.key]}</Link> : <Tx text={row.cells[column.key] ?? "—"} />}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ListPage({ titleKey, path }: { titleKey: MessageKey; path: string }) {
  const { env } = useEnv();
  const { t } = useI18n();
  const query = useGet<ListView>(path, env);
  return (
    <PageFrame title={t(titleKey)}>
      <QueryNote loading={query.loading} error={query.error} />
      {query.data ? (
        <>
          <SourceLine origin={query.data.origin} source={query.data.source} />
          {query.data.unavailable ? <Unavailable {...query.data.unavailable} /> : <ListBody view={query.data} />}
        </>
      ) : null}
    </PageFrame>
  );
}

export const RegistryPage = () => <ListPage titleKey="navRegistry" path="/api/v1/registry" />;
export const DemonstrationsPage = () => <ListPage titleKey="navDemonstrations" path="/api/v1/demonstrations" />;
export const EmbodimentsPage = () => <ListPage titleKey="navEmbodiments" path="/api/v1/embodiments" />;
export const VerdictsPage = () => <ListPage titleKey="navVerdict" path="/api/v1/verdicts" />;
export const FailuresPage = () => <ListPage titleKey="navFailures" path="/api/v1/failures" />;
export const AcquisitionPage = () => <ListPage titleKey="navAcquisition" path="/api/v1/acquisitions" />;
export const DeploymentsPage = () => <ListPage titleKey="navDeployments" path="/api/v1/deployments" />;

interface DatasetPayload {
  title: string;
  lede: string;
  origin: string;
  source?: string;
  weighting?: string;
  unavailable?: { reason: string; contract: string };
  sets: {
    id: string;
    name: string;
    purpose: string;
    members: { id: string; task: string; policy: string; train: string; review: string; weight: string }[];
  }[];
}

export function DatasetsPage() {
  const { env } = useEnv();
  const { t } = useI18n();
  const query = useGet<DatasetPayload>("/api/v1/datasets", env);
  return (
    <PageFrame title={t("navDatasets")}>
      <QueryNote loading={query.loading} error={query.error} />
      {query.data ? (
        <>
          {query.data.source ? <SourceLine origin={query.data.origin} source={query.data.source} /> : null}
          {query.data.weighting ? <p className="note">{t("weighting")}: <Tx text={query.data.weighting} />.</p> : null}
          {query.data.unavailable ? <Unavailable {...query.data.unavailable} /> : null}
          {query.data.sets.map((set) => (
            <section key={set.id} className="panel">
              <h2 className="set-title">
                <Link to={`/o/dataset/${set.id}`}>{set.name}</Link>
              </h2>
              <p className="note">{set.purpose}</p>
              <div className="table-wrap boxed">
                <table className="data">
                  <thead>
                    <tr>
                      <th scope="col">Record</th>
                      <th scope="col">Task</th>
                      <th scope="col">Policy</th>
                      <th scope="col">Train</th>
                      <th scope="col">Review</th>
                      <th scope="col" className="right">Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {set.members.map((member) => (
                      <tr key={member.id}>
                        <td className="mono">
                          <Link to={`/o/demonstration/${member.id}`}>{member.id}</Link>
                        </td>
                        <td>{member.task}</td>
                        <td>{member.policy}</td>
                        <td>{member.train}</td>
                        <td>{member.review}</td>
                        <td className="right mono">{member.weight}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </>
      ) : null}
    </PageFrame>
  );
}

interface ExperimentPayload {
  title: string;
  lede: string;
  origin: string;
  source?: string;
  cell: string;
  reason?: string;
  unavailable?: { reason: string; contract: string };
  arms: { id: string; code: string; name: string; question: string; datasetId: string | null }[];
  conditions: string[];
}

export function ExperimentsPage() {
  const { env } = useEnv();
  const { t } = useI18n();
  const query = useGet<ExperimentPayload>("/api/v1/experiments", env);
  return (
    <PageFrame title={t("navExperiments")}>
      <QueryNote loading={query.loading} error={query.error} />
      {query.data ? (
        <>
          {query.data.source ? <SourceLine origin={query.data.origin} source={query.data.source} /> : null}
          {query.data.unavailable ? <Unavailable reason={query.data.unavailable.reason} contract={query.data.unavailable.contract} /> : null}
          {query.data.arms.length ? (
            <div className="matrix">
              <table className="data">
                <thead>
                  <tr>
                    <th scope="col"><Tx text="Arm" /></th>
                    {query.data.conditions.map((condition) => (
                      <th key={condition} scope="col">
                        <Tx text={condition} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {query.data.arms.map((arm) => (
                    <tr key={arm.id}>
                      <th scope="row">
                        <Link to={`/o/experiment/${arm.id}`}>
                          {arm.code} <Tx text={arm.name} />
                        </Link>
                        <div className="note"><Tx text={arm.question} /></div>
                      </th>
                      {query.data?.conditions.map((condition) => (
                        <td key={condition} className="cell">
                          <Tx text={query.data?.cell ?? ""} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="note">{t("noProtocol")}</p>
          )}
        </>
      ) : null}
    </PageFrame>
  );
}

interface SimulationPayload {
  lede: string;
  origin: string;
  empty: string | null;
  adapters: { id: string; name: string; contract: string; reason: string; origin: string; source: string }[];
  plans: { id: string; failureId: string; perturbation: string; why: string; status: string; origin: string }[];
}

export function SimulationPage() {
  const { env } = useEnv();
  const { t } = useI18n();
  const query = useGet<SimulationPayload>("/api/v1/simulation", env);
  return (
    <PageFrame title={t("navSimulation")}>
      <QueryNote loading={query.loading} error={query.error} />
      {query.data ? (
        <>
          <div className="table-wrap boxed">
            <table className="data">
              <thead>
                <tr>
                  <th scope="col">Adapter</th>
                  <th scope="col">Contract</th>
                  <th scope="col">Origin</th>
                  <th scope="col">Reason</th>
                </tr>
              </thead>
              <tbody>
                {query.data.adapters.map((adapter) => (
                  <tr key={adapter.id}>
                    <td>
                      <Link to={`/o/adapter/${adapter.id}`}>{adapter.name}</Link>
                    </td>
                    <td className="mono">{adapter.contract}</td>
                    <td className="tone-muted">{adapter.origin}</td>
                    <td>{adapter.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <section className="panel" style={{ marginTop: 16 }}>
            <h2>{t("counterfactuals")}</h2>
            {query.data.empty ? <p className="note">{query.data.empty}</p> : null}
            {query.data.plans.length ? (
              <div className="table-wrap boxed">
                <table className="data">
                  <thead>
                    <tr>
                      <th scope="col">Plan</th>
                      <th scope="col">Perturbation</th>
                      <th scope="col">Failure</th>
                      <th scope="col">Status</th>
                      <th scope="col">Origin</th>
                      <th scope="col">Why it is on the list</th>
                    </tr>
                  </thead>
                  <tbody>
                    {query.data.plans.map((plan) => (
                      <tr key={plan.id}>
                        <td className="mono">
                          <Link to={`/o/counterfactual/${plan.id}`}>{plan.id}</Link>
                        </td>
                        <td><Tx text={plan.perturbation} /></td>
                        <td className="mono">
                          <Link to={`/o/failure/${plan.failureId}`}>{plan.failureId}</Link>
                        </td>
                        <td className="tone-muted">{plan.status}</td>
                        <td>{plan.origin}</td>
                        <td>{plan.why}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>
        </>
      ) : null}
    </PageFrame>
  );
}

interface FleetPayload {
  lede: string;
  runtime: { reason: string; contract: string; origin: string };
  tuple: string[];
  events: ListView;
}

export function FleetPage() {
  const { env } = useEnv();
  const { t } = useI18n();
  const query = useGet<FleetPayload>("/api/v1/fleetsafe", env);
  return (
    <PageFrame title={t("navFleet")}>
      <QueryNote loading={query.loading} error={query.error} />
      {query.data ? (
        <>
          <Unavailable reason={query.data.runtime.reason} contract={query.data.runtime.contract} />
          <p className="note">
            {t("tuple")}: <span className="mono">{query.data.tuple.join(" · ")}</span>
          </p>
          <SourceLine origin={query.data.events.origin} source={query.data.events.source} />
          {query.data.events.unavailable ? <Unavailable {...query.data.events.unavailable} /> : <ListBody view={query.data.events} />}
        </>
      ) : null}
    </PageFrame>
  );
}

interface SentinelPayload {
  lede: string;
  stream: { reason: string; contract: string };
  incidents: ListView;
}

export function SentinelPage() {
  const { env } = useEnv();
  const { t } = useI18n();
  const query = useGet<SentinelPayload>("/api/v1/sentinel", env);
  return (
    <PageFrame title={t("navSentinel")}>
      <QueryNote loading={query.loading} error={query.error} />
      {query.data ? (
        <>
          <Unavailable reason={query.data.stream.reason} contract={query.data.stream.contract} />
          <h2 style={{ fontSize: 13, margin: "16px 0 8px" }}>{t("fixtureIncidents")}</h2>
          <SourceLine origin={query.data.incidents.origin} source={query.data.incidents.source} />
          {query.data.incidents.unavailable ? <Unavailable {...query.data.incidents.unavailable} /> : <ListBody view={query.data.incidents} />}
        </>
      ) : null}
    </PageFrame>
  );
}

interface EvidencePayload {
  lede: string;
  origin: string;
  source?: string;
  id?: string;
  present: number;
  total: number;
  unavailable?: { reason: string; contract: string };
  items: { name: string; state: string; ref: string; reason: string }[];
}

export function EvidencePage() {
  const { env } = useEnv();
  const { t } = useI18n();
  const query = useGet<EvidencePayload>("/api/v1/evidence", env);
  return (
    <PageFrame title={t("navEvidence")}>
      <QueryNote loading={query.loading} error={query.error} />
      {query.data ? (
        <>
          {query.data.source ? <SourceLine origin={query.data.origin} source={query.data.source} /> : null}
          {query.data.unavailable ? <Unavailable {...query.data.unavailable} /> : null}
          {query.data.id ? (
            <p className="note">
              <Link to={`/o/evidence/${query.data.id}`}>{query.data.id}</Link> · {query.data.present}/{query.data.total}
            </p>
          ) : null}
          {query.data.items.length ? (
            <div className="table-wrap boxed">
              <table className="data">
                <thead>
                  <tr>
                    <th scope="col"><Tx text="Artifact" /></th>
                    <th scope="col"><Tx text="State" /></th>
                    <th scope="col"><Tx text="Ref" /></th>
                    <th scope="col"><Tx text="Reason" /></th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.items.map((item) => (
                    <tr key={item.name}>
                      <td><Tx text={item.name} /></td>
                      <td className={item.state === "present" ? "tone-ok" : item.state === "pending" ? "tone-warn" : "tone-bad"}><Tx text={item.state} /></td>
                      <td className="mono">{item.ref}</td>
                      <td><Tx text={item.reason} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </>
      ) : null}
    </PageFrame>
  );
}
