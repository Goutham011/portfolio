const ITEMS: { t: string; c: string }[] = [
  { t: "PYTHON · SQL · SPARK", c: "#FF4500" },
  { t: "ETL PIPELINE ✓", c: "#0E7A56" },
  { t: "DATA QUALITY 99.9%", c: "#FF4500" },
  { t: "BIGQUERY: ONLINE", c: "#2249C7" },
  { t: "AIRFLOW DAGS ✓", c: "#B45309" },
  { t: "10K+ RECORDS/DAY", c: "#4A5261" },
  { t: "KAFKA STREAM: LIVE", c: "#FF4500" },
  { t: "100K+ RECORDS GOVERNED", c: "#2249C7" },
  { t: "MODEL ACC 85.89%", c: "#0E7A56" },
  { t: "POWER BI DASHBOARD ✓", c: "#B45309" },
  { t: "GOVERNANCE: ENFORCED", c: "#4A5261" },
  { t: "PIPELINE CHECKPOINT SAVED", c: "#0E7A56" },
];

export function DataStreamTicker() {
  return (
    <div
      className="relative flex h-10 items-center overflow-hidden border-t border-black/15 bg-[#FFFFFF]"
      aria-hidden="true"
    >
      <div className="ticker-track">
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0">
            {ITEMS.map((it) => (
              <span
                key={`${k}-${it.t}`}
                className="flex items-center gap-2 whitespace-nowrap px-5 font-mono text-[11px] tracking-widest"
                style={{ color: it.c }}
              >
                <span
                  className="h-1 w-1 rounded-full"
                  style={{ backgroundColor: it.c }}
                />
                {it.t}
                <span className="pl-3 text-[#767E8C]">◆</span>
              </span>
            ))}
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#FFFFFF] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#FFFFFF] to-transparent" />
    </div>
  );
}
