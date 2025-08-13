#!/usr/bin/env python3
"""
SEO Analyzer - Extrahiert Meta-Tags, Keywords und SEO-Daten von Websites
Für Digital Consultants zur Website-Analyse
"""

import requests
from bs4 import BeautifulSoup
import json
import csv
from urllib.parse import urljoin, urlparse
import time
import re

class SEOAnalyzer:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        })
    
    def analyze_website(self, url):
        """Analysiert eine Website auf SEO-Faktoren"""
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            
            seo_data = {
                'url': url,
                'title': self._get_title(soup),
                'meta_description': self._get_meta_description(soup),
                'meta_keywords': self._get_meta_keywords(soup),
                'h1_tags': self._get_h1_tags(soup),
                'h2_tags': self._get_h2_tags(soup),
                'img_without_alt': self._count_images_without_alt(soup),
                'internal_links': self._count_internal_links(soup, url),
                'external_links': self._count_external_links(soup, url),
                'page_size': len(response.content),
                'load_time': response.elapsed.total_seconds(),
                'status_code': response.status_code,
                'canonical_url': self._get_canonical_url(soup),
                'og_tags': self._get_og_tags(soup),
                'schema_markup': self._check_schema_markup(soup)
            }
            
            return seo_data
            
        except Exception as e:
            return {'url': url, 'error': str(e)}
    
    def _get_title(self, soup):
        title = soup.find('title')
        return title.text.strip() if title else "Kein Title gefunden"
    
    def _get_meta_description(self, soup):
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        return meta_desc.get('content', '').strip() if meta_desc else "Keine Meta Description"
    
    def _get_meta_keywords(self, soup):
        meta_keywords = soup.find('meta', attrs={'name': 'keywords'})
        return meta_keywords.get('content', '').strip() if meta_keywords else "Keine Meta Keywords"
    
    def _get_h1_tags(self, soup):
        h1_tags = soup.find_all('h1')
        return [h1.text.strip() for h1 in h1_tags]
    
    def _get_h2_tags(self, soup):
        h2_tags = soup.find_all('h2')
        return [h2.text.strip() for h2 in h2_tags[:5]]  # Nur erste 5
    
    def _count_images_without_alt(self, soup):
        images = soup.find_all('img')
        return len([img for img in images if not img.get('alt')])
    
    def _count_internal_links(self, soup, base_url):
        domain = urlparse(base_url).netloc
        links = soup.find_all('a', href=True)
        internal = 0
        for link in links:
            href = link['href']
            if href.startswith('/') or domain in href:
                internal += 1
        return internal
    
    def _count_external_links(self, soup, base_url):
        domain = urlparse(base_url).netloc
        links = soup.find_all('a', href=True)
        external = 0
        for link in links:
            href = link['href']
            if href.startswith('http') and domain not in href:
                external += 1
        return external
    
    def _get_canonical_url(self, soup):
        canonical = soup.find('link', attrs={'rel': 'canonical'})
        return canonical.get('href', '') if canonical else "Keine Canonical URL"
    
    def _get_og_tags(self, soup):
        og_tags = {}
        for tag in soup.find_all('meta', property=re.compile(r'^og:')):
            og_tags[tag.get('property')] = tag.get('content', '')
        return og_tags
    
    def _check_schema_markup(self, soup):
        schema_scripts = soup.find_all('script', type='application/ld+json')
        return len(schema_scripts) > 0
    
    def analyze_multiple_sites(self, urls):
        """Analysiert mehrere Websites"""
        results = []
        for url in urls:
            print(f"Analysiere: {url}")
            result = self.analyze_website(url)
            results.append(result)
            time.sleep(1)  # Höfliche Pause zwischen Requests
        return results
    
    def save_to_csv(self, results, filename='seo_analysis.csv'):
        """Speichert Ergebnisse als CSV"""
        if not results:
            return
        
        fieldnames = ['url', 'title', 'meta_description', 'meta_keywords', 
                     'h1_count', 'h2_count', 'img_without_alt', 'internal_links', 
                     'external_links', 'page_size', 'load_time', 'status_code', 
                     'canonical_url', 'has_schema_markup']
        
        with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            
            for result in results:
                if 'error' not in result:
                    row = {
                        'url': result['url'],
                        'title': result['title'][:100],  # Kürzen für CSV
                        'meta_description': result['meta_description'][:200],
                        'meta_keywords': result['meta_keywords'][:100],
                        'h1_count': len(result['h1_tags']),
                        'h2_count': len(result['h2_tags']),
                        'img_without_alt': result['img_without_alt'],
                        'internal_links': result['internal_links'],
                        'external_links': result['external_links'],
                        'page_size': result['page_size'],
                        'load_time': result['load_time'],
                        'status_code': result['status_code'],
                        'canonical_url': result['canonical_url'],
                        'has_schema_markup': result['schema_markup']
                    }
                    writer.writerow(row)

# Beispiel-Nutzung
if __name__ == "__main__":
    analyzer = SEOAnalyzer()
    
    # Test-Websites - Sie können diese anpassen
    websites = [
        "https://netnode.ch",
        "https://google.com",
        "https://apple.com"
    ]
    
    print("SEO Analyzer gestartet...")
    results = analyzer.analyze_multiple_sites(websites)
    
    # Ergebnisse ausgeben
    for result in results:
        if 'error' not in result:
            print(f"\n=== {result['url']} ===")
            print(f"Title: {result['title']}")
            print(f"Meta Description: {result['meta_description'][:100]}...")
            print(f"H1 Tags: {len(result['h1_tags'])}")
            print(f"H2 Tags: {len(result['h2_tags'])}")
            print(f"Bilder ohne Alt-Text: {result['img_without_alt']}")
            print(f"Interne Links: {result['internal_links']}")
            print(f"Externe Links: {result['external_links']}")
            print(f"Ladezeit: {result['load_time']:.2f}s")
            print(f"Seitengröße: {result['page_size']:,} Bytes")
            print(f"Schema Markup: {'Ja' if result['schema_markup'] else 'Nein'}")
        else:
            print(f"Fehler bei {result['url']}: {result['error']}")
    
    # Als CSV speichern
    analyzer.save_to_csv(results)
    print(f"\nErgebnisse in 'seo_analysis.csv' gespeichert")
