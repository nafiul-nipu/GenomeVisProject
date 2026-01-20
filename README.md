# GenomeVisProject

This repository contains the complete codebase used for the analyses and visualizations presented in the paper. It includes:

1. A Python-based data processing pipeline, including the MPASE framework, used to align and abstract reconstructed 3D genome structures.  
   ([MPASE Github repository and documentation](https://github.com/nafiul-nipu/MPASE.git))
2. A web-based visual analytics frontend for interactive exploration of spatial genome organization, gene relocation, and temporal functional changes.  
   ([Live demo](https://nafiul-nipu.github.io/GenomeVisProject/))

The repository is provided to support reproducibility of the results reported in the paper and is not intended as a polished or production-ready software release.

---

## Repository structure

```
GenomeVisProject/
├── frontend/                  # Web-based visual analytics system
├── data_processing_python/    # Python data processing pipeline
├── README.md
```

---

# Running the Project Locally From Scratch (For the First Time)

This repository contains two components:

1. **Frontend** (Node.js / Vite / React)
2. **Data Processing Pipeline / Backend** (Python / Jupyter)

---

## OS Compatibility

### Frontend

✅ **Fully cross-platform**

- macOS
- Linux
- Windows (native)

### Data Processing Pipeline / Backend (Python)

✅ **Tested and supported**

- macOS
- Linux

⚠️ **Windows (native)**

- Not officially supported.
- Some Python packages used in the pipeline may fail to install or behave differently on Windows.
- Native Windows support is **best-effort only**.

✅ **Windows via WSL (Recommended)**

- Windows users should run the backend inside **Windows Subsystem for Linux (WSL – Ubuntu)**.
- This provides the same environment as Linux and is the most reliable option.

---

## Part 1: Frontend Setup (Node.js)

### Requirements

- Internet connection
- Terminal / Command Prompt
- **Node.js ≥ 18**
- Last tested with **Node v22.13.1**
- **Node Version Manager (nvm)**

The repository includes an `.nvmrc` file specifying the tested Node version.

---

## Step 1: Install Node Version Manager (nvm)

### macOS & Linux

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

Restart your terminal, then verify:

```bash
nvm --version
```

If `nvm` is not found, add the following to `~/.bashrc` or `~/.zshrc`:

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
```

---

### Windows (Native)

Windows does not support `nvm` directly. Use **nvm-windows**:

https://github.com/coreybutler/nvm-windows

```powershell
nvm install 22.13.1
nvm use 22.13.1
```

Alternatively, you may install Node.js directly from the official website:  
https://nodejs.org/en

- Download the LTS or v22.x installer
- Make sure Node version is ≥ 18
- Verify after installation: `node --version`

---

### Windows (WSL)

Inside WSL (Ubuntu):

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

---

## Step 2: Install Frontend Dependencies

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
   The example processed data sample is in the `frontend/public/dataroot/` folder already

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

## Part 2: Data Processing Pipeline (Python)

### Python Version Notes

| Component            | Version            |
| -------------------- | ------------------ |
| Pipeline tested      | **Python 3.10.14** |
| Backend also runs on | **Python 3.9.6**   |

---

## Backend Setup (macOS / Linux / WSL)

### Step 1: Install pyenv

#### macOS

Install homebrew (https://brew.sh/).

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Install pyenv

```bash
brew install pyenv
```

#### Linux / WSL (Ubuntu)

```bash
sudo apt update
sudo apt install -y build-essential libssl-dev zlib1g-dev libbz2-dev libreadline-dev libsqlite3-dev curl llvm libncursesw5-dev xz-utils tk-dev libxml2-dev libxmlsec1-dev libffi-dev liblzma-dev
curl https://pyenv.run | bash
```

---

### Step 2: Install Python and Create Virtual Environment

```bash
cd data_processing_python
pyenv install --skip-existing 3.10.14
pyenv local 3.10.14
python -m venv venv
source venv/bin/activate
```

---

### Step 3: Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

---

### Step 4: Run Jupyter

```bash
jupyter notebook
```

---

## Windows (Native) – Backend Note

The Python data processing pipeline is **tested and supported on macOS and Linux**.

Native Windows is **not officially supported**, primarily because some third-party
scientific Python packages may fail to install or behave differently on Windows.

However, **not all packages listed in `requirements.txt` are required for every
pipeline configuration**. Some dependencies are optional or used only in specific
analysis paths.

If you encounter installation issues on Windows:

- You may remove or comment out unused packages from `requirements.txt`
- You may adjust the environment based on the parts of the pipeline you intend to run
- **Windows Subsystem for Linux (WSL – Ubuntu) is the recommended and fully supported option**

---

## Reusing the Project (After First-Time Setup)

If you have already completed the setup once, or if you are only reusing
**existing processed data**, you do **not** need to repeat the full installation.

### Frontend Only (Most Users)

If you are only running the visualization with existing processed data:

```bash
cd frontend
nvm use        # or ensure Node ≥ 18
npm install    # only needed if dependencies changed
npm run dev
```

Make sure the processed dataset is present in:

```text
frontend/public/dataroot/
```

---

### Backend Reuse (Optional)

If you already have a working Python environment and only want to rerun
or modify parts of the data processing pipeline:

```bash
cd data_processing_python
source venv/bin/activate
jupyter notebook
```

You do **not** need to reinstall Python, recreate the virtual environment,
or reinstall dependencies unless:

- `requirements.txt` has changed
- You switched Python versions
- Your environment was deleted

---

### Notes

- The backend environment is reusable across runs
- The frontend automatically reloads when data changes
- Existing processed data can be reused across multiple frontend sessions

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
