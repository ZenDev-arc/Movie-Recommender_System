import pandas as pd
import pickle
import os
import json
from database import SessionLocal, Movie

def rebuild_similarity_matrix():
    """Fetch all movies from DB, compute similarity, and save artifacts."""
    from sentence_transformers import SentenceTransformer, util
    import torch
    
    db = SessionLocal()
    movies_objs = db.query(Movie).all()
    db.close()

    if not movies_objs:
        print("No movies found in database to rebuild similarity.")
        return

    print(f"Rebuilding similarity for {len(movies_objs)} movies...")
    
    # Convert DB objects to DataFrame
    data = []
    for m in movies_objs:
        data.append({
            "movie_id": m.movie_id,
            "title": m.title,
            "overview_text": m.overview_text,
            "genres": json.loads(m.genres),
            "keywords": json.loads(m.keywords),
            "cast": json.loads(m.cast),
            "director": json.loads(m.director),
            "vote_average": m.vote_average,
            "popularity": m.popularity,
            "runtime": m.runtime,
            "tagline": m.tagline,
            "release_date": m.release_date,
            "vote_count": m.vote_count,
            "region": m.region
        })
    
    df = pd.DataFrame(data)

    # Process tags (same logic as preprocess.py)
    def clean_data(x):
        if isinstance(x, list):
            return [str(i).replace(" ", "").lower() for i in x]
        return ""

    genres_clean = df['genres'].apply(clean_data)
    keywords_clean = df['keywords'].apply(clean_data)
    cast_clean = df['cast'].apply(clean_data)
    director_clean = df['director'].apply(clean_data)
    overview_clean = df['overview_text'].apply(lambda x: x.split() if isinstance(x, str) else [])

    df['tags'] = overview_clean + genres_clean + keywords_clean + cast_clean + director_clean
    df['tags'] = df['tags'].apply(lambda x: " ".join(x).lower())

    # --- AI UPGRADE: SENTENCE TRANSFORMERS ---
    print("Generating AI Semantic Embeddings (SBERT)...")
    model = SentenceTransformer('all-MiniLM-L6-v2')
    
    # Encode tags into dense vectors
    with torch.no_grad():
        embeddings = model.encode(df['tags'].tolist(), convert_to_tensor=True, show_progress_bar=True)
    
    # Calculate Similarity using SBERT utility (Optimized)
    embeddings = embeddings.cpu()  # Move to CPU for similarity calc
    similarity = util.cos_sim(embeddings, embeddings).numpy()

    # --- STORAGE OPTIMIZATION: SAVE TOP 100 ONLY ---
    # Saving a 7k x 7k float32 matrix is ~196MB.
    # Saving top 100 indices/scores for each movie is ~2MB.
    print("Compressing AI Semantic Matrix...")
    compressed_sim = {}
    for i in range(len(df)):
        # Get top 101 (including itself)
        top_indices = similarity[i].argsort()[-101:][::-1]
        compressed_sim[i] = [
            (int(idx), float(similarity[i][idx])) 
            for idx in top_indices if idx != i
        ][:100]

    # Save to artifacts
    if not os.path.exists('artifacts'):
        os.makedirs('artifacts')

    # Save dictionary for backend loading
    save_df = df.copy()
    pickle.dump(save_df.to_dict(), open('artifacts/movies.pkl', 'wb'))
    pickle.dump(compressed_sim, open('artifacts/similarity.pkl', 'wb'))
    
    print(f"AI Matrix Compressed: {os.path.getsize('artifacts/similarity.pkl') / 1024 / 1024:.2f} MB")
    print("AI Semantic Matrix Rebuilt Successfully.")

if __name__ == "__main__":
    rebuild_similarity_matrix()
