# GenomeVisProject

### How to run the frontend

(Depends on having node.js installed, version >=18.0) Last tested on v22.13.1
(if a mac user, recommend using the Node Version Manager (nvm) to assist with proper versioning)
.nvmrc file contains the current node version this project was tested.
go to `frontend` and run `nvm install`

1. Create a `dataroot` folder inside `public` folder and copy the data inside it
2. Run `npm install` to install all dependencies
3. Run `npm run dev` to start the frontend
4. Open [http://localhost:5173](http://localhost:5173) with your browser to see the result.

### How to run the data processing

(python version == 3.9.6)
use pyenv for proper versioning
.python-version file contains the current python version for this project

go to `data_processing_python` and run
`pyenv install --skip-existing` and then `pyenv local`
verify `pyenv version` and `python --version`

1. Go to `data_processing_python` folder
2. Create a virtual environment with `python3 -m venv venv`
3. Activate the virtual environment with
   for mac `source venv/bin/activate`
   fow windows `.\venv\Scripts\activate`
4. Run `pip install -r requirements.txt` to install all dependencies (only the first time running the project)
5. (if new package is installed) update requirements.txt `pip freeze > requirements.txt`
6. Run `jupyter notebook` to start the notebook

## Data Processing Guide

- Run the ipynb files based on the order they are created (e.g, 01*{file_name}, 02*{file_name})
- For each ipynb, check if the input data file paths and output save paths are correct
