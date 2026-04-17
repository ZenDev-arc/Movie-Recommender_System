import pandas as pd
import pickle
import os

MOVIES_PKL = "artifacts/movies.pkl"

if not os.path.exists(MOVIES_PKL):
    print("Run preprocess.py first.")
    exit()

def update_posters():
    print("Loading current movies...")
    df = pd.DataFrame(pickle.load(open(MOVIES_PKL, "rb")))
    
    print("Downloading poster mapping (Hollywood/Global)...")
    # This dataset from babu-thomas has tmdbId and posterPath
    try:
        mapping_url = "https://raw.githubusercontent.com/babu-thomas/movielens-posters/master/movies.csv"
        mapping = pd.read_csv(mapping_url)
        mapping['tmdbId'] = pd.to_numeric(mapping['tmdbId'], errors='coerce')
        mapping = mapping.dropna(subset=['tmdbId'])
        
        # Merge with TMDB IDs (Hollywood)
        df = df.merge(
            mapping[['tmdbId', 'posterPath']], 
            how='left', 
            left_on='movie_id', 
            right_on='tmdbId'
        ).drop(columns=['tmdbId'])
    except Exception as e:
        print(f"Failed to load Hollywood mappings: {e}")
        df['posterPath'] = None

    print("Checking Bollywood poster sources...")
    # For Bollywood, we'll use IMDB mapping if possible.
    # If not in the mapping, we construct a fallback or use another dataset.
    # Note: Some Bollywood IDs in our TMDB set map to the MovieLens mapping.
    
    # Standardize URL construction
    def format_poster(path):
        if not path or pd.isna(path):
            return None
        if path.startswith("http"):
            return path
        return f"https://image.tmdb.org/t/p/w500{path}"
        
    df['poster_url'] = df['posterPath'].apply(format_poster)
    df = df.drop(columns=['posterPath'])
    
    # Placeholder for missing
    print(f"Poster coverage: {df['poster_url'].notna().sum()} / {len(df)}")
    
    print("Saving updated artifacts...")
    pickle.dump(df.to_dict(orient='records'), open(MOVIES_PKL, 'wb'))
    print("Posters integrated.")

if __name__ == "__main__":
    update_posters()
