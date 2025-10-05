
# PACE L2 Data Analysis Code Documentation

## 1. Purpose

The code performs the following tasks:

1. Loading PACE L2 satellite data for selected dates.
2. Extracting key variables: `nflh` (phytoplankton) and `avw` (surface wind).
3. Visualization:

   * Comparison of `nflh` and `avw` maps on two dates.
   * Calculation of chlorophyll difference `Δnflh`.
   * Averaged water reflectance spectra `Rrs`.
   * Identification of top-3 zones of maximum `nflh` growth.
4. **Saving all plots** as PNG files for reports and publications.

---

## 2. Libraries Used

| Library              | Purpose                                                |
| -------------------- | ------------------------------------------------------ |
| `xarray`             | Reading NetCDF files and working with multidimensional arrays |
| `numpy`              | Mathematical operations and array processing           |
| `matplotlib.pyplot`  | Data visualization (plots, maps)                      |

---

## 3. Code Structure

### 3.1 Data Loading

```python
files = [ ... ]  # List of PACE L2 files
datasets = [xr.open_dataset(f, group="geophysical_data") for f in files]
nav_data = [xr.open_dataset(f, group="navigation_data") for f in files]
```

* `datasets` — geophysical data (`nflh`, `avw`, `Rrs`).
* `nav_data` — navigation data (`latitude`, `longitude`).

---

### 3.2 Extracting Key Variables

```python
vars = ["nflh", "avw"]
data = [{v: ds[v].values for v in vars} for ds in datasets]
```

* For each variable, an array of values per granule is created.

---

### 3.3 Visualization of `nflh` and `avw` Maps

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

**Additionally:**

* Each variable is saved separately:

```python
plt.savefig(f"{v}_{date}.png", dpi=300)
```

---

### 3.4 Chlorophyll Difference `Δnflh`

```python
delta_nflh = data[2]["nflh"] - data[0]["nflh"]
plt.imshow(delta_nflh, cmap="RdBu", vmin=-np.nanmax(abs(delta_nflh)), vmax=np.nanmax(abs(delta_nflh)))
plt.colorbar(label="Change in Chlorophyll Proxy")
plt.savefig("plot_delta_nflh.png", dpi=300)
plt.show()
```

* `RdBu` — red-blue color scale where red = growth, blue = decline.

---

### 3.5 Averaged Water Reflectance Spectra `Rrs`

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

* Visualizes mean spectra for each date.
* Useful for analyzing water color and phytoplankton.

---

### 3.6 Phytoplankton Growth Hotspots

```python
lat = nav_data[0]["latitude"].values
lon = nav_data[0]["longitude"].values

if lat.shape != delta_nflh.shape:
    lat = np.mean(lat, axis=1)
    lon = np.mean(lon, axis=1)

flat_idx = np.argpartition(delta_nflh.flatten(), -3)[-3:]
top_coords = [(lat.flat[i], lon.flat[i], delta_nflh.flat[i]) for i in flat_idx]
```

* Finds **top-3 points with maximum `Δnflh` growth**.
* Outputs coordinates (latitude, longitude) and chlorophyll change value.

---

## 4. Results

1. **Comparison of `nflh` and `avw` maps** for September 05 and 09 (`plots_nflh_avw_comparison.png` and separate files).
2. **Change map `Δnflh`** (`plot_delta_nflh.png`) shows phytoplankton growth/decline zones.
3. **Averaged Rrs spectra** (`plot_mean_rrs.png`) for water reflectance analysis.
4. **Top-3 maximum growth points** — coordinates for further biological activity analysis.

---

## 5. Features

* Code **saves all plots** as PNG with 300 dpi resolution.
* All visualizations are suitable for publication or reporting.
* If needed, **coordinate grid** or **country/coastline coordinates** can be added for more informative maps.


