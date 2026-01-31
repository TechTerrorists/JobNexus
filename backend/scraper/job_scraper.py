from dataclasses import dataclass, field
from typing import List, Optional
import aiohttp
from bs4 import BeautifulSoup
import asyncio
import random
import json
from urllib.parse import quote


@dataclass
class EmployeeData:
    name: str
    title: str
    profile_link: str
    education: Optional[List[str]] = None
    past_experiences: Optional[List[str]] = None
    email: Optional[str] = None
    phone: Optional[str] = None


@dataclass
class JobData:
    title: str
    company: str
    location: str
    job_link: str
    posted_date: str
    description: Optional[str] = None
    employees: List[EmployeeData] = field(default_factory=list)


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
        self.session = await self._setup_session()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def _setup_session(self) -> aiohttp.ClientSession:
        timeout = aiohttp.ClientTimeout(total=30)
        connector = aiohttp.TCPConnector(limit=10)
        return aiohttp.ClientSession(
            timeout=timeout,
            connector=connector,
            headers=ScraperConfig.HEADERS
        )

    def _build_search_url(self, keywords: str, location: str, start: int = 0) -> str:
        params = {"keywords": keywords, "location": location, "start": start}
        return f"{ScraperConfig.BASE_URL}?{'&'.join(f'{k}={quote(str(v))}' for k, v in params.items())}"

    def _clean_job_url(self, url: str) -> str:
        return url.split("?")[0] if "?" in url else url

    async def _fetch_page(self, url: str) -> Optional[BeautifulSoup]:
        try:
            async with self.session.get(url, allow_redirects=True) as response:
                if "authwall" in str(response.url):
                    print(f"LinkedIn requires login for {url}. Aborting fetch.")
                    return None
                if response.status != 200:
                    print(f"Failed to fetch page: Status {response.status} for URL: {url}")
                    return None
                text = await response.text()
                return BeautifulSoup(text, "html.parser")
        except aiohttp.ClientError as e:
            print(f"Request failed for {url}: {str(e)}")
            return None

    async def _fetch_job_description(self, job_url: str) -> str:
        soup = await self._fetch_page(job_url)
        if not soup:
            return "N/A"
        
        selectors = [
            "div.show-more-less-html__markup",
            "div.description__text",
            "div[class*='description']",
            "article",
        ]
        for selector in selectors:
            desc_div = soup.select_one(selector)
            if desc_div:
                return desc_div.get_text(separator="\n", strip=True)
        return "N/A"

    def _extract_job_data(self, job_card: BeautifulSoup) -> Optional[JobData]:
        try:
            title = job_card.find("h3", class_="base-search-card__title").text.strip()
            company = job_card.find("h4", class_="base-search-card__subtitle").text.strip()
            location = job_card.find("span", class_="job-search-card__location").text.strip()
            job_link = self._clean_job_url(job_card.find("a", class_="base-card__full-link")["href"])
            posted_date_tag = job_card.find("time", class_="job-search-card__listdate")
            posted_date = posted_date_tag.text.strip() if posted_date_tag else "N/A"

            return JobData(title=title, company=company, location=location, job_link=job_link, posted_date=posted_date)
        except Exception as e:
            print(f"Failed to extract job data: {str(e)}")
            return None

    async def _scrape_employees_for_company(self, company_name: str, max_employees: int = 5) -> List[EmployeeData]:
        print(f"Attempting to scrape employees for '{company_name}'.")
        search_url = f"https://www.linkedin.com/search/results/people/?keywords={quote(company_name)}"
        
        soup = await self._fetch_page(search_url)
        if not soup:
            print(f"Could not load search results for employees at '{company_name}'. Login is likely required.")
            return []

        employees = []
        # Selector for people search results. Highly likely to change and requires login for accuracy.
        employee_cards = soup.find_all("li", class_="reusable-search__result-container")
        
        if not employee_cards:
            print("Could not find any employee results. Page structure may have changed or login is required.")
            return []

        for card in employee_cards[:max_employees]:
            try:
                name_tag = card.find("span", {"aria-hidden": "true"})
                name = name_tag.text.strip() if name_tag else "N/A"

                title_tag = card.find("div", class_="entity-result__primary-subtitle")
                title = title_tag.text.strip() if title_tag else "N/A"
                
                profile_link_tag = card.find("a", class_="app-aware-link")
                profile_link = profile_link_tag['href'] if profile_link_tag else "N/A"

                if name != "N/A":
                    employees.append(EmployeeData(name=name, title=title, profile_link=profile_link))
            except Exception as e:
                print(f"Error parsing employee card: {e}")
        
        print(f"Found {len(employees)} potential employee(s) for {company_name}.")
        return employees

    async def scrape_jobs(
        self, keywords: str, location: str, max_jobs: int = 100, fetch_descriptions: bool = True, fetch_employees: bool = False
    ) -> List[JobData]:
        all_jobs = []
        start = 0

        while len(all_jobs) < max_jobs:
            url = self._build_search_url(keywords, location, start)
            soup = await self._fetch_page(url)
            if not soup:
                break
            
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
            await asyncio.sleep(random.uniform(ScraperConfig.MIN_DELAY, ScraperConfig.MAX_DELAY))
        
        jobs_to_process = all_jobs[:max_jobs]

        if fetch_descriptions:
            print(f"\nFetching descriptions for {len(jobs_to_process)} jobs...")
            for i, job in enumerate(jobs_to_process, 1):
                print(f"Fetching description {i}/{len(jobs_to_process)}: {job.title}")
                job.description = await self._fetch_job_description(job.job_link)
                await asyncio.sleep(random.uniform(ScraperConfig.MIN_DELAY, ScraperConfig.MAX_DELAY))
        
        if fetch_employees:
            print(f"\nFetching employees for unique companies...")
            unique_companies = list({job.company for job in jobs_to_process})
            company_employee_map = {}
            for i, company_name in enumerate(unique_companies, 1):
                print(f"Scraping employees for company {i}/{len(unique_companies)}: {company_name}")
                employees = await self._scrape_employees_for_company(company_name)
                company_employee_map[company_name] = employees
                await asyncio.sleep(random.uniform(ScraperConfig.MIN_DELAY, ScraperConfig.MAX_DELAY))

            for job in jobs_to_process:
                job.employees = company_employee_map.get(job.company, [])
                
        return jobs_to_process

    async def save_results(self, jobs: List[JobData], filename: str = "linkedin_jobs.json") -> None:
        if not jobs:
            print("No jobs to save.")
            return
            
        with open(filename, "w", encoding="utf-8") as f:
            # Convert dataclasses to dicts for JSON serialization
            json_output = [vars(job) for job in jobs]
            for job_dict in json_output:
                job_dict['employees'] = [vars(emp) for emp in job_dict['employees']]
            
            json.dump(json_output, f, indent=2, ensure_ascii=False)
        print(f"Saved {len(jobs)} jobs to {filename}")


async def main():
    params = {
        "keywords": "AI/ML Engineer", 
        "location": "London", 
        "max_jobs": 5,
        "fetch_descriptions": True,
        "fetch_employees": True
    }

    async with LinkedInJobsScraper() as scraper:  
        jobs = await scraper.scrape_jobs(**params)  
        if jobs:
            await scraper.save_results(jobs)
            
            print("\n" + "="*80)
            print("SAMPLE JOB WITH EMPLOYEES:")
            print("="*80)
            sample_job = jobs[0]
            print(f"Title: {sample_job.title}")
            print(f"Company: {sample_job.company}")
            print(f"Location: {sample_job.location}")
            print(f"Posted: {sample_job.posted_date}")
            print(f"Link: {sample_job.job_link}")
            print(f"\nDescription Preview: {sample_job.description[:200] if sample_job.description != 'N/A' else 'N/A'}...")
            
            if sample_job.employees:
                print(f"\nFound {len(sample_job.employees)} employees at {sample_job.company}:")
                for emp in sample_job.employees:
                    print(f"  - Name: {emp.name}, Title: {emp.title}")
            else:
                 print(f"\nCould not find employees for {sample_job.company}. This is expected without a logged-in session.")


if __name__ == "__main__":
    asyncio.run(main())


