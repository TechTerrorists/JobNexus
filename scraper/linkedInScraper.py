from linkedin_scraper import JobSearchScraper, BrowserManager, login_with_credentials
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()


async def create_session(browser):
    await login_with_credentials(browser.page, os.getenv("LINKEDIN_EMAIL"), os.getenv("LINKEDIN_PASSWORD"))
    await browser.save_session("session.json")


async def main():
    async with BrowserManager(headless=False) as browser:
        
        await create_session(browser)
        await browser.load_session("session.json")

        scraper = JobSearchScraper(browser.page)
        jobs = await scraper.search(
            keywords = "Python Developer",
            location = "San Francisco",
            limit = 10
        )

        print(type(jobs))
        print(type(jobs[0]))
        print(jobs)

asyncio.run(main())
