export const gridMeta = {
  nflh_05Sep: {
    title: "NFLH 05 Sep",
    description: "Baseline normalized fluorescence (NFLH) prior to bloom amplification.",
    colorscale: "Viridis",
    colorbarTitle: "Relative NFLH"
  },
  nflh_09Sep: {
    title: "NFLH 09 Sep",
    description: "NFLH peak showing intensified chlorophyll front on 09 Sep.",
    colorscale: "Viridis",
    colorbarTitle: "Relative NFLH"
  },
  avw_05Sep: {
    title: "AVW 05 Sep",
    description: "Absorption at 551 nm (AVW) for clarity context before the bloom.",
    colorscale: "Viridis",
    colorbarTitle: "Relative AVW"
  },
  avw_09Sep: {
    title: "AVW 09 Sep",
    description: "AVW snapshot after bloom growth, highlighting turbidity shifts.",
    colorscale: "Viridis",
    colorbarTitle: "Relative AVW"
  },
  "chlorophyll-2025-09-01AND2025-09-07": {
    title: "OC4 proxy 01-07 Sep",
    description: "OC4 chlorophyll proxy (Earthaccess) for the early week window.",
    colorscale: "Viridis",
    colorbarTitle: "Relative Chl-a"
  },
  "chlorophyll-2025-09-08AND2025-09-14": {
    title: "OC4 proxy 08-14 Sep",
    description: "OC4 proxy one week later, capturing eastward propagation of the bloom.",
    colorscale: "Viridis",
    colorbarTitle: "Relative Chl-a"
  }
};

export const deltaMeta = {
  title: "Delta NFLH (09 Sep - 05 Sep)",
  description: "Difference heatmap spotlighting phytoplankton surges between the two PACE scenes.",
  colorscale: "RdBu",
  colorbarTitle: "Delta NFLH (norm)",
  zmid: 0
};

export const lineMeta = {
  rrs_mean: {
    title: "Mean Rrs Spectra",
    description: "Compare the averaged water-leaving reflectance (Rrs) spectra for 05 and 09 Sep with zoomable, exportable traces."
  }
};