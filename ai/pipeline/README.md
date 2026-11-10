# StyleMate AI — ML Pipeline

This folder contains the complete, end-to-end machine learning pipeline
for the StyleMate outfit compatibility model. Scripts are numbered in
execution order.

## Run Order

| Step | Script | What It Does |
|------|--------|-------------|
| 1 | `01_explore_dataset.py` | Inspect the raw Polyvore JSON files in a readable format |
| 2 | `02_build_dataset.py` | Build the 20,000-outfit feature CSV from Polyvore data |
| 3 | `03_eda_analysis.py` | Exploratory Data Analysis — correlation heatmaps, distributions |
| 4 | `04_train_model.py` | Train & benchmark 3 models, save the winning model |
| 5 | `05_shap_analysis.py` | SHAP explainability — global rankings + per-outfit explanations |
| 6 | `06_generate_report.py` | Generate comprehensive PDF report on the Desktop |

## How to Run Any Script

Always run from the `ai/` directory using the project virtual environment:

```bash
cd /Users/khyatianand/Documents/stylemate/ai
./venv/bin/python3 pipeline/04_train_model.py
```

## Inputs & Outputs

| Script | Input | Output |
|--------|-------|--------|
| `01` | `/Downloads/polyvore/*.json` | Console summary |
| `02` | `/Downloads/polyvore/train_no_dup.json` | `data/polyvore_outfits_features.csv` |
| `03` | `data/polyvore_outfits_features.csv` | `docs/eda_*.png` |
| `04` | `data/polyvore_outfits_features.csv` | `models/v2_polyvore/outfit_model.pkl` + `docs/model_*.png` |
| `05` | `models/v2_polyvore/outfit_model.pkl` | `docs/shap_*.png` |
| `06` | `docs/*.png` | `~/Desktop/StyleMate_Dataset_and_EDA_Report.pdf` |

## Data Source

**Polyvore Outfits Dataset** — Maryland Polyvore (2017)
- 17,316 training outfits curated by human stylists
- Located at: `/Users/khyatianand/Downloads/polyvore/`
