# GenomeVisProject

This repository contains the complete codebase used for the analyses and visualizations presented in the paper. It includes:

1. A Python-based data processing pipeline, including the MPASE framework, used to align and abstract reconstructed 3D genome structures.
2. A web-based visual analytics frontend for interactive exploration of spatial genome organization, gene relocation, and temporal functional changes.

The repository is provided to support reproducibility of the results reported in the paper and is not intended as a polished or production-ready software release.

---

## Repository structure

```
GenomeVisProject/
├── frontend/                  # Web-based visual analytics system
├── data_processing_python/    # Python data processing pipeline (incl. MPASE)
├── README.md
```

---

## Running the frontend

### Requirements

- Node.js >= 18
- Last tested with Node v22.13.1
- Recommended: Node Version Manager (nvm)

The repository includes an `.nvmrc` file specifying the tested Node version.

### Steps

1. Navigate to the frontend directory:
   `cd frontend`

2. Install and activate the correct Node version:
   `nvm install`  
   `nvm use`

3. Create the data directory expected by the frontend:
   `frontend/public/dataroot/`

4. Copy the processed dataset into `frontend/public/dataroot/`.

```
   Example structure:
   frontend/public/dataroot/green_monkey/
├── shape_data/
│   ├── chr1/
│   ├── chr2/
│   ├── chr3/
│   └── ...
├── structure_genes_aligned/
└── temporal_data/

```

5. Install dependencies and start the development server:
   `npm install`  
   `npm run dev`

6. Open the application in your browser:
   `http://localhost:5173/GenomeVisProject/`

---

## Running the data processing pipeline (Python)

### Requirements

- Python 3.9.6
- Recommended: pyenv

The repository includes a `.python-version` file specifying the tested Python version.

### Steps

1. Navigate to the data processing directory:
   `cd data_processing_python`

2. Install and activate the correct Python version:
   `pyenv install --skip-existing 3.9.6`  
   `pyenv local 3.9.6`  
   `python --version`

3. Create and activate a virtual environment:
   `python -m venv venv`  
   `source venv/bin/activate`

   On Windows:
   `.\venv\Scripts\activate`

4. Install dependencies:
   `pip install -r requirements.txt`

   If new packages are added:
   `pip freeze > requirements.txt`

5. Start Jupyter Notebook:
   `jupyter notebook`

---

## Data processing guide

- Run notebooks in numerical order (e.g., 01*\*.ipynb, then 02*\*.ipynb).
- For each notebook, verify input file paths and output save paths.
- Final outputs (JSON/CSV files) should be copied into:
  `frontend/public/dataroot/`

---

## Data availability

Raw Hi-C datasets are large and are not hosted directly in this repository.

The datasets used in this study are publicly available and described in:
`Venu V, Roth C, Adikari SH, Small EM, et al. *Multi-omics analysis reveals the
dynamic interplay between Vero host chromatin structure and function during
vaccinia virus infection*. Communications Biology, 2024, 7(1):721.
PMID: 38862613`.

Links to the original data repositories (e.g., GEO) are provided in the
corresponding publication.

This repository provides preprocessed example inputs and scripts sufficient to
reproduce the analyses and figures reported in the paper.

---

## Live demo

A live, web-based version of the visual analytics system is available at:

https://nafiul-nipu.github.io/GenomeVisProject/

The demo includes the processed analysis results used in the paper and allows
users to explore 3D genome structures, shape abstractions, and temporal
dynamics without running the frontend locally. This demo is provided for
convenience and inspection; full reproducibility is supported through the
source code and data processing pipeline included in this repository.

## Notes on reproducibility

This repository supports reproducibility of the results presented in the paper.

Users can:

- Inspect the MPASE implementation in the data processing pipeline
- Run provided notebooks to reproduce representative outputs
- Launch the frontend to explore generated data interactively

---

## License

This code is made publicly available for the purpose of academic review and
reproducibility of the results presented in the associated paper.

---

## Contact

Nafiul Nipu  
Email: mnipu2@uic.edu
