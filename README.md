
/































Readme · MD
# 🍄 MushroomLens
### Prototype Web Application for Preliminary Identification of Edible Wild Mushrooms using AI, with Usability Evaluation
 
![Course](https://img.shields.io/badge/Project-0904404_DBIS_1%2F2026-blue)
![Species](https://img.shields.io/badge/Edible_Species-15-success)
![SUS](https://img.shields.io/badge/SUS_Mean-70.0_(n%3D20)-yellowgreen)
![USE](https://img.shields.io/badge/USE_Mean-4.49%2F5-success)
 
> 🌐 **Live prototype:** https://nitikal-msu.github.io/mushroomlens/MushroomLens/
 
---
## 📌 Project Overview
Wild mushrooms are an important food source in many parts of Thailand, but identifying them by eye is risky because some edible and poisonous species look alike. **MushroomLens** is a research prototype that helps users identify **15 edible wild mushroom species** from photographs and presents the result together with key characteristics, habitats, look-alike species, and safety warnings.
 
This repository contains the prototype website, the research questionnaire, and the research paper from the course **0904404 Digital Business and Information Systems Project 1/2026, Faculty of Management Science (MBS), Mahasarakham University**.
 
> ⚠️ **Safety disclaimer:** AI results are *supporting information only*. They must **not** be used to confirm that a mushroom is safe to eat. Always have wild mushrooms checked by a local expert before consuming them.
 
## 🎯 Research Objectives
1. Develop the MushroomLens prototype: an image-classification model for 15 edible species (Teachable Machine) plus a website that shows supporting information and safety warnings.
2. Evaluate usability and user perception with **20 users** using the **System Usability Scale (SUS)** and the **USE Questionnaire**.
## 🧠 Methodology
| Stage | Details |
|---|---|
| **Design framework** | Human-centred design with the **Double Diamond** (Discover → Define → Develop → Deliver) |
| **Dataset** | 623 photos collected, **549 selected** for model development; 15 edible species; **no poisonous species in the training set** |
| **Model** | Transfer learning with **Teachable Machine** (Image Project), exported to **TensorFlow.js** |
| **Classification type** | Closed-set: output is always one of the 15 trained species |
| **Website** | HTML, CSS, JavaScript built in Visual Studio Code, hosted on GitHub |
| **Evaluation** | Scenario-based testing, then SUS (10 items, scored 0–100) and USE (4 dimensions) via online questionnaire |
| **Analysis** | Descriptive statistics (frequency, percentage, mean, S.D.) |
 
<!-- ใส่ภาพ Teachable Machine / หน้าเว็บ ที่นี่ เช่น <img src="img/readme/teachable-machine.png" width="800"> -->
 
## 🍄 Species in Scope (15)
| # | Thai name | Scientific name |
|---|---|---|
| 1 | เห็ดหน้าวัว | *Lactifluus piperatus* |
| 2 | เห็ดหน้าแดง | *Russula lepida* |
| 3 | เห็ดระโงกเหลือง | *Amanita hemibapha* |
| 4 | เห็ดระโงกขาว | *Amanita princeps* |
| 5 | เห็ดเพิก | *Russula densifolia* |
| 6 | เห็ดผึ้งนกยูง | *Heimioporus retisporus* |
| 7 | เห็ดผึ้งข้าว | *Boletus* sp. |
| 8 | เห็ดผึ้ง (เห็ดตับเต่า) | *Phlebopus* spp. / *Boletus* spp. |
| 9 | เห็ดถ่าน | *Russula nigricans* |
| 10 | เห็ดตะไคล (เห็ดหล่ม) | *Russula virescens* |
| 11 | เห็ดโคน (เห็ดปลวก) | *Termitomyces fuliginosus* |
| 12 | เห็ดขม (เห็ดผึ้งขม) | *Tylopilus felleus* |
| 13 | เห็ดเกลือ | *Russula delica* |
| 14 | เห็ดยูคา (เห็ดผึ้งขม) | *Boletus griseipurpureus* |
| 15 | เห็ดเผาะ | *Astraeus hygrometricus* |
 
## 📊 Key Results (n = 20)
 
**System Usability Scale (SUS)**
| Metric | Value |
|---|---|
| Mean score | **70.0** (S.D. = 17.5) |
| Range | 40.0 – 100.0 |
| 95% CI of the mean | 61.7 – 78.1 (includes the 68 benchmark) |
| Users scoring ≥ 68 | 11 of 20 (55%) |
| Users scoring < 68 | 9 of 20 (45%) |
 
**USE Questionnaire (1–5 scale)**
| Dimension | Mean | S.D. | Level |
|---|---|---|---|
| Usefulness | 4.35 | 0.87 | High |
| Ease of Use | 4.42 | 0.60 | High |
| Ease of Learning | 4.63 | 0.58 | Highest |
| Satisfaction | 4.57 | 0.56 | Highest |
| **Overall** | **4.49** | 0.65 | High |
 
**Interpretation:** The SUS mean is close to the 68 reference value; this is a *descriptive* comparison, not a hypothesis test, so no significant difference is claimed. Scores were widely spread, so usability perception varied between users. Ease of Learning was rated highest and Usefulness lowest.
 
## ⚠️ Limitations
1. **Scope of data:** the model covers only 15 edible species and was trained without poisonous mushrooms, so it may force an out-of-scope photo into one of the 15 classes.
2. **No formal accuracy evaluation:** model accuracy was not tested on a separate hold-out set, so no accuracy figure is reported.
3. **Sample:** 20 testers from one context; results should not be generalised to all wild-mushroom foragers.
## 🔭 Future Work
- Expand the image dataset (lighting, angles, backgrounds, growth stages) and include out-of-scope and poisonous species to study open-set behaviour.
- Evaluate the model on a train/test split and report suitable classification metrics.
- Add expert verification of species data and test with experienced foragers in real settings.
## 📄 Read the Full Research Paper
The complete methodology, literature review, and results are in the paper.
 
[👉 Click here to read the full PDF paper](./การพัฒนาและประเมินเว็บแอปพลิเคชันสนับสนุนการคัดกรองเบื้องต้นและให้ข้อมูลความเสี่ยงของเห็ดป่าในประเทศไทยด้วยการเรียนรู้เชิงลึกและการออกแบบประสบการณ์ผู้ใช้ (1).pdf)
 
## 🗂️ Repository Structure
```
MushroomLens/
├── index.html        # Prototype website (Species Library, Classify, Community, Research)
├── survey.html       # Research questionnaire (SUS, tasks, trust, knowledge check)
├── mainstyle.css     # Styles
├── js/               # Classification script (classify.js)
└── img/
    ├── species/      # Edible/, Needs Verification/, Poisonous/
    ├── community/
    └── research/
```
 
## 🛠️ Tools & Technologies
- **Model:** Teachable Machine (transfer learning, MobileNet-based), TensorFlow.js
- **Web:** HTML, CSS, JavaScript, Visual Studio Code, GitHub / GitHub Pages
- **Evaluation:** System Usability Scale (SUS), USE Questionnaire
- **Data collection (optional extension):** Google Apps Script + Google Sheets (`survey.html`)
## 📚 Citation
```
[Author names]. Development of the MushroomLens Prototype Web Application for
Preliminary Identification of Edible Wild Mushroom Species Using Artificial
Intelligence and Usability Evaluation with Users. 0904404 Digital Business and
Information Systems Project 1/2026, Mahasarakham University; 2026.
```
 
Claude finished the response
