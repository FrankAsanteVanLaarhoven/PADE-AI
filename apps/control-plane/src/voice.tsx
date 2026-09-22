import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NAV } from "./nav";
import { useI18n } from "./i18n/context";
import { en } from "./i18n/en";
import { LOCALES, localeById } from "./i18n/locales";

interface Turn {
  role: "you" | "pade";
  text: string;
}

type Rec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: { length: number; [index: number]: { isFinal: boolean; 0?: { transcript: string } } } }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export function VoiceDock() {
  const { t, locale, setLocale, setTheme } = useI18n();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [draft, setDraft] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [engine, setEngine] = useState<"device" | "grok">("device");
  const [note, setNote] = useState<string | null>(null);
  const recRef = useRef<Rec | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetch("/api/v1/voice")
      .then((response) => response.json())
      .then((body: { engine?: string }) => {
        if (body.engine === "grok") setEngine("grok");
      })
      .catch(() => setEngine("device"));
  }, []);

  async function speak(text: string) {
    window.speechSynthesis?.cancel();
    audioRef.current?.pause();
    if (engine === "grok") {
      const response = await fetch("/api/v1/voice/speak", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, language: localeById(locale).bcp47 }),
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.addEventListener("ended", () => URL.revokeObjectURL(url));
        await audio.play();
        return;
      }
    }
    await deviceSpeak(text, localeById(locale).bcp47);
  }

  function reply(text: string) {
    setTurns((current) => [...current, { role: "pade" as const, text }].slice(-8));
    void speak(text);
  }

  function act(transcript: string) {
    const said = transcript.trim();
    if (!said) return;
    setTurns((current) => [...current, { role: "you" as const, text: said }].slice(-8));
    const q = said.toLowerCase();
    const item = localeById(locale);

    for (const entry of LOCALES) {
      if (q.includes(entry.native.toLowerCase()) || q.includes(entry.english.toLowerCase())) {
        setLocale(entry.id);
        reply(t("replyLanguage", { name: entry.native }));
        return;
      }
    }
    if (includesAny(q, [t("themeLight"), en.themeLight, "light"])) {
      setTheme("light");
      reply(t("replyTheme", { name: t("themeLight") }));
      return;
    }
    if (includesAny(q, [t("themeDark"), en.themeDark, "dark"])) {
      setTheme("dark");
      reply(t("replyTheme", { name: t("themeDark") }));
      return;
    }
    if (includesAny(q, [t("themeSystem"), en.themeSystem, "system"])) {
      setTheme("system");
      reply(t("replyTheme", { name: t("themeSystem") }));
      return;
    }
    if (includesAny(q, [t("cmdTime"), en.cmdTime, t("clock"), "clock"])) {
      const time = new Intl.DateTimeFormat(item.bcp47, {
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
        timeZone: item.timeZone,
      }).format(new Date());
      reply(t("replyTime", { time, city: item.city }));
      return;
    }
    for (const group of NAV) {
      for (const link of group.items) {
        const label = t(link.label).toLowerCase();
        const english = en[link.label].toLowerCase();
        if (q.includes(label) || q.includes(english)) {
          navigate(link.href);
          reply(t("replyOpen", { name: t(link.label) }));
          return;
        }
      }
    }
    if (includesAny(q, [t("cmdRead"), en.cmdRead, "page"])) {
      const title = document.querySelector("#content h1")?.textContent ?? "PADE";
      const detail = document.querySelector("#content .lede")?.textContent ?? "";
      reply(t("replyRead", { title, detail }));
      return;
    }
    reply(t("replyUnknown"));
  }

  function toggleListen() {
    const Ctor = (window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec }).SpeechRecognition
      ?? (window as unknown as { webkitSpeechRecognition?: new () => Rec }).webkitSpeechRecognition;
    if (!Ctor) {
      setNote(t("voiceUnsupported"));
      setOpen(true);
      return;
    }
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    window.speechSynthesis?.cancel();
    audioRef.current?.pause();
    const rec = new Ctor();
    rec.lang = localeById(locale).bcp47;
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (event) => {
      let text = "";
      let final = false;
      for (let i = 0; i < event.results.length; i += 1) {
        text += event.results[i]?.[0]?.transcript ?? "";
        final = Boolean(event.results[i]?.isFinal);
      }
      setDraft(text);
      if (final) {
        setDraft("");
        act(text);
      }
    };
    rec.onerror = (event) => {
      if (event.error === "not-allowed") setNote(t("voiceDenied"));
      setListening(false);
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setNote(null);
    setOpen(true);
    setListening(true);
    rec.start();
  }

  return (
    <div className="voice-dock">
      {open ? (
        <section className="voice-panel" aria-label={t("voice")}>
          <p className="kicker">{engine === "grok" ? t("voiceGrok") : t("voiceDevice")}</p>
          <ol>
            {turns.map((turn, index) => (
              <li key={index}>
                <b>{turn.role === "you" ? t("listen") : "PADE"}</b>
                <span>{turn.text}</span>
              </li>
            ))}
          </ol>
          {note ? <p className="note">{note}</p> : null}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const text = draft;
              setDraft("");
              act(text);
            }}
          >
            <input
              aria-label={t("typeInstead")}
              placeholder={t("typeInstead")}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
          </form>
        </section>
      ) : null}
      <button type="button" className={listening ? "voice-btn live" : "voice-btn"} onClick={toggleListen} aria-pressed={listening}>
        {listening ? t("stop") : t("listen")}
      </button>
    </div>
  );
}

function includesAny(text: string, words: string[]): boolean {
  return words.some((word) => word && text.includes(word.toLowerCase()));
}

function deviceSpeak(text: string, lang: string): Promise<void> {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) {
      resolve();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    const voices = window.speechSynthesis.getVoices();
    const base = lang.slice(0, 2).toLowerCase();
    const match = voices.find((voice) => voice.lang.toLowerCase().startsWith(base) && /natural|premium|enhanced/i.test(voice.name))
      ?? voices.find((voice) => voice.lang.toLowerCase().startsWith(base));
    if (match) utterance.voice = match;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}
