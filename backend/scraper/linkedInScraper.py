from linkedin_scraper import JobSearchScraper, BrowserManager, login_with_credentials
import asyncio
import os
from dotenv import load_dotenv
load_dotenv()


class LinkedInScraper:
    def __init__(self, headless=False, session_file="session.json"):
        self.headless = headless
        self.session_file = session_file
        self.browser = None
        self.scraper = None

    async def __aenter__(self):
        self.browser = BrowserManager(headless=self.headless)
        await self.browser.__aenter__()

        if (os.path.exists(self.session_file)):
            await self.browser.load_session(self.session_file)
        else:
            await self._login_and_save_session()

        self.scraper = JobSearchScraper(self.browser.page)
        return self

    async def __aexit__(self, exc_type, exc, tb):
        if self.browser:
            await self.browser.__aexit__(exc_type, exc, tb)

    async def _login_and_save_session(self):
        await login_with_credentials(self.browser.page, os.getenv("LINKEDIN_EMAIL"), os.getenv("LINKEDIN_PASSWORD"))
        await self.browser.save_session(self.session_file)
        
    async def search_jobs(self, keywords, location, limit = 10):
        return await self.scraper.search(
            keywords=keywords,
            location=location,
            limit=limit
        )
    


async def main():
    async with LinkedInScraper(headless=False) as client:
        jobs = await client.search_jobs("Python Developer", "San Francisco")
        print(jobs)

if __name__ == "__main__":
    asyncio.run(main())
