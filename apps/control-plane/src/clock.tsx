import { useEffect, useState } from "react";
import { useI18n } from "./i18n/context";
import { LOCALES, localeById } from "./i18n/locales";

export function Clock() {
  const { locale, t } = useI18n();
  const [now, setNow] = useState(() => new Date());
  const [open, setOpen] = useState(false);
  const active = localeById(locale);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const primary = formatTime(now, active.bcp47, active.timeZone);

  return (
    <div className="clock">
      <button type="button" className="clock-btn" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span>{active.city}</span>
        <b className="mono">{primary}</b>
      </button>
      {open ? (
        <div className="clock-panel" role="dialog" aria-label={t("clock")}>
          <p className="kicker">{t("clock")}</p>
          <ul>
            {LOCALES.map((item) => (
              <li key={item.id} data-active={item.id === locale ? "true" : "false"}>
                <span>
                  {item.city}
                  <small>{item.native}</small>
                </span>
                <b className="mono">{formatTime(now, item.bcp47, item.timeZone)}</b>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function formatTime(now: Date, bcp47: string, timeZone: string): string {
  return new Intl.DateTimeFormat(bcp47, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).format(now);
}
