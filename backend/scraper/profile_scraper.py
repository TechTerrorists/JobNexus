from typing import Optional, List, Dict, Any
from pathlib import Path
from dataclasses import dataclass
from enum import Enum
import pandas as pd
from staffspy import LinkedInAccount, SolverType, DriverType, BrowserType
import asyncio

class LinkedInScraperConfig:
    def __init__(
        self,
        session_file: str = "session.pkl",
        log_level: int = 1,
        driver_type: Optional[DriverType] = None,
        browser_type: Optional[BrowserType] = None,
        executable_path: Optional[str] = None
    ):
        self.session_file = session_file
        self.log_level = log_level
        self.driver_type = driver_type
        self.browser_type = browser_type
        self.executable_path = executable_path


    def getDriverConfig(self) -> Optional[DriverType]:
        if self.executable_path and self.browser_type:
            return DriverType(
                browser_type=self.browser_type,
                executable_path=self.executable_path
            )
        return self.driver_type

    

@dataclass
class StaffSearchParams:
    company_name: str
    search_term: Optional[str] = None
    location: Optional[str] = None
    extra_profile_data: bool = False
    max_results: int = 50
    block: bool = False
    connect: bool = False

    def __post_init__(self):
        if self.max_results > 1000:
            raise ValueError("max lim")
        
        if self.max_results < 1:
            raise ValueError("1 se kam kaise aayega?")


class LinkedInAccountScraper:
    def __init__(self, config: LinkedInScraperConfig) -> None:
        self.config = config
        self.account : Optional[LinkedInAccount] = None
        self.isInitialized = False

    def init_account(self) -> LinkedInAccount:
        driverConf = self.config.getDriverConfig()

        args = {
            "session_file" : self.config.session_file,
            "log_level" : self.config.log_level
        }

        if driverConf:
            args["driver_type"] = driverConf

        self.account = LinkedInAccount(**args)
        self.isInitialized = True
        return self.account
    
    def ensure_initialized(self) -> None:
        if not self.isInitialized or self.account is None:
            self.init_account()



    def scrape_staff(
        self, 
        params: StaffSearchParams
    ) -> pd.DataFrame:
        self.ensure_initialized()
        
        staff_df = self.account.scrape_staff(
            company_name=params.company_name,
            search_term=params.search_term,
            location=params.location,
            extra_profile_data=params.extra_profile_data,
            max_results=params.max_results,
            block=params.block,
            connect=params.connect
        )
        
        return staff_df
    
    def scrape_staff_to_dict(
        self, 
        params: StaffSearchParams
    ) -> List[Dict[str, Any]]:
 
        df = self.scrape_staff(params)
        return df.to_dict('records') if not df.empty else []
    
    def close(self):

        if self.account:

            self._is_initialized = False
            self.account = None


class LinkedInScraperService:

    
    _instance: Optional['LinkedInScraperService'] = None
    _scraper: Optional[LinkedInAccountScraper] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def initialize(self, config: LinkedInScraperConfig):

        if self._scraper is None:
            self._scraper = LinkedInAccountScraper(config)
            self._scraper.init_account()
    
    def get_scraper(self) -> LinkedInAccountScraper:

        if self._scraper is None:
            raise RuntimeError("Scraper not initialized. Call initialize() first.")
        return self._scraper
    
    def shutdown(self):

        if self._scraper:
            self._scraper.close()
            self._scraper = None


async def main():
    config = LinkedInScraperConfig(session_file="session.pkl", log_level=1)
    service = LinkedInScraperService()
    service.initialize(config=config)

    try:
        scraper = service.get_scraper()
        params = StaffSearchParams(
            company_name="openai",
            search_term="software engineer",
            location="london",
            extra_profile_data=True,
            max_results=10
        )

        loop = asyncio.get_event_loop()
        results = await loop.run_in_executor(
            None,
            scraper.scrape_staff_to_dict,
            params
        )

        print(f"Found {len(results)} people")

        if results:
            print(results)
        else:
            print("No results my bro")

    except ValueError as e:
        print(f"Value error {e}")
    except Exception as e:
        print(f"Error = {e}")

    finally:
        service.shutdown()


if __name__ == "__main__":
    asyncio.run(main())
