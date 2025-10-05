"use client";

import { useCallback, useEffect, useState } from "react";
import pacePlotData from "../data/pacePlotData.json";
import { gridMeta, deltaMeta, lineMeta } from "../data/pacePlotMeta";
import { HeatmapCard, LineChartCard } from "./InteractivePlotCard";

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "-";
  const units = ["B", "KB", "MB", "GB"];
  const order = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** order;
  return `${value.toFixed(order === 0 ? 0 : 1)} ${units[order]}`;
}

function formatDate(isoString) {
  if (!isoString) return "-";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleString("ru-RU", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

const INTERACTIVE_FILES = {
  "first/nflh_05Sep.png": { type: "grid", key: "nflh_05Sep" },
  "first/nflh_09Sep.png": { type: "grid", key: "nflh_09Sep" },
  "first/avw_05Sep.png": { type: "grid", key: "avw_05Sep" },
  "first/avw_09Sep.png": { type: "grid", key: "avw_09Sep" },
  "first/plot_delta_nflh.png": { type: "grid", key: "delta_from_pairs", meta: deltaMeta },
  "first/plot_mean_rrs.png": { type: "line", key: "rrs_mean" },
  "second/chlorophyll-2025-09-01AND2025-09-07.png": { type: "grid", key: "chlorophyll-2025-09-01AND2025-09-07" },
  "second/chlorophyll-2025-09-08AND2025-09-14.png": { type: "grid", key: "chlorophyll-2025-09-08AND2025-09-14" }
};

export default function PlotsGallery() {
  const [manifest, setManifest] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [docContent, setDocContent] = useState({});
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docLoadingPath, setDocLoadingPath] = useState(null);
  const [docError, setDocError] = useState(null);
  const [openInteractive, setOpenInteractive] = useState({});

  useEffect(() => {
    let isMounted = true;
    const loadManifest = async () => {
      try {
        const response = await fetch("/api/plots/manifest");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (isMounted) {
          setManifest(data?.categories ?? []);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load plots manifest", err);
        if (isMounted) {
          setError("Не удалось загрузить список визуализаций.");
          setLoading(false);
        }
      }
    };

    loadManifest();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleViewDoc = useCallback(
    async (path) => {
      if (!path) return;
      setDocError(null);
      setSelectedDoc(path);

      if (docContent[path]) {
        return;
      }

      setDocLoadingPath(path);
      try {
        const response = await fetch(`/api/plots/${path}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const text = await response.text();
        setDocContent((prev) => ({ ...prev, [path]: text }));
      } catch (err) {
        console.error("Failed to load doc", err);
        setDocError("Не удалось загрузить документ.");
      } finally {
        setDocLoadingPath(null);
      }
    },
    [docContent]
  );

  const toggleInteractive = useCallback((path) => {
    setOpenInteractive((prev) => ({ ...prev, [path]: !prev[path] }));
  }, []);

  if (loading) {
    return (
      <section className="rounded-3xl border border-white/10 bg-black/40 p-6 text-white">
        <p className="text-sm text-white/70">Загружаем визуализации…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6 text-white">
        <h2 className="text-lg font-semibold">PACE plots недоступны</h2>
        <p className="text-sm text-white/70">{error}</p>
      </section>
    );
  }

  return (
    <section className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-xl">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.35em] text-teal-300">PACE Python Outputs</p>
        <h2 className="text-2xl font-semibold">Plots & Docs Archive</h2>
        <p className="text-sm text-white/70 max-w-3xl">
          Просматривайте PNG-рендеры и методические заметки из ноутбуков в папке <code className="rounded bg-white/10 px-1">plots</code>.
          Для ключевых сцен доступен интерактивный режим Plotly прямо в браузере.
        </p>
      </header>

      <div className="space-y-8">
        {manifest.map((category) => (
          <div key={category.name} className="space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-xl font-semibold capitalize">{category.name}</h3>
              <span className="text-xs text-white/50">
                {category.files.length} файл{category.files.length === 1 ? "" : "ов"}
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {category.files.map((file) => {
                const interactive = INTERACTIVE_FILES[file.path];
                const isInteractiveOpen = Boolean(openInteractive[file.path]);
                return (
                  <article
                    key={file.path}
                    className="flex h-full flex-col gap-3 rounded-2xl border border-white/10 bg-black/40 p-4"
                  >
                    <header className="flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-white/90">{file.name}</p>
                        <p className="text-xs text-white/50">{file.type.toUpperCase()} • {formatBytes(file.size)}</p>
                      </div>
                      <a
                        href={`/api/plots/${file.path}`}
                        download={file.name}
                        className="rounded-xl border border-teal-300/50 px-3 py-1 text-xs text-teal-200 transition hover:bg-teal-400/10"
                      >
                        Скачать
                      </a>
                    </header>

                    {file.type === "image" ? (
                      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/60">
                        <img
                          src={`/api/plots/${file.path}`}
                          alt={file.name}
                          className="h-40 w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ) : null}

                    {file.type === "doc" ? (
                      <div className="space-y-2">
                        <p className="text-xs leading-relaxed text-white/65 whitespace-pre-line">
                          {file.excerpt || "Документ готов к просмотру."}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleViewDoc(file.path)}
                          className="rounded-xl border border-white/20 bg-white/5 px-3 py-1 text-xs text-white/80 transition hover:bg-white/10"
                        >
                          {docLoadingPath === file.path ? "Открываем…" : "Открыть полностью"}
                        </button>
                        {docError && selectedDoc === file.path && !docContent[file.path] ? (
                          <p className="text-xs text-rose-300">{docError}</p>
                        ) : null}
                      </div>
                    ) : null}

                    {file.type === "script" ? (
                      <p className="text-xs text-white/60">
                        Исходник генерации. Используйте ссылку скачивания, чтобы просмотреть Python-скрипт.
                      </p>
                    ) : null}

                    {interactive ? (
                      <button
                        type="button"
                        onClick={() => toggleInteractive(file.path)}
                        className="rounded-xl border border-teal-300/40 bg-teal-400/10 px-3 py-1 text-xs text-teal-100 transition hover:bg-teal-400/20"
                      >
                        {isInteractiveOpen ? "Скрыть интерактив" : "Показать интерактив"}
                      </button>
                    ) : null}

                    {interactive && isInteractiveOpen ? (
                      <div className="mt-2 space-y-3 rounded-2xl border border-white/10 bg-black/50 p-3">
                        {interactive.type === "grid" ? (() => {
                          const grid = pacePlotData.grids[interactive.key];
                          const meta = interactive.meta ?? gridMeta[interactive.key] ?? {};
                          if (!grid) return null;
                          return (
                            <HeatmapCard
                              title={meta.title}
                              description={meta.description}
                              colorscale={meta.colorscale}
                              colorbarTitle={meta.colorbarTitle}
                              zmid={meta.zmid}
                              grid={grid}
                              height={300}
                            />
                          );
                        })() : null}
                        {interactive.type === "line" ? (() => {
                          const line = pacePlotData.lines?.[interactive.key];
                          const meta = lineMeta[interactive.key] ?? {};
                          if (!line) return null;
                          return (
                            <LineChartCard
                              title={meta.title}
                              description={meta.description}
                              wavelengths={line.wavelength ?? []}
                              rrs05={line.rrs05 ?? []}
                              rrs09={line.rrs09 ?? []}
                              height={300}
                            />
                          );
                        })() : null}
                      </div>
                    ) : null}

                    <footer className="mt-auto text-[11px] text-white/45">
                      Обновлено {formatDate(file.modified)}
                    </footer>
                  </article>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {selectedDoc ? (
        <div className="rounded-2xl border border-white/15 bg-black/60 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-teal-200">{selectedDoc}</h3>
            <button
              type="button"
              onClick={() => setSelectedDoc(null)}
              className="rounded-xl border border-white/20 bg-white/5 px-3 py-1 text-xs text-white/70 transition hover:bg-white/10"
            >
              Закрыть
            </button>
          </div>
          {docLoadingPath === selectedDoc && !docContent[selectedDoc] ? (
            <p className="mt-3 text-sm text-white/60">Загружаем документ…</p>
          ) : (
            <pre className="mt-3 max-h-96 overflow-y-auto whitespace-pre-wrap rounded-xl bg-black/80 p-3 text-xs leading-relaxed text-white/80">
              {docContent[selectedDoc] ?? "Документ не загружен."}
            </pre>
          )}
          {docError && !docContent[selectedDoc] ? (
            <p className="mt-2 text-xs text-rose-300">{docError}</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
