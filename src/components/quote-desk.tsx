import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  MessageCircle,
  Minus,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import {
  DISTRICTS,
  PRICE_BOOK,
  STATUS_LABEL,
  TRADES,
  blankQuote,
  lineFromPrice,
  loadQuotes,
  money,
  saveQuotes,
  totals,
  whatsAppUrl,
  type Quote,
  type QuoteStatus,
} from "@/lib/quotes";

type Screen = "list" | "edit" | "sheet";

const field =
  "h-11 w-full rounded-xl border border-line bg-card px-3 text-base text-ink outline-none focus:border-brass";

export function QuoteDesk() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<Screen>("list");
  const [draft, setDraft] = useState<Quote | null>(null);
  const [filter, setFilter] = useState<QuoteStatus | "all">("all");
  const [trade, setTrade] = useState<(typeof TRADES)[number] | "全部">("全部");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setQuotes(loadQuotes());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) saveQuotes(quotes);
  }, [quotes, ready]);

  const visible = quotes.filter((quote) => filter === "all" || quote.status === filter);
  const monthNet = quotes
    .filter((quote) => quote.status !== "declined")
    .reduce((sum, quote) => sum + totals(quote).net, 0);
  const waiting = quotes.filter((quote) => quote.status === "sent").length;

  if (!ready) {
    return <main className="mx-auto min-h-screen max-w-xl px-4 pt-8 text-muted">正在打開報價…</main>;
  }

  function openNew() {
    setDraft(blankQuote());
    setError("");
    setQuery("");
    setScreen("edit");
  }

  function openEdit(quote: Quote) {
    setDraft(structuredClone(quote));
    setError("");
    setScreen("edit");
  }

  function persistDraft(nextStatus?: QuoteStatus) {
    if (!draft) return;
    if (!draft.clientName.trim()) {
      setError("請填業主稱呼。");
      return;
    }
    if (!draft.lines.length) {
      setError("請至少加一項工程。");
      return;
    }
    const next = { ...draft, status: nextStatus ?? (draft.status === "draft" ? "sent" : draft.status), updatedAt: new Date().toISOString() };
    setQuotes((list) => {
      const exists = list.some((item) => item.id === next.id);
      return exists ? list.map((item) => (item.id === next.id ? next : item)) : [next, ...list];
    });
    setDraft(next);
    setError("");
    setScreen("sheet");
  }

  function setStatus(id: string, status: QuoteStatus) {
    setQuotes((list) => list.map((item) => (item.id === id ? { ...item, status, updatedAt: new Date().toISOString() } : item)));
    setDraft((current) => (current && current.id === id ? { ...current, status } : current));
  }

  function removeQuote(id: string) {
    setQuotes((list) => list.filter((item) => item.id !== id));
    setScreen("list");
    setDraft(null);
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-xl px-4 pb-28 pt-6 text-ink">
      {screen === "list" ? (
        <ListView
          quotes={visible}
          monthNet={monthNet}
          waiting={waiting}
          filter={filter}
          onFilter={setFilter}
          onNew={openNew}
          onOpen={(quote) => {
            setDraft(quote);
            setScreen("sheet");
          }}
        />
      ) : null}

      {screen === "edit" && draft ? (
        <Editor
          draft={draft}
          error={error}
          trade={trade}
          query={query}
          onBack={() => setScreen(draft.clientName ? "sheet" : "list")}
          onChange={setDraft}
          onTrade={setTrade}
          onQuery={setQuery}
          onSave={() => persistDraft()}
        />
      ) : null}

      {screen === "sheet" && draft ? (
        <Sheet
          quote={quotes.find((item) => item.id === draft.id) ?? draft}
          onBack={() => setScreen("list")}
          onEdit={() => openEdit(quotes.find((item) => item.id === draft.id) ?? draft)}
          onStatus={(status) => setStatus(draft.id, status)}
          onDelete={() => removeQuote(draft.id)}
        />
      ) : null}
    </main>
  );
}

function ListView({
  quotes,
  monthNet,
  waiting,
  filter,
  onFilter,
  onNew,
  onOpen,
}: {
  quotes: Quote[];
  monthNet: number;
  waiting: number;
  filter: QuoteStatus | "all";
  onFilter: (value: QuoteStatus | "all") => void;
  onNew: () => void;
  onOpen: (quote: Quote) => void;
}) {
  const filters: Array<QuoteStatus | "all"> = ["all", "draft", "sent", "accepted", "declined"];
  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-brass">香港裝修師傅大本營</p>
          <h1 className="font-serif text-3xl font-semibold leading-tight">報價</h1>
        </div>
        <button type="button" onClick={onNew} className="inline-flex h-11 items-center gap-1 rounded-xl bg-brass px-4 text-sm font-bold text-brass-soft">
          <Plus className="size-4" />
          新報價
        </button>
      </header>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-card border border-line bg-card p-4">
          <p className="text-sm text-muted">未拒報價總額</p>
          <p className="mt-1 font-serif text-2xl">{money(monthNet)}</p>
        </div>
        <div className="rounded-card border border-line bg-card p-4">
          <p className="text-sm text-muted">等業主回覆</p>
          <p className="mt-1 font-serif text-2xl">{waiting} 張</p>
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onFilter(item)}
            className={`h-10 shrink-0 rounded-full px-4 text-sm ${filter === item ? "bg-ink text-paper" : "bg-card text-muted border border-line"}`}
          >
            {item === "all" ? "全部" : STATUS_LABEL[item]}
          </button>
        ))}
      </div>

      {quotes.length === 0 ? (
        <p className="rounded-card border border-dashed border-line px-4 py-10 text-center text-muted">未有這一類報價。</p>
      ) : (
        <ul className="space-y-3">
          {quotes.map((quote) => {
            const t = totals(quote);
            return (
              <li key={quote.id}>
                <button type="button" onClick={() => onOpen(quote)} className="w-full rounded-card border border-line bg-card p-4 text-left">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-serif text-lg">{quote.no}</span>
                    <StatusPill status={quote.status} />
                  </div>
                  <p className="mt-2 font-medium">{quote.clientName || "未填業主"}</p>
                  <p className="text-sm text-muted">
                    {quote.district} {quote.address}
                  </p>
                  <p className="mt-3 font-serif text-xl">{money(t.net)}</p>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <p className="pt-4 text-center text-sm text-muted">
        <a href="/" className="underline">
          返回大本營網站
        </a>
      </p>
    </div>
  );
}

function Editor({
  draft,
  error,
  trade,
  query,
  onBack,
  onChange,
  onTrade,
  onQuery,
  onSave,
}: {
  draft: Quote;
  error: string;
  trade: (typeof TRADES)[number] | "全部";
  query: string;
  onBack: () => void;
  onChange: (quote: Quote) => void;
  onTrade: (trade: (typeof TRADES)[number] | "全部") => void;
  onQuery: (value: string) => void;
  onSave: () => void;
}) {
  const book = useMemo(
    () =>
      PRICE_BOOK.filter((item) => (trade === "全部" || item.trade === trade) && item.name.includes(query.trim())),
    [trade, query],
  );
  const t = totals(draft);

  function patch(partial: Partial<Quote>) {
    onChange({ ...draft, ...partial });
  }

  return (
    <div className="space-y-5">
      <button type="button" onClick={onBack} className="inline-flex h-11 items-center gap-1 text-sm text-muted">
        <ChevronLeft className="size-4" />
        返回
      </button>
      <div>
        <p className="text-sm text-brass">{draft.no}</p>
        <h1 className="font-serif text-3xl">開一張報價</h1>
      </div>

      <section className="space-y-3 rounded-card border border-line bg-card p-4">
        <label className="block text-sm text-muted">
          業主稱呼
          <input className={`${field} mt-1`} value={draft.clientName} onChange={(event) => patch({ clientName: event.target.value })} placeholder="陳先生" />
        </label>
        <label className="block text-sm text-muted">
          電話
          <input className={`${field} mt-1`} inputMode="tel" value={draft.phone} onChange={(event) => patch({ phone: event.target.value })} placeholder="91238392" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm text-muted">
            地區
            <select className={`${field} mt-1`} value={draft.district} onChange={(event) => patch({ district: event.target.value })}>
              {DISTRICTS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-muted">
            屋苑
            <input className={`${field} mt-1`} value={draft.address} onChange={(event) => patch({ address: event.target.value })} placeholder="淘大花園 H 座" />
          </label>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl">從價目加入</h2>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted" />
          <input className={`${field} pl-9`} value={query} onChange={(event) => onQuery(event.target.value)} placeholder="搜龍頭、油漆、冷氣" />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {(["全部", ...TRADES] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onTrade(item)}
              className={`h-10 shrink-0 rounded-full px-3 text-sm ${trade === item ? "bg-ink text-paper" : "border border-line bg-card text-muted"}`}
            >
              {item}
            </button>
          ))}
        </div>
        <ul className="space-y-2">
          {book.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => patch({ lines: [...draft.lines, lineFromPrice(item)] })}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-line bg-card px-3 py-3 text-left"
              >
                <span>
                  <span className="block text-sm text-brass">{item.trade}</span>
                  <span className="block font-medium">{item.name}</span>
                </span>
                <span className="shrink-0 text-sm">{money(item.price)}</span>
              </button>
            </li>
          ))}
          {book.length === 0 ? <li className="text-sm text-muted">沒有這個項目。可在下面自行加一行。</li> : null}
        </ul>
        <button
          type="button"
          onClick={() =>
            patch({
              lines: [...draft.lines, { id: crypto.randomUUID(), name: "自訂項目", trade: "雜項", qty: 1, unit: "項", price: 0 }],
            })
          }
          className="h-11 w-full rounded-xl border border-dashed border-line text-sm"
        >
          加自訂項目
        </button>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl">這張單的項目</h2>
        {draft.lines.length === 0 ? <p className="text-sm text-muted">未加項目。</p> : null}
        {draft.lines.map((line) => (
          <div key={line.id} className="space-y-3 rounded-card border border-line bg-card p-3">
            <input
              className={field}
              value={line.name}
              onChange={(event) =>
                patch({ lines: draft.lines.map((item) => (item.id === line.id ? { ...item, name: event.target.value } : item)) })
              }
            />
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center rounded-xl border border-line">
                <button
                  type="button"
                  className="inline-flex size-11 items-center justify-center"
                  onClick={() =>
                    patch({
                      lines: draft.lines.map((item) => (item.id === line.id ? { ...item, qty: Math.max(1, item.qty - 1) } : item)),
                    })
                  }
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-8 text-center">{line.qty}</span>
                <button
                  type="button"
                  className="inline-flex size-11 items-center justify-center"
                  onClick={() =>
                    patch({ lines: draft.lines.map((item) => (item.id === line.id ? { ...item, qty: item.qty + 1 } : item)) })
                  }
                >
                  <Plus className="size-4" />
                </button>
              </div>
              <label className="text-sm text-muted">
                單價
                <input
                  className="ml-2 h-11 w-24 rounded-xl border border-line px-2 text-ink"
                  inputMode="numeric"
                  value={line.price}
                  onChange={(event) =>
                    patch({
                      lines: draft.lines.map((item) =>
                        item.id === line.id ? { ...item, price: Math.max(0, Number(event.target.value) || 0) } : item,
                      ),
                    })
                  }
                />
              </label>
              <button
                type="button"
                className="inline-flex size-11 items-center justify-center text-muted"
                onClick={() => patch({ lines: draft.lines.filter((item) => item.id !== line.id) })}
                aria-label="刪除項目"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            <p className="text-right font-medium">{money(line.qty * line.price)}</p>
          </div>
        ))}
      </section>

      <section className="space-y-3 rounded-card border border-line bg-card p-4">
        <RateRow label="折扣" value={draft.discountRate} onChange={(discountRate) => patch({ discountRate })} />
        <RateRow label="訂金" value={draft.depositRate} onChange={(depositRate) => patch({ depositRate })} />
        <label className="block text-sm text-muted">
          備註
          <textarea
            className="mt-1 min-h-24 w-full rounded-xl border border-line px-3 py-2 text-base text-ink outline-none focus:border-brass"
            value={draft.note}
            onChange={(event) => patch({ note: event.target.value })}
            placeholder="例如物料由客人自備"
          />
        </label>
      </section>

      {error ? <p className="text-sm text-brass">{error}</p> : null}

      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted">總額</p>
            <p className="font-serif text-2xl">{money(t.net)}</p>
          </div>
          <button type="button" onClick={onSave} className="h-12 rounded-xl bg-brass px-5 font-bold text-brass-soft">
            儲存並出單
          </button>
        </div>
      </div>
    </div>
  );
}

function RateRow({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  const steps = [0, 5, 10, 15, 20, 30];
  return (
    <div>
      <p className="mb-2 text-sm text-muted">{label}</p>
      <div className="flex flex-wrap gap-2">
        {steps.map((step) => (
          <button
            key={step}
            type="button"
            onClick={() => onChange(step)}
            className={`h-10 rounded-full px-3 text-sm ${value === step ? "bg-ink text-paper" : "border border-line text-muted"}`}
          >
            {step}%
          </button>
        ))}
      </div>
    </div>
  );
}

function Sheet({
  quote,
  onBack,
  onEdit,
  onStatus,
  onDelete,
}: {
  quote: Quote;
  onBack: () => void;
  onEdit: () => void;
  onStatus: (status: QuoteStatus) => void;
  onDelete: () => void;
}) {
  const t = totals(quote);
  return (
    <div className="space-y-5">
      <button type="button" onClick={onBack} className="inline-flex h-11 items-center gap-1 text-sm text-muted">
        <ChevronLeft className="size-4" />
        全部報價
      </button>
      <article className="rounded-card border border-line bg-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-brass">香港裝修師傅大本營</p>
            <h1 className="font-serif text-3xl">報價單</h1>
          </div>
          <StatusPill status={quote.status} />
        </div>
        <p className="mt-4 font-serif text-lg">{quote.no}</p>
        <p className="mt-3 font-medium">{quote.clientName}</p>
        <p className="text-sm text-muted">
          {quote.phone || "未填電話"} · {quote.district} {quote.address}
        </p>
        <ul className="mt-5 divide-y divide-line border-y border-line">
          {quote.lines.map((line) => (
            <li key={line.id} className="flex items-start justify-between gap-3 py-3">
              <span>
                <span className="block text-sm text-brass">{line.trade}</span>
                {line.name}
                <span className="block text-sm text-muted">
                  {line.qty}
                  {line.unit} × {money(line.price)}
                </span>
              </span>
              <span>{money(line.qty * line.price)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">小計</dt>
            <dd>{money(t.subtotal)}</dd>
          </div>
          {t.discount > 0 ? (
            <div className="flex justify-between">
              <dt className="text-muted">折扣 {quote.discountRate}%</dt>
              <dd>-{money(t.discount)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between font-serif text-2xl text-ink">
            <dt>總額</dt>
            <dd>{money(t.net)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">訂金 {quote.depositRate}%</dt>
            <dd>{money(t.deposit)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">完工餘額</dt>
            <dd>{money(t.balance)}</dd>
          </div>
        </dl>
        {quote.note ? <p className="mt-4 text-sm text-muted">備註：{quote.note}</p> : null}
        <p className="mt-4 text-sm text-muted">本報價 {quote.validDays} 日內有效。未列明的拆舊、上樓和額外物料另計。</p>
      </article>

      <div className="grid grid-cols-2 gap-2">
        <a href={whatsAppUrl(quote)} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brass font-bold text-brass-soft">
          <MessageCircle className="size-4" />
          WhatsApp
        </a>
        <button type="button" onClick={onEdit} className="h-12 rounded-xl border border-line bg-card font-medium">
          修改
        </button>
        <button type="button" onClick={() => onStatus("accepted")} className="inline-flex h-12 items-center justify-center gap-1 rounded-xl border border-line bg-card">
          <Check className="size-4" />
          已接
        </button>
        <button type="button" onClick={() => onStatus("declined")} className="h-12 rounded-xl border border-line bg-card text-muted">
          未接
        </button>
      </div>
      <button type="button" onClick={onDelete} className="inline-flex h-11 items-center gap-1 text-sm text-muted">
        <Trash2 className="size-4" />
        刪除這張報價
      </button>
    </div>
  );
}

function StatusPill({ status }: { status: QuoteStatus }) {
  const on = status === "accepted" || status === "sent";
  return <span className={`rounded-full px-3 py-1 text-sm ${on ? "bg-brass-soft text-brass" : "bg-paper text-muted"}`}>{STATUS_LABEL[status]}</span>;
}
