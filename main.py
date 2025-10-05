import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import cartopy.crs as ccrs
import cartopy.feature as cfeature
from datetime import datetime, timedelta

class SharkActivityModel:
    def __init__(self):
        # Базовые регионы + пользовательские
        self.regions = {
            'gulf_stream': (35.0, -75.0),
            'california_current': (32.0, -118.0),
            'great_barrier_reef': (-18.0, 147.0),
            'hawaii': (21.0, -157.0),
            'south_africa': (-32.0, 18.0),
            'galapagos': (-0.5, -91.0)
        }
        self.custom_regions = {}

    def add_custom_location(self, name, lat, lon):
        """Добавление кастомного местоположения"""
        self.custom_regions[name] = (lat, lon)
        print(f"✅ Добавлена кастомная точка: {name} ({lat}, {lon})")

    def add_multiple_locations(self, locations_dict):
        """Добавление нескольких местоположений"""
        for name, coords in locations_dict.items():
            self.custom_regions[name] = coords
        print(f"✅ Добавлено {len(locations_dict)} кастомных точек")

    def get_all_regions(self):
        """Получить все регионы (базовые + кастомные)"""
        return {**self.regions, **self.custom_regions}

    def display_mathematical_formulas(self):
        """Вывод всех математических формул модели"""
        print("\n" + "="*80)
        print("МАТЕМАТИЧЕСКИЕ ФОРМУЛЫ МОДЕЛИ АКТИВНОСТИ АКУЛ")
        print("="*80)

        formulas = {
            "1. ОСНОВНОЕ УРАВНЕНИЕ АКТИВНОСТИ": {
                "formula": "SAI = w₁·g(SST) + w₂·h(Chl-a) + w₃·k(|SLA|) + ε",
                "description": "Индекс активности акул как взвешенная сумма нормализованных параметров",
                "variables": {
                    "SAI": "Shark Activity Index",
                    "w₁, w₂, w₃": "Весовые коэффициенты (0.35, 0.40, 0.25)",
                    "g(SST)": "Температурная предпочтительность",
                    "h(Chl-a)": "Зависимость от продуктивности",
                    "k(|SLA|)": "Влияние океанических фронтов",
                    "ε": "Случайная ошибка ~ N(0, 0.2)"
                }
            },

            "2. ТЕМПЕРАТУРНАЯ ПРЕДПОЧТИТЕЛЬНОСТЬ": {
                "formula": "g(SST) = exp(-0.5 × ((SST - μ) / σ)²)",
                "description": "Гауссова функция с оптимумом при 22°C",
                "variables": {
                    "μ": "22°C - оптимальная температура",
                    "σ": "6°C - стандартное отклонение",
                    "SST": "Sea Surface Temperature"
                }
            },

            "3. ЗАВИСИМОСТЬ ОТ ПРОДУКТИВНОСТИ": {
                "formula": "h(Chl-a) = log(1 + Chl-a) × (1 - exp(-Chl-a/θ))",
                "description": "Логарифмическая зависимость с насыщением",
                "variables": {
                    "Chl-a": "Концентрация хлорофилла-а",
                    "θ": "0.3 - параметр насыщения",
                    "log(1 + Chl-a)": "Убывающая отдача от роста продуктивности"
                }
            },

            "4. ВЛИЯНИЕ ОКЕАНИЧЕСКИХ ФРОНТОВ": {
                "formula": "k(|SLA|) = |SLA| / (α + |SLA|)",
                "description": "Функция насыщения Михаэлиса-Ментен для градиентов",
                "variables": {
                    "SLA": "Sea Level Anomaly",
                    "α": "0.1 - константа полунасыщения",
                    "|SLA|": "Абсолютное значение аномалии уровня моря"
                }
            },

            "5. НОРМАЛИЗАЦИЯ ПАРАМЕТРОВ": {
                "formula": "X_norm = (X - μ_X) / σ_X",
                "description": "Z-score нормализация для каждого параметра",
                "variables": {
                    "X": "Исходный параметр (SST, Chl-a, SLA)",
                    "μ_X": "Среднее значение параметра",
                    "σ_X": "Стандартное отклонение параметра"
                }
            },

            "6. ВЕРОЯТНОСТЬ КОРМЁЖКИ": {
                "formula": "P(feeding) = 1 / [1 + exp(-β·(SAI - SAI₀))]",
                "description": "Сигмоидальная функция для классификации горячих точек",
                "variables": {
                    "β": "Крутизна сигмоиды (обычно 1.0)",
                    "SAI₀": "Пороговое значение активности",
                    "P(feeding)": "Вероятность кормёжки от 0 до 1"
                }
            },

            "7. ИНДЕКС ГОРЯЧИХ ТОЧЕК": {
                "formula": "Hotspot_Index = P(feeding) × |∇SST| × |∇Chl-a|",
                "description": "Композитный индекс, учитывающий градиенты",
                "variables": {
                    "|∇SST|": "Градиент температуры поверхности",
                    "|∇Chl-a|": "Градиент хлорофилла",
                    "P(feeding)": "Вероятность кормёжки"
                }
            }
        }

        for section, content in formulas.items():
            print(f"\n{section}")
            print("-" * 50)
            print(f"Формула: {content['formula']}")
            print(f"Описание: {content['description']}")
            print("Переменные:")
            for var, desc in content['variables'].items():
                print(f"  {var}: {desc}")

        print("\n" + "="*80)
        print("ПРАКТИЧЕСКАЯ РЕАЛИЗАЦИЯ В КОДЕ:")
        print("="*80)
        print("""
# Температурная предпочтительность
temp_pref = np.exp(-0.5 * ((df['sst'] - 22) / 6) ** 2)

# Продуктивность с насыщением
productivity = np.log(1 + df['chlorophyll']) * (1 - np.exp(-df['chlorophyll'] / 0.3))

# Океанические фронты
fronts = np.abs(df['sea_level_anomaly']) / (0.1 + np.abs(df['sea_level_anomaly']))

# Финальный индекс
shark_activity = (0.35 * temp_pref_norm + 0.40 * prod_norm + 0.25 * fronts_norm)
        """)

        return formulas

    def simulate_nasa_satellite_data(self, lat, lon, days=365):
        """Симуляция спутниковых данных NASA"""
        dates = pd.date_range(end=datetime.now(), periods=days, freq='D')

        t = np.arange(days)
        seasonal = np.sin(2 * np.pi * t / 365)

        # Sea Surface Temperature (MODIS/Aqua)
        sst_base = 15 + 10 * (1 + np.sin(np.radians(lat))) / 2
        sst = sst_base + 5 * seasonal + np.random.normal(0, 1, days)

        # Chlorophyll-a (Ocean Color)
        chlor_base = 0.1 + 0.5 * np.abs(np.sin(np.radians(lat)))
        chlorophyll = np.maximum(0.01, chlor_base + 0.3 * seasonal + np.random.normal(0, 0.1, days))

        # Sea Level Anomaly (Jason-3)
        sla = np.random.normal(0, 0.15, days) + 0.1 * seasonal

        # Salinity (SMAP)
        salinity = 35 + 2 * np.random.normal(0, 0.5, days)

        return pd.DataFrame({
            'date': dates, 'lat': lat, 'lon': lon,
            'sst': sst, 'chlorophyll': chlorophyll,
            'sea_level_anomaly': sla, 'salinity': salinity
        })

    def calculate_shark_activity(self, df):
        """Расчет индекса активности акул на основе математических формул"""
        # Нормализация параметров (формула 5)
        sst_norm = (df['sst'] - df['sst'].mean()) / df['sst'].std()
        chlor_norm = (df['chlorophyll'] - df['chlorophyll'].mean()) / df['chlorophyll'].std()
        sla_norm = (np.abs(df['sea_level_anomaly']) - np.abs(df['sea_level_anomaly']).mean()) / np.abs(df['sea_level_anomaly']).std()

        # Температурная предпочтительность (формула 2)
        temp_pref = np.exp(-0.5 * ((df['sst'] - 22) / 6) ** 2)
        temp_pref_norm = (temp_pref - temp_pref.mean()) / temp_pref.std()

        # Продуктивность с насыщением (формула 3)
        productivity = np.log(1 + df['chlorophyll']) * (1 - np.exp(-df['chlorophyll'] / 0.3))
        prod_norm = (productivity - productivity.mean()) / productivity.std()

        # Фронты океана (формула 4)
        fronts = np.abs(df['sea_level_anomaly']) / (0.1 + np.abs(df['sea_level_anomaly']))
        fronts_norm = (fronts - fronts.mean()) / fronts.std()

        # Композитный индекс (формула 1)
        shark_activity = (0.35 * temp_pref_norm +
                         0.40 * prod_norm +
                         0.25 * fronts_norm +
                         np.random.normal(0, 0.2, len(df)))

        return shark_activity

    def collect_global_data(self):
        """Сбор данных для всех регионов (базовых + кастомных)"""
        all_data = []
        all_regions = self.get_all_regions()

        print("📡 Загрузка спутниковых данных NASA...")
        print(f"Всего регионов для обработки: {len(all_regions)}")

        for region_name, (lat, lon) in all_regions.items():
            print(f"   📍 Обработка: {region_name} ({lat:.1f}, {lon:.1f})")
            region_data = self.simulate_nasa_satellite_data(lat, lon)
            region_data['region'] = region_name
            region_data['is_custom'] = region_name in self.custom_regions
            all_data.append(region_data)

        global_data = pd.concat(all_data, ignore_index=True)
        global_data['shark_activity'] = self.calculate_shark_activity(global_data)

        print(f"✅ Данные собраны: {len(global_data)} записей")
        return global_data

    def plot_relationships(self, data):
        """Визуализация взаимосвязей с выделением кастомных точек"""
        fig, axes = plt.subplots(2, 3, figsize=(18, 12))
        fig.suptitle('Взаимосвязи между активностью акул и спутниковыми данными NASA\n(Жёлтые точки - кастомные местоположения)',
                    fontsize=14, fontweight='bold')

        # Разделение данных на базовые и кастомные
        base_data = data[~data['is_custom']]
        custom_data = data[data['is_custom']]

        # 1. SST vs Shark Activity
        sc1_base = axes[0,0].scatter(base_data['sst'], base_data['shark_activity'],
                                    c=base_data['chlorophyll'], cmap='viridis', alpha=0.6, s=20)
        if len(custom_data) > 0:
            sc1_custom = axes[0,0].scatter(custom_data['sst'], custom_data['shark_activity'],
                                          c='yellow', alpha=0.8, s=60, edgecolors='black', label='Кастомные')
            axes[0,0].legend()
        axes[0,0].set_xlabel('Температура поверхности моря (°C)')
        axes[0,0].set_ylabel('Индекс активности акул')
        axes[0,0].set_title('Активность акул vs Температура')
        axes[0,0].grid(True, alpha=0.3)
        plt.colorbar(sc1_base, ax=axes[0,0], label='Хлорофилл-а (mg/m³)')

        # 2. Chlorophyll vs Shark Activity
        sc2_base = axes[0,1].scatter(base_data['chlorophyll'], base_data['shark_activity'],
                                    c=base_data['sst'], cmap='plasma', alpha=0.6, s=20)
        if len(custom_data) > 0:
            axes[0,1].scatter(custom_data['chlorophyll'], custom_data['shark_activity'],
                            c='yellow', alpha=0.8, s=60, edgecolors='black')
        axes[0,1].set_xlabel('Хлорофилл-а (mg/m³)')
        axes[0,1].set_ylabel('Индекс активности акул')
        axes[0,1].set_title('Активность акул vs Продуктивность')
        axes[0,1].grid(True, alpha=0.3)
        plt.colorbar(sc2_base, ax=axes[0,1], label='Температура (°C)')

        # 3. Sea Level Anomaly vs Shark Activity
        sc3_base = axes[0,2].scatter(np.abs(base_data['sea_level_anomaly']), base_data['shark_activity'],
                                    c=base_data['chlorophyll'], cmap='viridis', alpha=0.6, s=20)
        if len(custom_data) > 0:
            axes[0,2].scatter(np.abs(custom_data['sea_level_anomaly']), custom_data['shark_activity'],
                            c='yellow', alpha=0.8, s=60, edgecolors='black')
        axes[0,2].set_xlabel('Абсолютная аномалия уровня моря (м)')
        axes[0,2].set_ylabel('Индекс активности акул')
        axes[0,2].set_title('Активность акул vs Океанические фронты')
        axes[0,2].grid(True, alpha=0.3)
        plt.colorbar(sc3_base, ax=axes[0,2], label='Хлорофилл-а (mg/m³)')

        # 4. Временные ряды для первого региона
        first_region = data['region'].iloc[0]
        region_data = data[data['region'] == first_region].copy().sort_values('date')

        axes[1,0].plot(region_data['date'], region_data['shark_activity'],
                      'r-', linewidth=2, label='Активность акул')
        axes[1,0].set_xlabel('Дата')
        axes[1,0].set_ylabel('Индекс активности', color='red')
        axes[1,0].tick_params(axis='y', labelcolor='red')
        axes[1,0].set_title(f'Сезонная динамика: {first_region}')
        axes[1,0].grid(True, alpha=0.3)
        axes[1,0].legend(loc='upper left')

        ax2 = axes[1,0].twinx()
        ax2.plot(region_data['date'], region_data['sst'], 'b-', alpha=0.7, label='SST')
        ax2.set_ylabel('Температура (°C)', color='blue')
        ax2.tick_params(axis='y', labelcolor='blue')
        ax2.legend(loc='upper right')

        # 5. Корреляционная матрица
        corr_data = data[['sst', 'chlorophyll', 'sea_level_anomaly', 'shark_activity']]
        corr_matrix = corr_data.corr()

        im = axes[1,1].imshow(corr_matrix.values, cmap='coolwarm', vmin=-1, vmax=1, aspect='auto')
        axes[1,1].set_xticks(range(len(corr_matrix.columns)))
        axes[1,1].set_yticks(range(len(corr_matrix.columns)))
        axes[1,1].set_xticklabels(corr_matrix.columns, rotation=45)
        axes[1,1].set_yticklabels(corr_matrix.columns)
        axes[1,1].set_title('Матрица корреляций')

        for i in range(len(corr_matrix.columns)):
            for j in range(len(corr_matrix.columns)):
                axes[1,1].text(j, i, f'{corr_matrix.iloc[i, j]:.2f}',
                              ha='center', va='center', fontweight='bold')

        # 6. Распределение активности по регионам
        region_activity = data.groupby('region')['shark_activity'].mean().sort_values(ascending=True)
        colors = ['yellow' if reg in self.custom_regions else 'blue' for reg in region_activity.index]

        bars = axes[1,2].barh(range(len(region_activity)), region_activity.values, color=colors, alpha=0.7)
        axes[1,2].set_yticks(range(len(region_activity)))
        axes[1,2].set_yticklabels(region_activity.index)
        axes[1,2].set_xlabel('Средняя активность акул')
        axes[1,2].set_title('Активность акул по регионам\n(жёлтые - кастомные)')
        axes[1,2].grid(True, alpha=0.3, axis='x')

        plt.tight_layout()
        plt.show()

        return fig

    def create_global_map(self, data):
        """Создание глобальной карты с кастомными точками"""
        region_avg = data.groupby('region').agg({
            'shark_activity': 'mean',
            'lat': 'first',
            'lon': 'first',
            'sst': 'mean',
            'chlorophyll': 'mean',
            'is_custom': 'first'
        }).reset_index()

        fig = plt.figure(figsize=(16, 10))
        ax = plt.axes(projection=ccrs.PlateCarree())

        ax.add_feature(cfeature.LAND, color='lightgray')
        ax.add_feature(cfeature.COASTLINE, linewidth=0.5)
        ax.add_feature(cfeature.BORDERS, linewidth=0.3)
        ax.add_feature(cfeature.OCEAN, color='lightblue', alpha=0.3)
        ax.gridlines(draw_labels=True, linewidth=0.5, color='gray', alpha=0.5)

        # Разделение на базовые и кастомные точки
        base_points = region_avg[~region_avg['is_custom']]
        custom_points = region_avg[region_avg['is_custom']]

        # Базовые точки
        scatter_base = ax.scatter(base_points['lon'], base_points['lat'],
                                c=base_points['shark_activity'],
                                s=base_points['chlorophyll'] * 800,
                                cmap='hot', alpha=0.7,
                                edgecolors='black', linewidth=0.5,
                                transform=ccrs.PlateCarree())

        # Кастомные точки (выделяем)
        if len(custom_points) > 0:
            scatter_custom = ax.scatter(custom_points['lon'], custom_points['lat'],
                                      c=custom_points['shark_activity'],
                                      s=custom_points['chlorophyll'] * 1000,  # Больший размер
                                      cmap='hot', alpha=1.0,
                                      edgecolors='red', linewidth=2,  # Красная обводка
                                      marker='*',  # Звездочка вместо круга
                                      transform=ccrs.PlateCarree())

        # Подписи регионов
        for i, row in region_avg.iterrows():
            color = 'red' if row['is_custom'] else 'black'
            weight = 'bold' if row['is_custom'] else 'normal'
            ax.text(row['lon'] + 2, row['lat'], row['region'],
                   fontsize=8, fontweight=weight, color=color,
                   transform=ccrs.PlateCarree())

        cbar = plt.colorbar(scatter_base, ax=ax, shrink=0.6)
        cbar.set_label('Индекс активности акул', fontsize=12)

        title = 'Глобальная карта ожидаемой активности акул\n'
        title += '🔴 Звездочки - кастомные местоположения'
        ax.set_title(title, fontsize=14, fontweight='bold', pad=20)

        plt.tight_layout()
        plt.show()

        return fig

    def generate_hotspot_predictions(self, data):
        """Анализ горячих точек с учетом кастомных местоположений"""
        print("\n🔍 Анализ горячих точек кормёжки...")

        threshold = np.percentile(data['shark_activity'], 80)
        hotspots = data[data['shark_activity'] > threshold]

        print(f"Порог горячих точек: {threshold:.2f}")
        print(f"Обнаружено горячих точек: {len(hotspots)}")

        # Статистика по всем регионам
        region_stats = data.groupby('region').agg({
            'shark_activity': ['mean', 'max', 'count'],
            'sst': 'mean',
            'chlorophyll': 'mean',
            'is_custom': 'first'
        }).round(3)

        print("\n📊 Статистика по всем регионам:")
        for region in region_stats.index:
            stats = region_stats.loc[region]
            custom_mark = " 🔴" if stats[('is_custom', 'first')] else ""
            print(f"  {region}{custom_mark}: активность={stats[('shark_activity', 'mean')]:.2f}, "
                  f"SST={stats[('sst', 'mean')]:.1f}°C, хлорофилл={stats[('chlorophyll', 'mean')]:.2f}")

        return hotspots

# 🚀 ИНТЕРАКТИВНЫЙ ЗАПУСК
def interactive_analysis():
    """Интерактивный запуск модели с кастомными точками"""
    print("🦈 МАТЕМАТИЧЕСКАЯ МОДЕЛЬ ИДЕНТИФИКАЦИИ АКУЛ NASA")
    print("=" * 60)

    # Инициализация модели
    shark_model = SharkActivityModel()

    # 1. Показ математических формул
    shark_model.display_mathematical_formulas()

    # 2. Добавление кастомных точек
    print("\n📍 ДОБАВЛЕНИЕ КАСТОМНЫХ МЕСТОПОЛОЖЕНИЙ")
    print("-" * 40)

    # Пример кастомных точек (можно заменить на ввод пользователя)
    custom_locations = {
        'my_research_area': (40.0, -70.0),
        'test_zone': (-20.0, 120.0),
        'north_pacific': (45.0, -160.0)
    }

    shark_model.add_multiple_locations(custom_locations)

    # 3. Сбор данных
    print("\n📡 СБОР ДАННЫХ")
    print("-" * 40)
    nasa_data = shark_model.collect_global_data()

    # 4. Визуализация
    print("\n📈 ВИЗУАЛИЗАЦИЯ РЕЗУЛЬТАТОВ")
    print("-" * 40)
    print("Построение графиков взаимосвязей...")
    shark_model.plot_relationships(nasa_data)

    print("Создание глобальной карты...")
    shark_model.create_global_map(nasa_data)

    # 5. Анализ
    hotspots = shark_model.generate_hotspot_predictions(nasa_data)

    print("\n✅ МОДЕЛЬ УСПЕШНО ЗАВЕРШИЛА РАБОТУ!")
    print("=" * 60)

    return shark_model, nasa_data

if __name__ == "__main__":
    # Запуск интерактивного анализа
    model, data = interactive_analysis()

    # Дополнительная информация для пользователя
    print("\n💡 КАК ДОБАВИТЬ СВОИ ТОЧКИ:")
    print("""
    # Пример добавления кастомных точек:
    model.add_custom_location('название_точки', широта, долгота)

    # Или несколько точек сразу:
    custom_points = {
        'точка_1': (55.0, 37.0),
        'точка_2': (60.0, 30.0)
    }
    model.add_multiple_locations(custom_points)

    # Затем перезапустите сбор данных:
    new_data = model.collect_global_data()
    """)
