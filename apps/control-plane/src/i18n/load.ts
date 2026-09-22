import { catalogs, registerPhrases } from "./index";
import type { LocaleId } from "./locales";
import { ar, hi, ko, tr } from "./pack3";
import { de, es, fr, zh } from "./pack1";
import { it, ja, nl, pl, pt, ru } from "./pack2";
import { bn, el, fa, id, sv, sw, th, uk, ur, vi } from "./pack4";
import { PHRASES } from "./phrases";

const tables = { zh, hi, es, fr, ar, bn, pt, ja, de, ko, tr, vi, pl, uk, id, th, fa, ur, sw, ru, nl, it, sv, el };

for (const [id, table] of Object.entries(tables)) {
  catalogs[id as LocaleId] = table;
  registerPhrases(id as LocaleId, PHRASES[id] ?? {});
}
