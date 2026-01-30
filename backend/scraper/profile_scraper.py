from typing import Optional, List
from pathlib import Path
import pandas as pd
from staffspy import LinkedInAccount, SolverType, DriverType, BrowserType


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
    
    def get_driver_config(self) -> Optional[DriverType]:
        """Build driver configuration if needed"""
        if self.executable_path and self.browser_type:
            return DriverType(
                browser_type=self.browser_type,
                executable_path=self.executable_path
            )
        return self.driver_type


class LinkedInAccountScraper:
    def __init__(self, config: LinkedInScraperConfig):
        self.config = config
        self.account = self.init_new_acc()
