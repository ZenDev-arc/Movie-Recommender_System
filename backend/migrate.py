import pandas as pd
import ast
import json
from database import SessionLocal, Movie, init_db

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

def migrate():
    print("Initializing Database...")
    init_db()
    db = SessionLocal()

    # Load TMDB
    print("Migrating Hollywood (TMDB)...")
    try:
        movies_df = pd.read_csv('tmdb_5000_movies.csv')
        credits_df = pd.read_csv('tmdb_5000_credits.csv')
        movies_df = movies_df.merge(credits_df, on='title')
        
        # Deduplicate
        movies_df = movies_df.drop_duplicates(subset='movie_id')
        
        for _, row in movies_df.iterrows():
            genres = convert_json_list(row['genres'])
            keywords = convert_json_list(row['keywords'])
            cast = convert_cast_json(row['cast'])
            director = fetch_director_json(row['crew'])
            
            movie = Movie(
                movie_id=int(row['movie_id']),
                title=row['title'],
                overview_text=row['overview'] if pd.notna(row['overview']) else "",
                genres=json.dumps(genres),
                keywords=json.dumps(keywords),
                cast=json.dumps(cast),
                director=json.dumps(director),
                vote_average=float(row['vote_average']),
                popularity=float(row['popularity']),
                runtime=float(row['runtime']) if pd.notna(row['runtime']) else 0.0,
                tagline=row['tagline'] if pd.notna(row['tagline']) else "",
                release_date=str(row['release_date']),
                vote_count=int(row['vote_count']),
                region='Hollywood'
            )
            db.add(movie)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error migrating Hollywood: {e}")

    # Load Bollywood
    print("Migrating Bollywood...")
    try:
        bolly_df = pd.read_csv('bollywood_movies.csv')
        for idx, row in bolly_df.iterrows():
            genres = [i.strip() for i in row['genre'].split(',')] if pd.notna(row['genre']) else []
            cast = [i.strip() for i in row['cast'].split(',')][:3] if pd.notna(row['cast']) else []
            director = [row['director']] if pd.notna(row['director']) else []
            
            # Robust year parsing
            year_str = str(row['year']) if pd.notna(row['year']) else ""
            year = "".join(filter(str.isdigit, year_str))
            if not year: year = "2023" # Default
            
            movie = Movie(
                movie_id=1000000 + idx, # Synthetic ID for Bollywood
                title=row['movie_name'],
                overview_text=row['overview'] if pd.notna(row['overview']) else "",
                genres=json.dumps(genres),
                keywords=json.dumps([]),
                cast=json.dumps(cast),
                director=json.dumps(director),
                vote_average=7.1,
                popularity=15.0,
                runtime=140.0,
                tagline="",
                release_date=f"{year}-01-01",
                vote_count=150,
                region='Bollywood'
            )
            db.add(movie)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error migrating Bollywood: {e}")

    print("Migration Complete!")
    db.close()

if __name__ == "__main__":
    migrate()
