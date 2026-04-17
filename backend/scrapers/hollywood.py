import requests
from bs4 import BeautifulSoup
import json
import time

def scrape_hollywood_new_releases():
    """Discover new Hollywood releases using IMDb Now Playing."""
    url = "https://www.imdb.com/showtimes/location/" # This might vary, better use a generic one
    # Alternatively, use India specific coming soon if we want Bollywood too, 
    # but let's stick to a global movies source.
    url = "https://www.imdb.com/calendar/?region=IN" # Specific to India but good for both
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
    }

    print(f"Scraping new releases from {url}...")
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        movies = []
        # IMDb Calendar structure: list of movies per date
        for entry in soup.select('ul.ipc-metadata-list li'):
            title_tag = entry.select_one('a.ipc-metadata-list-summary-item__t')
            if title_tag:
                title = title_tag.text.strip()
                link = "https://www.imdb.com" + title_tag['href']
                movies.append({"title": title, "imdb_link": link})
        
        print(f"Found {len(movies)} potential new releases.")
        return movies[:20] # Return top 20 for processing
    except Exception as e:
        print(f"Error scraping Hollywood releases: {e}")
        return []

def enrich_movie_details(imdb_link):
    """Fetch details for a specific movie from its IMDb page."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
    }
    
    try:
        response = requests.get(imdb_link, headers=headers)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # This is a bit complex due to IMDb dynamic nature, 
        # but basic tags are often in JSON-LD
        json_ld = soup.select_one('script[type="application/ld+json"]')
        if json_ld:
            data = json.loads(json_ld.text)
            
            # Map IMDb JSON-LD to our schema
            details = {
                "title": data.get("name"),
                "overview": data.get("description", ""),
                "genres": [g for g in data.get("genre", [])] if isinstance(data.get("genre"), list) else [data.get("genre")] if data.get("genre") else [],
                "director": [d.get("name") for d in data.get("director", []) if d.get("@type") == "Person"] if isinstance(data.get("director"), list) else [],
                "cast": [p.get("name") for p in data.get("actor", []) if p.get("@type") == "Person"][:5],
                "vote_average": float(data.get("aggregateRating", {}).get("ratingValue", 7.0)),
                "vote_count": int(data.get("aggregateRating", {}).get("ratingCount", 100)),
                "release_date": data.get("datePublished", ""),
            }
            return details
        return None
    except Exception as e:
        print(f"Error enriching {imdb_link}: {e}")
        return None

if __name__ == "__main__":
    new_movies = scrape_hollywood_new_releases()
    if new_movies:
        print(f"Enriching first movie: {new_movies[0]['title']}")
        print(enrich_movie_details(new_movies[0]['imdb_link']))
