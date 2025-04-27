import os
import re
import requests
from PyPDF2 import PdfReader

PDF_FILE = "Autism Research Data Links_.pdf"
OUTPUT_DIR = "research/links_downloaded"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def extract_pdf_links(pdf_path):
    reader = PdfReader(pdf_path)
    links = set()
    for page in reader.pages:
        text = page.extract_text() or ""
        # Find all URLs
        urls = re.findall(r'https?://[^\s)>"]+', text)
        # Only keep .pdf links
        pdf_urls = [url for url in urls if url.lower().endswith('.pdf')]
        links.update(pdf_urls)
    return list(links)

def download_pdf(url, output_dir):
    local_filename = os.path.join(output_dir, url.split('/')[-1])
    try:
        with requests.get(url, stream=True, timeout=30) as r:
            r.raise_for_status()
            with open(local_filename, 'wb') as f:
                for chunk in r.iter_content(chunk_size=8192):
                    f.write(chunk)
        print(f"Downloaded: {local_filename}")
    except Exception as e:
        print(f"Failed to download {url}: {e}")

if __name__ == "__main__":
    links = extract_pdf_links(PDF_FILE)
    print(f"Found {len(links)} PDF links.")
    for link in links:
        download_pdf(link, OUTPUT_DIR) 