
# PACE Chlorophyll-a (OC4 proxy) Code Documentation

## 1. Purpose

This code performs the following tasks:

1. Access to **PACE L2** satellite data via `earthaccess` API.
2. Calculation of chlorophyll-a concentration in the ocean using the **OC4V6** algorithm.
3. Data collection from multiple granules (orbital images) over a specified period.
4. Visualization of spatial distribution of chlorophyll on a map.
5. Preparation of plots for analyzing chlorophyll concentration changes.

---

## 2. Libraries Used

| Library              | Purpose                                                      |
| -------------------- | ------------------------------------------------------------ |
| `earthaccess`        | Access to NASA PACE data (search and download)              |
| `h5netcdf`           | Reading NetCDF/HDF5 format files                             |
| `numpy`              | Mathematical operations with arrays                          |
| `matplotlib.pyplot`  | Data visualization (plots)                                  |
| `cartopy.crs`        | Geographic projections for maps                             |
| `cartopy.feature`    | Display of coastlines, land and other geographic features   |

---

## 3. Code Structure

### 3.1 Authentication

```python
earthaccess.login()
```

* Performed once before downloading data.
* Requires NASA Earthdata account.

---

### 3.2 Function `compute_chlor_oc4(rrs, wavelengths)`

* **Input:**

  * `rrs` — water reflectance at different wavelengths (`Rrs` array).
  * `wavelengths` — array of wavelengths corresponding to `Rrs` channels.
* **Output:**

  * `chl` — array of chlorophyll concentration (mg/m³).
* **Method:**

  * Calculates variable `R` through reflectance ratios at 443, 490, 510 and 555 nm.
  * Applies polynomial OC4V6 algorithm for chlorophyll concentration calculation.

---

### 3.3 Function `get_pace_oc4(short_name, temporal, bbox, max_granules=5)`

* **Purpose:** loading PACE L2 data for period and region, chlorophyll calculation.
* **Parameters:**

  * `short_name` — dataset identifier (e.g., `"PACE_OCI_L2_AOP_NRT"`).
  * `temporal` — date tuple (`start_date`, `end_date`), e.g. `("2025-09-08", "2025-09-14")`.
  * `bbox` — coordinate rectangle (`lon_min, lat_min, lon_max, lat_max`).
  * `max_granules` — maximum number of files to download.
* **Output:** tuple `(lat, lon, chl)`:

  * `lat` — latitude of each point.
  * `lon` — longitude of each point.
  * `chl` — chlorophyll concentration value for each point.
* **Features:**

  * Concatenates all granules.
  * Skips NaN values.
  * Outputs statistics (`mean`, `min`, `max`) for each granule.

---

### 3.4 Analysis Parameters

```python
temporal = ("2025-09-08", "2025-09-14")
bbox = (-160, -10, -120, 10)  # Equatorial Pacific zone (El Niño)
max_granules = 5
```

* Sets time interval and region of interest.
* Granule count limitation prevents downloading too much data.

---

### 3.5 Visualization

```python
plt.figure(figsize=(12,6))
ax = plt.axes(projection=ccrs.PlateCarree())
sc = ax.scatter(lon, lat, c=chl, s=1, cmap="viridis", vmin=0, vmax=5)
ax.coastlines()
ax.add_feature(cfeature.LAND, facecolor="lightgray")
plt.colorbar(sc, label="Chlorophyll-a proxy (mg/m³)")
plt.title("PACE Chlorophyll-a (OC4 proxy, Pacific)")
plt.show()
```

* Builds **scatter map** of chlorophyll by coordinates.
* Point colors correspond to chlorophyll concentration (mg/m³).
* Added:

  * Coastlines (`ax.coastlines()`)
  * Land (`cfeature.LAND`) in light gray.
* Color settings: from 0 to 5 mg/m³ (`vmin=0, vmax=5`).

---

## 4. Plot Results

1. **Scatter Map (PACE Chlorophyll-a)**

   * Displays chlorophyll concentration distribution on selected area.
   * Color scale: `viridis` (dark blue — low concentration, yellow-green — high).
   * Used for ocean biological activity analysis and phytoplankton growth zone detection.

2. **Possible visualization improvements:**

   * Daily or weekly averaging.
   * Point interpolation to grid for continuous map.
   * Adding country coastlines or other geographic layers (`cfeature.BORDERS`).

---

## 5. Limitations

* PACE L2 data are individual orbital granules. Code **does not average** data by time or space.
* For weekly averaging or regular grid construction, aggregation needs to be added.
* Maximum granule count (`max_granules`) limits coverage completeness.


