import requests
from bs4 import BeautifulSoup
import json

def fetch_web_page(url: str):
    """
    Fetch a web page and return its text content and links.
    """
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, 'html.parser')

        # Remove script and style elements
        for script_or_style in soup(["script", "style"]):
            script_or_style.decompose()

        # Get text
        text = soup.get_text(separator='\n')
        # Break into lines and remove leading and trailing whitespace on each
        lines = (line.strip() for line in text.splitlines())
        # Break multi-headlines into a line each
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        # Drop blank lines
        text = '\n'.join(chunk for chunk in chunks if chunk)

        # Limit text size to avoid blowing up the LLM context
        text = text[:8000]

        # Get links
        links = []
        for a in soup.find_all('a', href=True):
            if a['href'].startswith('http'):
                links.append({"text": a.get_text().strip(), "url": a['href']})

        return json.dumps({
            "url": url,
            "content": text,
            "links": links[:20] # Limit links
        }, indent=2)

    except Exception as e:
        return f"Error fetching {url}: {str(e)}"

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        print(fetch_web_page(sys.argv[1]))
    else:
        print(fetch_web_page("https://www.google.com"))
