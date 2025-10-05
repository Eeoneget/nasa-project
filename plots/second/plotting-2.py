import earthaccess
import h5netcdf
import numpy as np
import matplotlib.pyplot as plt
import cartopy.crs as ccrs
import cartopy.feature as cfeature

# Авторизация (один раз)
earthaccess.login()

# Функция расчета хлорофилла (OC4V6)
def compute_chlor_oc4(rrs, wavelengths):
    idx_443 = np.argmin(np.abs(wavelengths - 443))
    idx_490 = np.argmin(np.abs(wavelengths - 490))
    idx_510 = np.argmin(np.abs(wavelengths - 510))
    idx_555 = np.argmin(np.abs(wavelengths - 555))

    R = np.log10(np.maximum.reduce([rrs[..., idx_443],
                                    rrs[..., idx_490],
                                    rrs[..., idx_510]]) / rrs[..., idx_555])

    a0, a1, a2, a3, a4 = 0.3272, -2.9940, 2.7218, -1.2259, -0.5683
    chl = 10 ** (a0 + a1*R + a2*R**2 + a3*R**3 + a4*R**4)
    return chl

# Загрузка PACE L2 (несколько гранул)
def get_pace_oc4(short_name, temporal, bbox, max_granules=5):
    results = earthaccess.search_data(
        short_name=short_name,
        temporal=temporal,
        bounding_box=bbox
    )
    print(f"Найдено гранул: {len(results)}")
    if len(results) == 0:
        return None

    files = earthaccess.download(results[:max_granules], local_path="./pace_data")
    if not files:
        print("Не удалось скачать")
        return None

    all_lat, all_lon, all_chl = [], [], []

    for f in files:
        try:
            with h5netcdf.File(f, "r") as ds:
                rrs = ds["geophysical_data"]["Rrs"][:]
                wavelengths = ds["sensor_band_parameters"]["wavelength"][:]
                lat = ds["navigation_data"]["latitude"][:]
                lon = ds["navigation_data"]["longitude"][:]

                chl = compute_chlor_oc4(rrs, wavelengths)

                mask = np.isfinite(chl)
                all_lat.append(lat[mask])
                all_lon.append(lon[mask])
                all_chl.append(chl[mask])

                print(f"{f}: mean={np.nanmean(chl):.3f}, min={np.nanmin(chl):.3f}, max={np.nanmax(chl):.3f}")
        except Exception as e:
            print(f"Ошибка в {f}: {e}")

    return (np.concatenate(all_lat),
            np.concatenate(all_lon),
            np.concatenate(all_chl))

# ==== Параметры ====
temporal = ("2025-09-08", "2025-09-14")
# Тихий океан (экваториальный участок, El Niño zone)
bbox = (-160, -10, -120, 10)

lat, lon, chl = get_pace_oc4("PACE_OCI_L2_AOP_NRT", temporal, bbox, max_granules=5)

# ==== Визуализация ====
plt.figure(figsize=(12,6))
ax = plt.axes(projection=ccrs.PlateCarree())
sc = ax.scatter(lon, lat, c=chl, s=1, cmap="viridis", vmin=0, vmax=5)
ax.coastlines()
ax.add_feature(cfeature.LAND, facecolor="lightgray")
plt.colorbar(sc, label="Chlorophyll-a proxy (mg/m³)")
plt.title("PACE Chlorophyll-a (OC4 proxy, Pacific)")
plt.show()

