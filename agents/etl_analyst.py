import os
import sys
import time

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from dotenv import load_dotenv
load_dotenv()

from langchain_core.messages import AIMessage
from langgraph.graph import StateGraph, START, END

from models.schema import ETLAgentSchema, ETLPlanSchema
from utils.llm_pick import pick_llm
from utils.etl_tools import ETLTools


# ---------------------------------------------------------------------------
# ETL Analyst — a small LangGraph pipeline that mirrors the real
# Extract / Transform / Load stages, so the frontend can show genuine
# stage-by-stage progress instead of a fabricated percentage.
# ---------------------------------------------------------------------------

def plan_extraction(state: ETLAgentSchema) -> ETLAgentSchema:
    llm = pick_llm("low")
    llm_planner = llm.with_structured_output(ETLPlanSchema)

    prompt = f"""
    You are an ETL planning agent. Read the user's request and figure out:
    1. The exact HTTP(S) API URL that should be called to extract the data.
       If the user gives a URL, use it. If they name a well known public API
       without a URL, use its documented base endpoint.
    2. A short, filesystem-safe output filename ending in .csv that describes
       the resulting dataset (e.g. "pokemon_data.csv").

    User's request: {state.user_request}
    """

    plan = llm_planner.invoke(prompt)
    state.api_url = plan.api_url
    state.output_filename = plan.output_filename
    return state


def extract_data(state: ETLAgentSchema) -> ETLAgentSchema:
    try:
        records = ETLTools.extract_from_api(state.api_url)
        state.raw_record_count = len(records)
        state.raw_records = records
    except Exception as e:
        state.status = "failed"
        state.error = str(e)
    return state


def transform_data(state: ETLAgentSchema) -> ETLAgentSchema:
    try:
        df = ETLTools.transform(state.raw_records)
        state.clean_record_count = len(df)
        state.clean_records = df.to_dict(orient="records")
    except Exception as e:
        state.status = "failed"
        state.error = str(e)
    return state


def load_data(state: ETLAgentSchema) -> ETLAgentSchema:
    try:
        import pandas as pd

        if not state.clean_records:
            raise RuntimeError("No transformed data available to load")
        df = pd.DataFrame(state.clean_records)
        output_path = ETLTools.load_to_csv(df, state.output_filename)
        state.output_path = output_path
        state.status = "success"
    except Exception as e:
        state.status = "failed"
        state.error = str(e)
    return state


def summarize(state: ETLAgentSchema) -> ETLAgentSchema:
    if state.status == "failed":
        answer = f"The ETL pipeline failed: {state.error}"
    else:
        llm = pick_llm("low")
        prompt = f"""
        You are an ETL analyst agent. Summarize the outcome of a data pipeline run for the user
        in 2-4 sentences. Be concrete and mention the record counts and output file. Do not include
        code or file paths with backslashes/quotes, just plain text.

        Original request: {state.user_request}
        Source API: {state.api_url}
        Raw records extracted: {state.raw_record_count}
        Clean records after transformation: {state.clean_record_count}
        Output file: {os.path.basename(state.output_path)}
        """
        answer = llm.invoke(prompt).text

    state.final_answer = answer
    state.messages = state.messages + [AIMessage(content=answer)]
    return state


def error_node(state: ETLAgentSchema) -> ETLAgentSchema:
    state.final_answer = f"The ETL pipeline could not complete: {state.error}"
    state.messages = state.messages + [AIMessage(content=state.final_answer)]
    return state


def route_after_extract(state: ETLAgentSchema) -> str:
    return "transform_data" if state.status != "failed" else "error_node"


def route_after_transform(state: ETLAgentSchema) -> str:
    return "load_data" if state.status != "failed" else "error_node"


etl_agent_graph = StateGraph(ETLAgentSchema)

etl_agent_graph.add_node("plan_extraction", plan_extraction)
etl_agent_graph.add_node("extract_data", extract_data)
etl_agent_graph.add_node("transform_data", transform_data)
etl_agent_graph.add_node("load_data", load_data)
etl_agent_graph.add_node("summarize", summarize)
etl_agent_graph.add_node("error_node", error_node)

etl_agent_graph.add_edge(START, "plan_extraction")
etl_agent_graph.add_edge("plan_extraction", "extract_data")

etl_agent_graph.add_conditional_edges(
    "extract_data",
    route_after_extract,
    {"transform_data": "transform_data", "error_node": "error_node"},
)
etl_agent_graph.add_conditional_edges(
    "transform_data",
    route_after_transform,
    {"load_data": "load_data", "error_node": "error_node"},
)

etl_agent_graph.add_edge("load_data", "summarize")
etl_agent_graph.add_edge("summarize", END)
etl_agent_graph.add_edge("error_node", END)

etl_analyst = etl_agent_graph.compile()


if __name__ == "__main__":
    start = time.time()
    result = etl_analyst.invoke(
        {
            "messages": [],
            "user_request": "Extract the data from https://pokeapi.co/api/v2/pokemon?limit=20, "
                             "clean it, and save it as a CSV",
        }
    )
    print(result["final_answer"])
    print(f"status={result['status']} output_path={result.get('output_path')}")
    print(f"took {time.time() - start:.2f}s")
