import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, post } from "./api";
import { useEnv } from "./shell";
import type { Workspace } from "./types";
import { useI18n } from "./i18n/context";
import { Panels, SourceLine, Tx, useTitle } from "./ui";

const TABS = ["overview", "evidence", "lineage", "runs", "safety", "decisions", "activity"] as const;

function tabKey(name: (typeof TABS)[number]) {
  if (name === "overview") return "tabOverview" as const;
  if (name === "evidence") return "tabEvidence" as const;
  if (name === "lineage") return "tabLineage" as const;
  if (name === "runs") return "tabRuns" as const;
  if (name === "safety") return "tabSafety" as const;
  if (name === "decisions") return "tabDecisions" as const;
  return "tabActivity" as const;
}
type Tab = (typeof TABS)[number];

export function ObjectPage() {
  const { kind = "", id = "" } = useParams();
  const { env } = useEnv();
  const [tick, setTick] = useState(0);
  const [data, setData] = useState<Workspace | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const { t, tx } = useI18n();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  useTitle(id || "Object");

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError(null);
    api<Workspace>(`/api/v1/objects/${kind}/${id}`, env)
      .then((workspace) => {
        if (!live) return;
        setData(workspace);
        setLoading(false);
      })
      .catch((reason: Error) => {
        if (!live) return;
        setData(null);
        setError(reason.message);
        setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [env, id, kind, tick]);

  useEffect(() => {
    setTab("overview");
  }, [env, id, kind]);

  async function act(action: Workspace["actions"][number]) {
    const path =
      action.group === "review"
        ? `/api/v1/demonstrations/${id}/review`
        : action.group === "verdict"
          ? `/api/v1/verdicts/${id}/decision`
          : `/api/v1/acquisitions/${id}/state`;
    setBusy(true);
    setActionError(null);
    try {
      await post(path, env, { action: action.id, actor: "local-operator" });
      setTick((value) => value + 1);
      setTab("activity");
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      {loading && !data ? (
        <>
          <h1 className="mono">{id}</h1>
          <p className="statusline">{t("loading")}</p>
        </>
      ) : null}
      {loading && data ? <p className="statusline">{t("updating")}</p> : null}
      {error ? (
        <>
          <h1>{t("noObject")}</h1>
          <p className="lede">{error}</p>
        </>
      ) : null}
      {data ? (
        <>
          <p className="kicker">{data.kind}</p>
          <h1>{data.title}</h1>
          <p className="lede"><Tx text={data.subtitle} /></p>
          <p className="banner">{data.originNote}</p>
          <SourceLine origin={data.origin} source={data.source} />
          <dl className="summary">
            {data.summary.map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd className={`${item.mono ? "mono" : ""} ${item.tone ? `tone-${item.tone}` : ""}`.trim()}><Tx text={item.value} /></dd>
              </div>
            ))}
          </dl>
          {data.actions.length ? (
            <div className="actions">
              {data.actions.map((action) => (
                <button key={action.id} type="button" className="btn" disabled={busy} onClick={() => act(action)}>
                  {tx(action.label)}
                </button>
              ))}
            </div>
          ) : null}
          {actionError ? <p className="statusline tone-bad">{actionError}</p> : null}
          <div className="tabs" role="tablist" aria-label="Object workspace">
            {TABS.map((name) => (
              <button key={name} type="button" role="tab" aria-selected={tab === name} onClick={() => setTab(name)}>
                {t(tabKey(name))}
              </button>
            ))}
          </div>
          <div role="tabpanel">
            {tab === "overview" ? <Panels panels={data.overview} /> : null}
            {tab === "evidence" ? <Panels panels={data.evidence} /> : null}
            {tab === "lineage" ? <LinkTable rows={data.lineage.map((link) => [link.direction, link.relation, link.kind, link.id])} head={["Direction", "Relation", "Kind", "Record"]} linkColumn={3} kindColumn={2} empty={t("emptyLineage")} /> : null}
            {tab === "runs" ? <LinkTable rows={data.runs.map((run) => [run.kind, run.id, run.status])} head={["Kind", "Record", "Status"]} linkColumn={1} kindColumn={0} empty={t("emptyRuns")} /> : null}
            {tab === "safety" ? <LinkTable rows={data.safety.map((item) => [item.kind, item.id, item.summary])} head={["Kind", "Record", "Relation"]} linkColumn={1} kindColumn={0} empty={t("emptySafety")} /> : null}
            {tab === "decisions" ? <LinkTable rows={data.decisions.map((item) => ["verdict", item.id, item.gate, item.state, item.decision])} head={["Kind", "Record", "Gate", "State", "Decision"]} linkColumn={1} kindColumn={0} empty={t("emptyDecisions")} /> : null}
            {tab === "activity" ? (
              data.activity.length ? (
                <div className="table-wrap boxed">
                  <table className="data">
                    <thead>
                      <tr>
                        <th scope="col">When</th>
                        <th scope="col">Actor</th>
                        <th scope="col">Action</th>
                        <th scope="col">Session</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.activity.map((event) => (
                        <tr key={event.at + event.action}>
                          <td className="mono">{event.at}</td>
                          <td className="mono">{event.actor}</td>
                          <td>{event.action}</td>
                          <td><Tx text={event.session ? "this session" : "corpus"} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="note">{t("emptyActivity")}</p>
              )
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}

function LinkTable({
  rows,
  head,
  linkColumn,
  kindColumn,
  empty,
}: {
  rows: string[][];
  head: string[];
  linkColumn: number;
  kindColumn: number;
  empty: string;
}) {
  if (!rows.length) return <p className="note">{empty}</p>;
  return (
    <div className="table-wrap boxed">
      <table className="data">
        <thead>
          <tr>
            {head.map((column) => (
              <th key={column} scope="col">
                <Tx text={column} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className={cellIndex === linkColumn ? "mono" : undefined}>
                  {cellIndex === linkColumn ? <Link to={`/o/${row[kindColumn]}/${cell}`}>{cell}</Link> : <Tx text={cell} />}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
