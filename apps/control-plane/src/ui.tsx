import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "./i18n/context";
import type { Field, ListRow, ListView, Panel, Tone } from "./types";

export function Tx({ text }: { text: string }) {
  const { tx } = useI18n();
  return <>{tx(text)}</>;
}

export function useTitle(title: string) {
  useEffect(() => {
    document.title = `${title} — PADE`;
  }, [title]);
}

export function SourceLine({ origin, source }: { origin: string; source: string }) {
  return (
    <p className="source-line">
      <span className={toneClass(originTone(origin))}>{origin}</span>
      {" · "}
      {source}
    </p>
  );
}

export function Unavailable({ reason, contract }: { reason: string; contract: string }) {
  const { t, tx } = useI18n();
  return (
    <p className="banner">
      {t("unavailableLead")} {tx(reason)} {t("contractWord")} <span className="mono">{contract}</span>.
    </p>
  );
}

export function Fields({ fields }: { fields: Field[] }) {
  return (
    <dl className="fields">
      {fields.map((item) => (
        <FieldRow key={item.label} item={item} />
      ))}
    </dl>
  );
}

function FieldRow({ item }: { item: Field }) {
  return (
    <>
      <dt>{item.label}</dt>
      <dd className={`${item.mono ? "mono" : ""} ${toneClass(item.tone)}`.trim()}><Tx text={item.value} /></dd>
    </>
  );
}

export function Panels({ panels }: { panels: Panel[] }) {
  if (!panels.length) return <p className="note">No panel on this tab.</p>;
  return (
    <>
      {panels.map((panel) => (
        <section key={panel.title} className="panel">
          <h2><Tx text={panel.title} /></h2>
          {panel.note ? <p className="note">{panel.note}</p> : null}
          {panel.fields ? <Fields fields={panel.fields} /> : null}
          {panel.columns && panel.rows ? (
            <div className="table-wrap boxed">
              <table className="data">
                <thead>
                  <tr>
                    {panel.columns.map((column) => (
                      <th key={column} scope="col">
                        <Tx text={column} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {panel.rows.map((row, index) => (
                    <tr key={index}>
                      {row.cells.map((cell, cellIndex) => (
                        <td key={cellIndex} className={toneClass(row.tones?.[cellIndex])}>
                          <Tx text={cell} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      ))}
    </>
  );
}

export function DataTable({
  view,
  selected,
  onSelect,
  onOpen,
}: {
  view: ListView;
  selected: string | null;
  onSelect: (id: string) => void;
  onOpen: (row: ListRow) => void;
}) {
  const { t } = useI18n();
  if (!view.rows.length) return <p className="note">{t("noRecords")}</p>;
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
            <tr
              key={row.id}
              aria-selected={row.id === selected}
              onClick={() => onSelect(row.id)}
              onDoubleClick={() => onOpen(row)}
            >
              {view.columns.map((column) => (
                <td
                  key={column.key}
                  className={`${column.mono ? "mono" : ""} ${column.align === "right" ? "right" : ""} ${toneClass(row.tones?.[column.key])}`.trim()}
                >
                  <Tx text={row.cells[column.key] ?? "—"} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ListBody({ view }: { view: ListView }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => {
    if (!view.rows.length) {
      setSelected(null);
      return;
    }
    setSelected((current) => (current && view.rows.some((row) => row.id === current) ? current : view.rows[0].id));
  }, [view]);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (document.body.dataset.modal) return;
      if (isTyping(event)) return;
      if (!view.rows.length) return;
      const index = Math.max(0, view.rows.findIndex((row) => row.id === selected));
      if (event.key === "j" || event.key === "ArrowDown") {
        event.preventDefault();
        setSelected(view.rows[Math.min(view.rows.length - 1, index + 1)].id);
      } else if (event.key === "k" || event.key === "ArrowUp") {
        event.preventDefault();
        setSelected(view.rows[Math.max(0, index - 1)].id);
      } else if (event.key === "Enter" && selected) {
        const row = view.rows.find((item) => item.id === selected);
        if (row) navigate(`/o/${row.kind}/${row.id}`);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, selected, view.rows]);

  const row = view.rows.find((item) => item.id === selected) ?? null;
  return (
    <div className="split">
      <DataTable
        view={view}
        selected={selected}
        onSelect={setSelected}
        onOpen={(item) => navigate(`/o/${item.kind}/${item.id}`)}
      />
      <aside className="inspector">
        {row ? (
          <>
            <p className="kicker">{row.kind}</p>
            <h2 className="mono">{row.id}</h2>
            <Fields fields={row.inspector} />
            <p className="actions">
              <button type="button" className="btn primary" onClick={() => navigate(`/o/${row.kind}/${row.id}`)}>
                {t("openWorkspace")}
              </button>
            </p>
          </>
        ) : (
          <p className="empty">{t("selectRecord")}</p>
        )}
      </aside>
    </div>
  );
}

export function isTyping(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement | null;
  if (!target) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

function originTone(origin: string): Tone | undefined {
  if (origin === "unavailable") return "muted";
  if (origin === "live") return "bad";
  if (origin === "simulated") return "warn";
  return undefined;
}

function toneClass(tone: Tone | undefined): string {
  return tone ? `tone-${tone}` : "";
}
