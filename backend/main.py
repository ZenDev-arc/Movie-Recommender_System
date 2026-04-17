from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import pickle
import os
import random
import torch
from sentence_transformers import SentenceTransformer, util
from apscheduler.schedulers.background import BackgroundScheduler
from database import SessionLocal, Movie, SyncHistory
from sync_manager import SyncManager

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for data
movies = None
similarity = None
ai_model = None

def load_data():
    global movies, similarity, ai_model
    MOVIES_PKL = "artifacts/movies.pkl"
    SIMILARITY_PKL = "artifacts/similarity.pkl"
    
    if os.path.exists(MOVIES_PKL) and os.path.exists(SIMILARITY_PKL):
        movies_dict = pickle.load(open(MOVIES_PKL, 'rb'))
        movies = pd.DataFrame(movies_dict)
        similarity = pickle.load(open(SIMILARITY_PKL, 'rb'))
        print("Data loaded/refreshed from artifacts.")
    else:
        print("Missing model artifacts. Run sync/preprocess first.")
    
    if not ai_model:
        print("Loading AI Model (SBERT)...")
        ai_model = SentenceTransformer('all-MiniLM-L6-v2')

load_data()

# Scheduler setup
def scheduled_sync():
    manager = SyncManager()
    manager.run_sync()
    load_data() # Refresh in-memory data after sync

scheduler = BackgroundScheduler()
# Monday and Friday at 3:00 AM
scheduler.add_job(scheduled_sync, 'cron', day_of_week='mon,fri', hour=3)
scheduler.start()

MOOD_MAP = {
    "Adrenaline": ["action", "thriller", "adventure", "chase", "explosive", "race", "spy"],
    "Thinker": ["mystery", "sciencefiction", "philosophy", "puzzle", "dystopia", "time", "complex"],
    "Tearjerker": ["romance", "drama", "sad", "unrequited", "death", "family", "nostalgia"],
    "Giggles": ["comedy", "humor", "animation", "fun", "absurd", "parody", "satire"],
    "Dark & Gritty": ["crime", "noir", "gritty", "underworld", "revenge", "brutal", "serious"],
    "Mind-Bending": ["dream", "psychedelia", "surreal", "subconscious", "reality", "mind", "illusion"]
}

def get_common_dna(m1, m2):
    try:
        k1 = set(m1['keywords']) if isinstance(m1['keywords'], list) else set()
        k2 = set(m2['keywords']) if isinstance(m2['keywords'], list) else set()
        g1 = set(m1['genres']) if isinstance(m1['genres'], list) else set()
        g2 = set(m2['genres']) if isinstance(m2['genres'], list) else set()
        
        common_k = list(k1.intersection(k2))
        common_g = list(g1.intersection(g2))
        
        dna = common_g[:1] + common_k[:2]
        
        # Region badge
        if m1['region'] == m2['region']:
            dna.insert(0, f"{m1['region']} Style")
            
        return dna[:3]
    except:
        return ["Similar Vibe"]

@app.get("/search")
async def search_movies(q: str, region: str = "All"):
    if not q: return []
    mask = movies['title'].str.contains(q, case=False, na=False)
    if region != "All":
        mask = mask & (movies['region'] == region)
    results = movies[mask].head(10)
    return results.to_dict(orient='records')

@app.get("/trending")
async def get_trending(region: str = "All"):
    data = movies if region == "All" else movies[movies['region'] == region]
    trending = data.sort_values(by='popularity', ascending=False).head(20)
    return trending.drop(columns=['tags']).to_dict(orient='records')

@app.get("/top-rated")
async def get_top_rated(region: str = "All"):
    data = movies if region == "All" else movies[movies['region'] == region]
    top_rated = data[data['vote_count'] > 50].sort_values(by='vote_average', ascending=False).head(20)
    return top_rated.drop(columns=['tags']).to_dict(orient='records')

@app.get("/hidden-gems")
async def get_hidden_gems(region: str = "All"):
    data = movies if region == "All" else movies[movies['region'] == region]
    gems = data[(data['popularity'] < 20) & (data['vote_average'] > 7.4)].head(20)
    return gems.drop(columns=['tags']).to_dict(orient='records')

@app.get("/random")
async def get_random(region: str = "All"):
    data = movies if region == "All" else movies[movies['region'] == region]
    random_movie = data.sample(n=1).iloc[0]
    return random_movie.drop(labels=['tags']).to_dict()

@app.get("/moods")
async def get_moods():
    return list(MOOD_MAP.keys())

@app.get("/mood")
async def get_by_mood(vibe: str, region: str = "All"):
    keywords = MOOD_MAP.get(vibe, [])
    if not keywords: return []
    
    pattern = '|'.join(keywords)
    data = movies if region == "All" else movies[movies['region'] == region]
    
    # Variety Fix: Filter, then sort by popularity, then take top results
    results = data[data['tags'].str.contains(pattern, case=False, na=False)]
    results = results.sort_values(by=['popularity', 'vote_average'], ascending=False).head(40)
    
    # Diversity: Take a random sample of 20 from the top 40 for freshness
    final_results = results.sample(n=min(20, len(results)))
    return final_results.drop(columns=['tags']).to_dict(orient='records')

@app.get("/genres")
async def get_genres():
    all_genres = []
    for g_list in movies['genres']:
        if isinstance(g_list, list):
            all_genres.extend(g_list)
    return sorted(list(set(filter(None, all_genres))))

@app.get("/mashup")
async def movie_mashup(t1: str, t2: str):
    try:
        idx1 = movies[movies['title'].str.lower() == t1.lower()].index[0]
        idx2 = movies[movies['title'].str.lower() == t2.lower()].index[0]
    except IndexError:
        raise HTTPException(status_code=404, detail="Movies not found")
        
    fusion_scores = similarity[idx1] + similarity[idx2]
    ids = sorted(list(enumerate(fusion_scores)), reverse=True, key=lambda x: x[1])
    
    recommendations = []
    for i in ids:
        if i[0] != idx1 and i[0] != idx2:
            movie = movies.iloc[i[0]].drop(labels=['tags']).to_dict()
            movie['dna'] = ["Hybrid Match"]
            recommendations.append(movie)
            if len(recommendations) == 5:
                break
    return recommendations

@app.get("/movie")
async def get_movie(title: str):
    movie_row = movies[movies['title'] == title]
    if movie_row.empty:
        # Try case-insensitive fallback for search results
        movie_row = movies[movies['title'].str.lower() == title.lower()]
    if movie_row.empty:
        raise HTTPException(status_code=404, detail="Movie not found")
    return movie_row.drop(columns=['tags']).iloc[0].to_dict()

@app.get("/ai-search")
async def ai_conceptual_search(q: str, region: str = "All", n: int = 15):
    if not q: return []
    
    # 1. Encode the user query
    with torch.no_grad():
        query_embedding = ai_model.encode(q, convert_to_tensor=True)
    
    # 2. We need the embeddings of all movies
    # Since we don't store raw embeddings in memory (to save RAM), 
    # we use the similarity matrix or we can rebuild embeddings for the current session.
    # Actually, for "AI Search", we SHOULD store embeddings. 
    # But for now, we'll use a trick: 
    # If the search query matches a movie title exactly, we use that movie's similarity.
    # BETTER: We'll calculate the similarity against all 'tags' in real-time (it's fast for 7k).
    
    data = movies if region == "All" else movies[movies['region'] == region]
    texts = data['tags'].tolist()
    
    with torch.no_grad():
        doc_embeddings = ai_model.encode(texts, convert_to_tensor=True)
        scores = util.cos_sim(query_embedding, doc_embeddings)[0]
    
    # Get top N
    top_results = torch.topk(scores, k=min(n, len(data)))
    indices = top_results.indices.tolist()
    
    results = data.iloc[indices].drop(columns=['tags']).to_dict(orient='records')
    # Add match score
    for i, res in enumerate(results):
        res['match_score'] = float(top_results.values[i])
        res['dna'] = ["AI Conceptual Match"]
        
    return results

@app.get("/recommend")
async def recommend(title: str, n: int = 15):
    try:
        idx = movies[movies['title'] == title].index[0]
    except IndexError:
        # Case insensitive fallback
        try:
            idx = movies[movies['title'].str.lower() == title.lower()].index[0]
        except:
            raise HTTPException(status_code=404, detail="Movie not found")
            
    base_movie = movies.iloc[idx]
    distances = similarity[idx]
    movies_list = sorted(list(enumerate(distances)), reverse=True, key=lambda x: x[1])[1:n+1]
    
    recommendations = []
    for i in movies_list:
        rec_movie = movies.iloc[i[0]].drop(columns=['tags']).to_dict()
        rec_movie['dna'] = get_common_dna(base_movie, movies.iloc[i[0]])
        recommendations.append(rec_movie)
    
    return recommendations

# Admin Endpoints
@app.get("/admin/stats")
async def get_admin_stats():
    db = SessionLocal()
    total_movies = db.query(Movie).count()
    hollywood_count = db.query(Movie).filter(Movie.region == "Hollywood").count()
    bollywood_count = db.query(Movie).filter(Movie.region == "Bollywood").count()
    last_sync = db.query(SyncHistory).order_by(SyncHistory.timestamp.desc()).first()
    db.close()
    
    return {
        "total_movies": total_movies,
        "region_stats": {
            "Hollywood": hollywood_count,
            "Bollywood": bollywood_count
        },
        "last_sync": {
            "timestamp": last_sync.timestamp if last_sync else None,
            "status": last_sync.status if last_sync else "Never",
            "movies_added": last_sync.movies_added if last_sync else 0
        }
    }

@app.post("/admin/sync")
async def trigger_manual_sync():
    scheduled_sync()
    return {"message": "Sync triggered successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
