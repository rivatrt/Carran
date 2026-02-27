from duckduckgo_search import DDGS
import json

def search(query: str, max_results: int = 5):
    """
    Search the web using DuckDuckGo.
    """
    try:
        with DDGS() as ddgs:
            results = [r for r in ddgs.text(query, max_results=max_results)]
            return json.dumps(results, indent=2)
    except Exception as e:
        return f"Error performing search: {str(e)}"

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        print(search(" ".join(sys.argv[1:])))
    else:
        print(search("Flipkart shirts under 300 rs"))
