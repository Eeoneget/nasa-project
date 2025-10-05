# ocean-sharks

Веб-дашборд для NASA Space Apps Challenge. Проект объединяет прогнозирование горячих точек кормления акул с визуальной аналитикой по спутниковым продуктам (SST, хлорофилл и т.д.).

## Новые материалы PACE L2
- В секции «PACE L2 Analysis» на главной странице добавлены визуализации из `plots/first` и `plots/second`.
- Галерея отображает сравнение NFLH/AVW (05 ↔ 09 Sep 2025), heatmap ∆NFLH, средний спектр Rrs, а также OC4-хлорофилл (через Earthaccess).
- Все изображения подключены напрямую из `plots/` без ручного копирования.

## Запуск
```bash
npm install
npm run dev
```

Для продакшен-сборки:
```bash
npm run build
```

### Update dashboards
- `python scripts/build_plotly_from_png.py` — convert PACE PNG outputs into Plotly-ready JSON.
- `python scripts/build_shark_model_dashboard.py` — refresh synthetic shark-activity dataset for the interactive model section.

