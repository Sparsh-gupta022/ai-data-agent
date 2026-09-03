from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv

def pick_llm(level: str):

    if level.lower() == "low":
        llm = ChatGoogleGenerativeAI(
            model="gemini-3.5-flash-lite"
        )

    elif level.lower() == "high":
        llm = ChatGoogleGenerativeAI(
            model="gemini-3.5-flash"
        )

    else:
        raise ValueError(
            "Invalid level. Choose from 'low' or 'high'."
        )

    return llm