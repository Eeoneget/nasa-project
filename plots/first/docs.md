
# Документация к коду анализа данных PACE L2

## 1. Назначение

Код выполняет следующие задачи:

1. Загрузка спутниковых данных PACE L2 за выбранные даты.
2. Извлечение ключевых переменных: `nflh` (фитопланктон) и `avw` (ветер на поверхности).
3. Визуализация:

   * Сравнение карт `nflh` и `avw` на двух датах.
   * Расчёт разницы хлорофилла `Δnflh`.
   * Усреднённые спектры отражения воды `Rrs`.
   * Определение топ-3 зон максимального роста `nflh`.
4. **Сохранение всех графиков** в виде PNG-файлов для отчётов и публикаций.

---

## 2. Используемые библиотеки

| Библиотека          | Назначение                                             |
| ------------------- | ------------------------------------------------------ |
| `xarray`            | Чтение NetCDF файлов и работа с многомерными массивами |
| `numpy`             | Математические операции и работа с массивами           |
| `matplotlib.pyplot` | Визуализация данных (графики, карты)                   |

---

## 3. Структура кода

### 3.1 Загрузка данных

```python
files = [ ... ]  # Список файлов PACE L2
datasets = [xr.open_dataset(f, group="geophysical_data") for f in files]
nav_data = [xr.open_dataset(f, group="navigation_data") for f in files]
```

* `datasets` — геофизические данные (`nflh`, `avw`, `Rrs`).
* `nav_data` — навигационные данные (`latitude`, `longitude`).

---

### 3.2 Извлечение ключевых переменных

```python
vars = ["nflh", "avw"]
data = [{v: ds[v].values for v in vars} for ds in datasets]
```

* Для каждой переменной создается массив значений за гранулу.

---

### 3.3 Визуализация карт `nflh` и `avw`

```python
fig, axs = plt.subplots(2, 2, figsize=(12, 10))
for i, v in enumerate(vars):
    im1 = axs[i,0].imshow(data[0][v], cmap="viridis")
    axs[i,0].set_title(f"{v} — 05 Sep")
    plt.colorbar(im1, ax=axs[i,0])
    
    im2 = axs[i,1].imshow(data[2][v], cmap="viridis")
    axs[i,1].set_title(f"{v} — 09 Sep")
    plt.colorbar(im2, ax=axs[i,1])

plt.tight_layout()
plt.savefig("plots_nflh_avw_comparison.png", dpi=300)  # сохранение общего графика
plt.show()
```

**Дополнительно:**

* Каждая переменная сохраняется отдельно:

```python
plt.savefig(f"{v}_{date}.png", dpi=300)
```

---

### 3.4 Разница хлорофилла `Δnflh`

```python
delta_nflh = data[2]["nflh"] - data[0]["nflh"]
plt.imshow(delta_nflh, cmap="RdBu", vmin=-np.nanmax(abs(delta_nflh)), vmax=np.nanmax(abs(delta_nflh)))
plt.colorbar(label="Change in Chlorophyll Proxy")
plt.savefig("plot_delta_nflh.png", dpi=300)
plt.show()
```

* `RdBu` — красно-синяя цветовая шкала, где красный = рост, синий = снижение.

---

### 3.5 Усреднённые спектры отражения воды `Rrs`

```python
rrs_05 = xr.open_dataset(files[0], group="geophysical_data")["Rrs"].mean(axis=(0,1))
rrs_09 = xr.open_dataset(files[2], group="geophysical_data")["Rrs"].mean(axis=(0,1))
wavelengths = xr.open_dataset(files[0], group="sensor_band_parameters")["wavelength"]
wavelengths = wavelengths[:rrs_05.shape[0]]  # Match длину

plt.plot(wavelengths, rrs_05, label="05 Sep")
plt.plot(wavelengths, rrs_09, label="09 Sep")
plt.title("Mean Water Reflectance Spectrum")
plt.xlabel("Wavelength (nm)")
plt.ylabel("Rrs")
plt.legend()
plt.grid(True)
plt.savefig("plot_mean_rrs.png", dpi=300)
plt.show()
```

* Визуализирует средние спектры для каждой даты.
* Полезно для анализа цветности воды и фитопланктона.

---

### 3.6 Hotspots роста фитопланктона

```python
lat = nav_data[0]["latitude"].values
lon = nav_data[0]["longitude"].values

if lat.shape != delta_nflh.shape:
    lat = np.mean(lat, axis=1)
    lon = np.mean(lon, axis=1)

flat_idx = np.argpartition(delta_nflh.flatten(), -3)[-3:]
top_coords = [(lat.flat[i], lon.flat[i], delta_nflh.flat[i]) for i in flat_idx]
```

* Находит **топ-3 точки с максимальным ростом `Δnflh`**.
* Выводит координаты (широта, долгота) и значение изменения хлорофилла.

---

## 4. Результаты

1. **Сравнение карт `nflh` и `avw`** за 05 и 09 сентября (`plots_nflh_avw_comparison.png` и отдельные файлы).
2. **Карта изменений `Δnflh`** (`plot_delta_nflh.png`) показывает зоны роста/спада фитопланктона.
3. **Усреднённые спектры Rrs** (`plot_mean_rrs.png`) для анализа отражения воды.
4. **Топ-3 точки максимального роста** — координаты для дальнейшего анализа биологической активности.

---

## 5. Особенности

* Код **сохраняет все графики** в PNG с разрешением 300 dpi.
* Все визуализации подходят для публикации или отчёта.
* Если потребуется, можно добавить **сетку координат** или **координаты стран/берегов** для более наглядной карты.


