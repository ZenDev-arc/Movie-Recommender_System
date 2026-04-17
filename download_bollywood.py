import requests
import os

def download_bollywood():
    url = "https://raw.githubusercontent.com/devensinghbhagtani/Bollywood-Movie-Dataset/main/IMDB-Movie-Dataset(2023-1951).csv"
    save_path = "bollywood_movies.csv"
    
    print(f"Downloading Bollywood dataset from: {url}")
    try:
        response = requests.get(url)
        response.raise_for_status()
        with open(save_path, 'wb') as f:
            f.write(response.content)
        print(f"Successfully downloaded to {save_path}")
    except Exception as e:
        print(f"Failed to download Bollywood dataset: {e}")

if __name__ == "__main__":
    download_bollywood()
