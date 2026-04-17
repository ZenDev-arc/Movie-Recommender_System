import json
import datetime
from database import SessionLocal, Movie, SyncHistory
from scrapers.hollywood import scrape_hollywood_new_releases, enrich_movie_details
from scrapers.bollywood import scrape_bollywood_new_releases, enrich_bollywood_movie
from recommender import rebuild_similarity_matrix

class SyncManager:
    def __init__(self):
        self.db = SessionLocal()

    def run_sync(self):
        print(f"Starting scheduled sync: {datetime.datetime.now()}")
        log_entries = []
        movies_added_count = 0
        
        try:
            # 1. Hollywood Sync
            hollywood_titles = scrape_hollywood_new_releases()
            for item in hollywood_titles:
                # Check exist
                exists = self.db.query(Movie).filter(Movie.title == item['title']).first()
                if not exists:
                    details = enrich_movie_details(item['imdb_link'])
                    if details:
                        new_movie = Movie(
                            movie_id=int(datetime.datetime.now().timestamp() * 1000) % 10000000,
                            title=details['title'],
                            overview_text=details['overview'],
                            genres=json.dumps(details['genres']),
                            keywords=json.dumps([]),
                            cast=json.dumps(details['cast']),
                            director=json.dumps(details['director']),
                            vote_average=details['vote_average'],
                            popularity=20.0, # Default for new
                            runtime=120.0,
                            tagline="",
                            release_date=details['release_date'],
                            vote_count=details['vote_count'],
                            region='Hollywood'
                        )
                        self.db.add(new_movie)
                        movies_added_count += 1
                        log_entries.append(f"Added Hollywood: {details['title']}")
            
            # 2. Bollywood Sync
            bollywood_titles = scrape_bollywood_new_releases()
            for item in bollywood_titles:
                exists = self.db.query(Movie).filter(Movie.title == item['title']).first()
                if not exists:
                    # Basic enrichment
                    new_movie = Movie(
                        movie_id=int(datetime.datetime.now().timestamp() * 1000) % 10000000 + 1000000,
                        title=item['title'],
                        overview_text="New Bollywood Release",
                        genres=json.dumps(["Drama"]),
                        keywords=json.dumps([]),
                        cast=json.dumps([]),
                        director=json.dumps([]),
                        vote_average=7.1,
                        popularity=15.0,
                        runtime=140.0,
                        tagline="",
                        release_date=datetime.date.today().strftime("%Y-%m-%d"),
                        vote_count=100,
                        region='Bollywood'
                    )
                    self.db.add(new_movie)
                    movies_added_count += 1
                    log_entries.append(f"Added Bollywood: {item['title']}")

            self.db.commit()

            # 3. Retrain if new movies added
            if movies_added_count > 0:
                rebuild_similarity_matrix()
                status = "SUCCESS"
            else:
                status = "IDLE (No new movies)"
            
            # 4. Record history
            history = SyncHistory(
                movies_added=movies_added_count,
                status=status,
                log="\n".join(log_entries)
            )
            self.db.add(history)
            self.db.commit()
            print(f"Sync finished. {movies_added_count} movies added.")
            
        except Exception as e:
            self.db.rollback()
            print(f"Sync failed: {e}")
            history = SyncHistory(
                movies_added=0,
                status="FAILED",
                log=f"Error: {str(e)}"
            )
            self.db.add(history)
            self.db.commit()
        finally:
            self.db.close()

def manual_sync_trigger():
    manager = SyncManager()
    manager.run_sync()

if __name__ == "__main__":
    manual_sync_trigger()
