import pandas as pd
import ast
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import pickle
import os

def convert_json_list(obj):
    try:
        L = []
        for i in ast.literal_eval(obj):
            L.append(i['name'])
        return L
    except:
        return []

def convert_cast_json(obj):
    try:
        L = []
        counter = 0
        for i in ast.literal_eval(obj):
            if counter != 3:
                L.append(i['name'])
                counter += 1
            else:
                break
        return L
    except:
        return []

def fetch_director_json(obj):
    try:
        for i in ast.literal_eval(obj):
            if i['job'] == 'Director':
                return [i['name']]
        return []
    except:
        return []

def load_tmdb():
    print("Loading TMDB (Hollywood)...")
    movies = pd.read_csv('tmdb_5000_movies.csv')
    credits = pd.read_csv('tmdb_5000_credits.csv')
    movies = movies.merge(credits, on='title')
    
    # Common Column Mapping
    tmdb = pd.DataFrame()
    tmdb['movie_id'] = movies['movie_id']
    tmdb['title'] = movies['title']
    tmdb['overview_text'] = movies['overview'].fillna("")
    tmdb['genres'] = movies['genres'].apply(convert_json_list)
    tmdb['keywords'] = movies['keywords'].apply(convert_json_list)
    tmdb['cast'] = movies['cast'].apply(convert_cast_json)
    tmdb['director'] = movies['crew'].apply(fetch_director_json)
    tmdb['vote_average'] = movies['vote_average']
    tmdb['popularity'] = movies['popularity']
    tmdb['runtime'] = movies['runtime']
    tmdb['tagline'] = movies['tagline'].fillna("")
    tmdb['release_date'] = movies['release_date']
    tmdb['vote_count'] = movies['vote_count']
    tmdb['region'] = 'Hollywood'
    return tmdb

def load_bollywood():
    print("Loading Bollywood...")
    # Header: ,movie_id,movie_name,year,genre,overview,director,cast
    df = pd.read_csv('bollywood_movies.csv')
    
    bolly = pd.DataFrame()
    bolly['movie_id'] = df['movie_id']
    bolly['title'] = df['movie_name']
    bolly['overview_text'] = df['overview'].fillna("")
    # Parse comma-separated strings
    bolly['genres'] = df['genre'].fillna("").apply(lambda x: [i.strip() for i in x.split(',')] if x else [])
    bolly['keywords'] = [[] for _ in range(len(df))] # No keywords in this dataset
    bolly['cast'] = df['cast'].fillna("").apply(lambda x: [i.strip() for i in x.split(',')][:3] if x else [])
    bolly['director'] = df['director'].fillna("").apply(lambda x: [x] if x else [])
    
    # Default values for Bollywood missing metrics
    bolly['vote_average'] = 7.1
    bolly['popularity'] = 15.0
    bolly['runtime'] = 140.0 # Standard Bollywood length
    bolly['tagline'] = ""
    bolly['release_date'] = df['year'].astype(str) + "-01-01"
    bolly['vote_count'] = 150
    bolly['region'] = 'Bollywood'
    return bolly

def preprocess():
    tmdb = load_tmdb()
    bolly = load_bollywood()
    
    print("Merging datasets...")
    movies = pd.concat([tmdb, bolly], ignore_index=True)
    movies.dropna(subset=['title'], inplace=True)

    print("Cleaning for tags...")
    # Primary Genre for UI
    movies['primary_genre'] = movies['genres'].apply(lambda x: x[0] if len(x) > 0 else "Drama")
    
    # Processed versions for tags (remove spaces)
    def clean_data(x):
        if isinstance(x, list):
            return [str(i).replace(" ", "").lower() for i in x]
        return ""

    genres_clean = movies['genres'].apply(clean_data)
    keywords_clean = movies['keywords'].apply(clean_data)
    cast_clean = movies['cast'].apply(clean_data)
    director_clean = movies['director'].apply(clean_data)
    overview_clean = movies['overview_text'].apply(lambda x: x.split())

    # Create tags
    movies['tags'] = overview_clean + genres_clean + keywords_clean + cast_clean + director_clean
    movies['tags'] = movies['tags'].apply(lambda x: " ".join(x).lower())

    print(f"Total movies processed: {len(movies)}")
    
    print("Vectorizing tags...")
    tfidf = TfidfVectorizer(max_features=5000, stop_words='english')
    vector = tfidf.fit_transform(movies['tags']).toarray()

    print("Computing similarity matrix...")
    similarity = cosine_similarity(vector)

    print("Saving artifacts...")
    if not os.path.exists('artifacts'):
        os.makedirs('artifacts')
    
    # Drop tags from final pickle to save space, but keep all metadata
    final_df = movies.drop(columns=['tags'])
    # Re-adding the tags for text search if needed, but similarity is precomputed
    # Actually, keep tags for mood searching in backend
    final_df['tags'] = movies['tags']
    
    pickle.dump(final_df.to_dict(), open('artifacts/movies.pkl', 'wb'))
    pickle.dump(similarity, open('artifacts/similarity.pkl', 'wb'))
    print("Done! Artifacts saved.")

if __name__ == "__main__":
    preprocess()
