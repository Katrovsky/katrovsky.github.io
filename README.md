![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/Katrovsky/katrovsky.github.io/mkdocs_deploy.yml)
![GitHub repo size](https://img.shields.io/github/repo-size/Katrovsky/katrovsky.github.io)
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/Katrovsky/katrovsky.github.io)
![GitHub last commit (branch)](https://img.shields.io/github/last-commit/Katrovsky/katrovsky.github.io/gh-pages?style=flat)
![Website](https://img.shields.io/website?url=https%3A%2F%2Fkatrovsky.github.io%2F&label=katrovsky.github.io)
![Static Badge](https://img.shields.io/badge/any_text-MkDocs-blue?style=flat&logo=MkDocs&label=Made%20with)


# Getting Started

## Prerequisites

* **Python**: You need to have Python installed on your system. You can download it from the official Python website if you haven't already.
* **GitHub**: You need a GitHub account to clone and work with this repository.

## Cloning the Repository

To get started, clone this repository using the following command:
```
git clone https://github.com/Katrovsky/katrovsky.github.io.git
```

## Setting up the Environment

Next, create a virtual environment for Python using the following commands:

```
python -m venv .env
source env/bin/activate  # On Windows, use `.env\Scripts\activate` instead
```

This will activate the virtual environment. You can verify this by seeing the name of the environment printed on your terminal.

## Installing Required Modules

Once you're in the virtual environment, install the required modules using pip:

```
pip install -r requirements.txt
```

This will install all the dependencies specified in the `requirements.txt` file.

## Running the MkDocs Server

Finally, to run the MkDocs server, use the following command:

```
mkdocs serve
```

This will start a development server that you can access by navigating to <http://localhost:8000> in your web browser. You should see the website up and running!

That's it! You're now ready to work with repository.