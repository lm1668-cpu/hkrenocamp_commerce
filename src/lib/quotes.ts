export type QuoteStatus = "draft" | "sent" | "accepted" | "declined";

export type QuoteLine = {
  id: string;
  name: string;
  trade: string;
  qty: number;
  unit: string;
  price: number;
};

export type Quote = {
  id: string;
  no: string;
  createdAt: string;
  updatedAt: string;
  status: QuoteStatus;
  clientName: string;
  phone: string;
  district: string;
  address: string;
  lines: QuoteLine[];
  discountRate: number;
  depositRate: number;
  note: string;
  validDays: number;
};

export type PriceItem = {
  id: string;
  trade: string;
  name: string;
  unit: string;
  price: number;
};

export const TRADES = ["水喉", "電力", "木工", "油漆", "鋁窗", "泥水", "冷氣", "雜項"] as const;

export const PRICE_BOOK: PriceItem[] = [
  { id: "tap", trade: "水喉", name: "更換廚房或浴室龍頭", unit: "個", price: 480 },
  { id: "angle", trade: "水喉", name: "更換角閥", unit: "個", price: 180 },
  { id: "drain", trade: "水喉", name: "通渠（洗手盆或地台去水）", unit: "項", price: 450 },
  { id: "toilet", trade: "水喉", name: "原位更換馬桶", unit: "套", price: 680 },
  { id: "switch", trade: "電力", name: "更換燈掣或蘇位面板", unit: "個", price: 220 },
  { id: "light", trade: "電力", name: "安裝燈具（原有燈位）", unit: "盞", price: 180 },
  { id: "trip", trade: "電力", name: "跳掣檢查及更換單個斷路器", unit: "項", price: 480 },
  { id: "door", trade: "木工", name: "原位更換房門連門框", unit: "扇", price: 1280 },
  { id: "hinge", trade: "木工", name: "更換門較", unit: "對", price: 160 },
  { id: "cabinet", trade: "木工", name: "櫃門較位及門鉸調整", unit: "項", price: 280 },
  { id: "patch", trade: "油漆", name: "牆身補灰補漆", unit: "項", price: 680 },
  { id: "room", trade: "油漆", name: "一房牆身乳膠漆（連保護）", unit: "間", price: 2800 },
  { id: "ceiling", trade: "油漆", name: "天花乳膠漆", unit: "間", price: 980 },
  { id: "seal", trade: "鋁窗", name: "更換窗邊膠條", unit: "幅", price: 350 },
  { id: "roller", trade: "鋁窗", name: "更換鋁窗輪", unit: "扇", price: 280 },
  { id: "tile", trade: "泥水", name: "補回脫落瓷磚", unit: "項", price: 480 },
  { id: "waterproof", trade: "泥水", name: "浴室局部防水", unit: "項", price: 1800 },
  { id: "clean-ac", trade: "冷氣", name: "清洗分體式冷氣", unit: "部", price: 380 },
  { id: "install-ac", trade: "冷氣", name: "原位安裝分體式冷氣", unit: "部", price: 880 },
  { id: "callout", trade: "雜項", name: "上門檢查", unit: "次", price: 200 },
  { id: "haul", trade: "雜項", name: "清走舊料", unit: "項", price: 250 },
];

export const DISTRICTS = ["觀塘", "旺角", "沙田", "荃灣", "將軍澳", "太古", "元朗", "九龍塘", "屯門", "大埔"];

const STORAGE_KEY = "hk_camp_quotes_v1";

export const STATUS_LABEL: Record<QuoteStatus, string> = {
  draft: "草稿",
  sent: "已報價",
  accepted: "已接",
  declined: "未接",
};

function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function quoteNo(date = new Date()) {
  const y = String(date.getFullYear()).slice(2);
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const n = String(Math.floor(1000 + Math.random() * 9000));
  return `QB${y}${m}${d}-${n}`;
}

function seed(): Quote[] {
  const now = new Date().toISOString();
  return [
    {
      id: uid(),
      no: "QB260101-8821",
      createdAt: now,
      updatedAt: now,
      status: "sent",
      clientName: "陳先生",
      phone: "91238392",
      district: "觀塘",
      address: "淘大花園 H 座",
      lines: [
        { id: uid(), name: "更換廚房或浴室龍頭", trade: "水喉", qty: 1, unit: "個", price: 480 },
        { id: uid(), name: "通渠（洗手盆或地台去水）", trade: "水喉", qty: 1, unit: "項", price: 450 },
      ],
      discountRate: 0,
      depositRate: 30,
      note: "龍頭由客人自備。報價未含唐樓上樓費。",
      validDays: 14,
    },
    {
      id: uid(),
      no: "QB260102-4410",
      createdAt: now,
      updatedAt: now,
      status: "accepted",
      clientName: "李太",
      phone: "68884120",
      district: "沙田",
      address: "沙田第一城 23 座",
      lines: [{ id: uid(), name: "一房牆身乳膠漆（連保護）", trade: "油漆", qty: 1, unit: "間", price: 2800 }],
      discountRate: 5,
      depositRate: 30,
      note: "顏色由客人選定。傢俬需先移開。",
      validDays: 14,
    },
  ];
}

export function loadQuotes(): Quote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = seed();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw) as Quote[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveQuotes(quotes: Quote[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
}

export function blankQuote(): Quote {
  const now = new Date().toISOString();
  return {
    id: uid(),
    no: quoteNo(),
    createdAt: now,
    updatedAt: now,
    status: "draft",
    clientName: "",
    phone: "",
    district: "觀塘",
    address: "",
    lines: [],
    discountRate: 0,
    depositRate: 30,
    note: "",
    validDays: 14,
  };
}

export function lineFromPrice(item: PriceItem): QuoteLine {
  return { id: uid(), name: item.name, trade: item.trade, qty: 1, unit: item.unit, price: item.price };
}

export function money(value: number) {
  return `HK$${Math.round(value).toLocaleString("en-HK")}`;
}

export function totals(quote: Pick<Quote, "lines" | "discountRate" | "depositRate">) {
  const subtotal = quote.lines.reduce((sum, line) => sum + line.qty * line.price, 0);
  const discount = Math.round((subtotal * quote.discountRate) / 100);
  const net = Math.max(0, subtotal - discount);
  const deposit = Math.round((net * quote.depositRate) / 100);
  return { subtotal, discount, net, deposit, balance: net - deposit };
}

export function whatsAppText(quote: Quote) {
  const t = totals(quote);
  const lines = quote.lines.map((line) => `・${line.name} x${line.qty}${line.unit} ${money(line.qty * line.price)}`).join("\n");
  return [
    `香港裝修師傅大本營報價 ${quote.no}`,
    `${quote.clientName || "業主"}，${quote.district} ${quote.address}`.trim(),
    lines || "（未有項目）",
    `小計 ${money(t.subtotal)}`,
    quote.discountRate ? `折扣 ${quote.discountRate}% -${money(t.discount)}` : "",
    `總額 ${money(t.net)}`,
    `訂金 ${quote.depositRate}% ${money(t.deposit)}，餘額 ${money(t.balance)}`,
    `有效期 ${quote.validDays} 日`,
    quote.note ? `備註：${quote.note}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function whatsAppUrl(quote: Quote) {
  const phone = quote.phone.replace(/\D/g, "");
  const base = phone ? `https://wa.me/852${phone}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(whatsAppText(quote))}`;
}
