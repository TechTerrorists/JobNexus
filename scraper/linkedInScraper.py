from linkedin_scraper import JobSearchScraper, BrowserManager, wait_for_manual_login
import asyncio


async def create_session(browser):

    await browser.page.goto("https://www.linkedin.com/login")

    print("Login kro")
    await wait_for_manual_login(browser.page, timeout=300000)

    await browser.save_session("session.json")
    print("Login done")



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
