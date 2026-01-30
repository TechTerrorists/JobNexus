from dataclasses import dataclass
from typing import List, Optional
import aiohttp
from bs4 import BeautifulSoup
import asyncio
import random
import json
from urllib.parse import quote


@dataclass
class JobData:
    title: str
    company: str
    location: str
    job_link: str
    posted_date: str
    description: Optional[str] = None


class ScraperConfig:
    BASE_URL = "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search"
    JOBS_PER_PAGE = 25
    MIN_DELAY = 2
    MAX_DELAY = 5
    RATE_LIMIT_DELAY = 30
    RATE_LIMIT_THRESHOLD = 10

    HEADERS = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "DNT": "1",
        "Cache-Control": "no-cache",
    }


class LinkedInJobsScraper:
    def __init__(self):
        self.session = None

    async def __aenter__(self):
        """Async context manager entry"""
        self.session = await self._setup_session()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()

    async def _setup_session(self) -> aiohttp.ClientSession:
        """Setup aiohttp session with timeout and retry configuration"""
        timeout = aiohttp.ClientTimeout(total=30)
        connector = aiohttp.TCPConnector(limit=10)
        return aiohttp.ClientSession(
            timeout=timeout,
            connector=connector,
            headers=ScraperConfig.HEADERS
        )

    def _build_search_url(self, keywords: str, location: str, start: int = 0) -> str:
        """Build search URL - synchronous, no await needed"""
        params = {
            "keywords": keywords,
            "location": location,
            "start": start,
        }
        return f"{ScraperConfig.BASE_URL}?{'&'.join(f'{k}={quote(str(v))}' for k, v in params.items())}"

    def _clean_job_url(self, url: str) -> str:
        """Clean job URL - synchronous, no await needed"""
        return url.split("?")[0] if "?" in url else url
    
    async def _fetch_job_description(self, job_url: str) -> str:
        """Fetch the full job description from the individual job page"""
        try:
            async with self.session.get(job_url) as response:
                if response.status != 200:
                    print(f"Failed to fetch job description: Status {response.status}")
                    return "N/A"
                
                text = await response.text()
                soup = BeautifulSoup(text, "html.parser")
                
                # Try multiple selectors to find the job description
                description = None
                
                # Method 1: Look for show-more-less-html__markup
                desc_div = soup.find("div", class_="show-more-less-html__markup")
                if desc_div:
                    description = desc_div.get_text(separator="\n", strip=True)
                
                # Method 2: Look for description__text
                if not description:
                    desc_div = soup.find("div", class_="description__text")
                    if desc_div:
                        description = desc_div.get_text(separator="\n", strip=True)
                
                # Method 3: Look for any div with 'description' in class name
                if not description:
                    desc_div = soup.find("div", class_=lambda x: x and "description" in x.lower())
                    if desc_div:
                        description = desc_div.get_text(separator="\n", strip=True)
                
                # Method 4: Look for article or section tags
                if not description:
                    article = soup.find("article") or soup.find("section", class_=lambda x: x and "description" in x.lower())
                    if article:
                        description = article.get_text(separator="\n", strip=True)
                
                return description if description else "N/A"
                
        except Exception as e:
            print(f"Error fetching description from {job_url}: {str(e)}")
            return "N/A"

    def _extract_job_data(self, job_card: BeautifulSoup) -> Optional[JobData]:
        """Extract job data from HTML - synchronous, no await needed"""
        try:
            title = job_card.find("h3", class_="base-search-card__title").text.strip()
            company = job_card.find(
                "h4", class_="base-search-card__subtitle"
            ).text.strip()
            location = job_card.find(
                "span", class_="job-search-card__location"
            ).text.strip()
            job_link = self._clean_job_url(
                job_card.find("a", class_="base-card__full-link")["href"]
            )
            posted_date = job_card.find("time", class_="job-search-card__listdate")
            posted_date = posted_date.text.strip() if posted_date else "N/A"

            # We'll fetch description separately
            return JobData(
                title=title,
                company=company,
                location=location,
                job_link=job_link,
                posted_date=posted_date,
                description=None  # Will be fetched later
            )
        except Exception as e:
            print(f"Failed to extract job data: {str(e)}")
            return None

    async def _fetch_job_page(self, url: str) -> BeautifulSoup:
        """Fetch job page - async HTTP request"""
        try:
            async with self.session.get(url) as response:
                if response.status != 200:
                    raise RuntimeError(
                        f"Failed to fetch data: Status code {response.status}"
                    )
                text = await response.text()
                return BeautifulSoup(text, "html.parser")
        except aiohttp.ClientError as e:
            raise RuntimeError(f"Request failed: {str(e)}")

    async def scrape_jobs(
        self, keywords: str, location: str, max_jobs: int = 100, fetch_descriptions: bool = True
    ) -> List[JobData]:
        """Scrape jobs - async method"""
        all_jobs = []
        start = 0

        while len(all_jobs) < max_jobs:
            try:
                url = self._build_search_url(keywords, location, start)
                soup = await self._fetch_job_page(url)  # await async call
                job_cards = soup.find_all("div", class_="base-card")

                if not job_cards:
                    print("No more job cards found.")
                    break
                    
                for card in job_cards:
                    job_data = self._extract_job_data(card)
                    if job_data:
                        all_jobs.append(job_data)
                        if len(all_jobs) >= max_jobs:
                            break
                            
                print(f"Scraped {len(all_jobs)} jobs...")
                start += ScraperConfig.JOBS_PER_PAGE
                
                # Use asyncio.sleep instead of time.sleep
                await asyncio.sleep(
                    random.uniform(ScraperConfig.MIN_DELAY, ScraperConfig.MAX_DELAY)
                )
            except Exception as e:
                print(f"Scraping error: {str(e)}")
                break
        
        # Fetch descriptions for all jobs
        if fetch_descriptions and all_jobs:
            print(f"\nFetching descriptions for {len(all_jobs[:max_jobs])} jobs...")
            for i, job in enumerate(all_jobs[:max_jobs], 1):
                print(f"Fetching description {i}/{len(all_jobs[:max_jobs])}: {job.title}")
                job.description = await self._fetch_job_description(job.job_link)
                
                # Add delay between description fetches to avoid rate limiting
                await asyncio.sleep(
                    random.uniform(ScraperConfig.MIN_DELAY, ScraperConfig.MAX_DELAY)
                )
                
        return all_jobs[:max_jobs]

    async def save_results(
        self, jobs: List[JobData], filename: str = "linkedin_jobs.json"
    ) -> None:
        """Save results - async file I/O"""
        if not jobs:
            print("No jobs to save.")
            return
            
        with open(filename, "w", encoding="utf-8") as f:
            json.dump([vars(job) for job in jobs], f, indent=2, ensure_ascii=False)
        print(f"Saved {len(jobs)} jobs to {filename}")


async def main():
    params = {
        "keywords": "AI/ML Engineer", 
        "location": "London", 
        "max_jobs": 10,  # Start with fewer jobs for testing
        "fetch_descriptions": True
    }

    async with LinkedInJobsScraper() as scraper:  
        jobs = await scraper.scrape_jobs(**params)  
        await scraper.save_results(jobs)
        
        # Print sample of results
        if jobs:
            print("\n" + "="*80)
            print("SAMPLE JOB:")
            print("="*80)
            sample_job = jobs[0]
            print(f"Title: {sample_job.title}")
            print(f"Company: {sample_job.company}")
            print(f"Location: {sample_job.location}")
            print(f"Posted: {sample_job.posted_date}")
            print(f"Link: {sample_job.job_link}")
            print(f"\nDescription Preview: {sample_job.description[:500] if sample_job.description != 'N/A' else 'N/A'}...")

if __name__ == "__main__":
    asyncio.run(main())


