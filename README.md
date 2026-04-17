# CineMatch AI: Automated Movie Recommendation Engine

![Platform Preview](https://img.shields.io/badge/Status-Live-success?style=for-the-badge)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi)
![React](https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react)
![AI/ML](https://img.shields.io/badge/AI-SBERT%20Semantic-blueviolet?style=for-the-badge)

CineMatch AI is a production-grade movie recommendation platform featuring a **Pure Automated AI Pipeline**. It combines real-time data scraping, semantic search capabilities, and a sleek, glassmorphic UI to provide high-fidelity film discoveries.

## 🚀 Live Links
- **Platform**: [View Live Site](https://movie-recommender-system.vercel.app) (Please update with your Vercel URL)
- **API Engine**: [Render Web Service](https://movie-recommender-system-l52s.onrender.com)

## ✨ Core Features
- **Semantic Search**: Uses SBERT (Sentence-BERT) embeddings to understand the *meaning* behind your searches, going beyond simple keyword matching.
- **Automated Data Sync**: Custom scrapers for Hollywood (IMDb) and Bollywood (Hungama) ensure the catalog stays fresh with new releases.
- **Top-100 Compressed Matrix**: Optimized AI similarity engine that fits in cloud memory limits without sacrificing accuracy.
- **Admin Command Center**: Real-time statistics, sync logs, and manual trigger controls.
- **Glassmorphic UI**: A premium, responsive design built with React, Tailwind CSS, and Framer Motion.

## 🛠️ Technology Stack
- **Frontend**: Vite, React 18, Tailwind CSS, Framer Motion, Lucide Icons.
- **Backend**: FastAPI, SQLAlchemy, APScheduler.
- **AI/ML**: Sentence-Transformers (`all-MiniLM-L6-v2`), PyTorch, Scikit-learn.
- **Database**: SQLite (Production-optimized).
- **CI/CD**: GitHub Actions for automated weekly AI re-training.

## ⚙️ How it Works
1. **Scrape**: Custom workflows trigger every Monday/Friday to pull new titles.
2. **Embed**: The AI model processes plot summaries, genres, and cast into multi-dimensional vectors.
3. **Similarity**: A compressed Top-100 similarity matrix is built using cosine similarity.
4. **Serve**: The FastAPI backend serves results via a lazy-loading engine for sub-second responses.

## 🛠️ Local Development

### Backend
1. `cd backend`
2. `pip install -r requirements.txt`
3. `uvicorn main:app --reload`

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`

---
*Built with ❤️ by ZenDev-Arc*
