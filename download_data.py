import requests
import os

MOVIES_URL = "https://raw.githubusercontent.com/harshitcodes/tmdb_movie_data_analysis/master/tmdb_5000_movies.csv"
CREDITS_URL = "https://raw.githubusercontent.com/harshitcodes/tmdb_movie_data_analysis/master/tmdb_5000_credits.csv"

def download_file(url, filename):
    print(f"Downloading {filename} from {url}...")
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status()
        with open(filename, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        print(f"Successfully downloaded {filename}")
    except Exception as e:
        print(f"Error downloading {filename}: {e}")

if __name__ == "__main__":
    download_file(MOVIES_URL, "tmdb_5000_movies.csv")
    download_file(CREDITS_URL, "tmdb_5000_credits.csv")
