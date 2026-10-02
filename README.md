<div align="center">

# 🦎 Salamanders

**A video keyframe processing & retrieval pipeline built for the HCM AI Challenge 2026**

![Status](https://img.shields.io/badge/status-under%20development-orange?style=for-the-badge)
![Python](https://img.shields.io/badge/python-3.12.6-blue?style=for-the-badge&logo=python&logoColor=white)
![AIC](https://img.shields.io/badge/AIC%202026-finalist-success?style=for-the-badge)

</div>

> ⚠️ **This repository is under active development.** Code, structure and documentation may change frequently, and some parts may be incomplete or experimental.

---

## 🏆 Competition Results

| Preliminary Round – HCM AI Challenge 2026 | Final Round – AIC 2026 |
| :---: | :---: |
| ![Preliminary round rank](assets/rank_preliminary.png) | ![Final round rank](assets/rank_final.png) |
| Repo ranking in the preliminary round | Qualified to compete in the final round |

> 🖼️ *The images above are placeholders. Replace `assets/rank_preliminary.png` and `assets/rank_final.png` with the real results.*

---

## 📖 About

**Salamanders** is our team's project for the **HCM AI Challenge 2026**. It is a collection of Python tools for working with video data at the keyframe level, including:

- 🎞️ **Keyframe processing**: extracting, counting and analysing keyframes (`analysis_keyframes.py`, `processing_keyframes_info.py`)
- 🗜️ **Data preparation**: compressing and organising video / metadata (`compress.py`, `get_video_clb.py`)
- 🔎 **Analysis & indexing**: tools under `analysis/` and `index/`
- 🖥️ **App**: the application layer lives in `app/`
- 📤 **Submission**: helper scripts for submitting results to the competition system (`sudmit.py`)

The project is still evolving as we prepare for the final round of **AIC 2026**.

---

## 📁 Project Structure

```text
salamanders/
├── analysis/      # Analysis tools
├── app/           # Application
├── index/         # Indexing
├── scripts/       # Utility scripts
├── test/          # Tests
├── *.py           # Pipeline scripts (keyframes, compress, submit, ...)
├── data.json
├── keyframe_count.json
└── requirements.txt
```

---

## 🚀 Getting Started

### Create your python virtual enviroment

**Recommend python version 3.12.6**

```bash
python -m venv .venv

# Linux / macOS
source .venv/bin/activate

# Windows
.venv\Scripts\activate
```

### Install requirements.txt

```bash
pip install -r requirements.txt
```

---

## 🤝 Contributing

The project is in active development, so feel free to open an issue or pull request if you spot something to improve.

## 📬 Contact

Maintained by [DinhNguyenSLK](https://github.com/DinhNguyenSLK).
