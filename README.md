# ocean-sharks

Web dashboard for NASA Space Apps Challenge. The project combines shark feeding hotspot prediction with visual analytics of satellite products (SST, chlorophyll, etc.).

## New PACE L2 Materials
- Added visualizations from `plots/first` and `plots/second` in the "PACE L2 Analysis" section on the main page.
- Gallery displays NFLH/AVW comparison (05 ↔ 09 Sep 2025), ∆NFLH heatmap, mean Rrs spectrum, and OC4-chlorophyll (via Earthaccess).
- All images are connected directly from `plots/` without manual copying.

## Running
```bash
npm install
npm run dev
```

For production build:
```bash
npm run build
```

### Update dashboards
- `python scripts/build_plotly_from_png.py` — convert PACE PNG outputs into Plotly-ready JSON.
- `python scripts/build_shark_model_dashboard.py` — refresh synthetic shark-activity dataset for the interactive model section.


## Docker
```bash
# Build the production image
docker build -t nasa-shark-app .

# Run the container (served on http://localhost:3000)
docker run --rm -p 3000:3000 nasa-shark-app
```


### Hackathon Pitch
See `docs/hackathon_pitch.md` for the talking points, storyboard, and demo steps.

