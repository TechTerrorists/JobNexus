from typing import List, Literal, TypedDict


class WorkflowState(TypedDict, total=False):
    stage: Literal[
        "START",
        "RESUME_FLOW",
        "LINKEDIN_FLOW",
        "OUTREACH_FLOW",
        "DONE",
        "RESET"
    ]
    interrupted: bool

class ConversationState(TypedDict, total=False):
    last_user_message: str

    intent: Literal[
        "JOB_SEARCH",
        "RESUME_PROCESS",
        "LINKEDIN_REFERRAL",
        "GENERAL_TOOL",
        "UNKNOWN"
    ]

    status: Literal[
        "IDLE",
        "AWAITING_INPUT",
        "IN_PROGRESS",
        "PAUSED"
    ]

    pending_questions: List[str]
    turn_count: int