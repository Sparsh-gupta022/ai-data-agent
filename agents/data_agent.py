import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from utils.llm_pick import pick_llm
from models.schema import RouterSchema, DataAgentSchema
from langchain_core.messages import AIMessage, HumanMessage
from langgraph.graph import StateGraph, START, END

from agents.etl_analyst import etl_analyst
from agents.sql_analyst import sql_analyst

llm = pick_llm("low")
llm_router = llm.with_structured_output(RouterSchema)


# ---------------------------------------------------------------------------
# Top-level "Auto" agent: routes each request to the SQL analyst or the
# ETL analyst based on what the user is asking for.
# ---------------------------------------------------------------------------

def router_node(state: DataAgentSchema) -> DataAgentSchema:
    message = state.messages[-1].content
    route_response = llm_router.invoke(message)
    state.route_response = route_response.answer
    return state


def sql_node(state: DataAgentSchema) -> DataAgentSchema:
    message = state.messages[-1].content

    input_schema = {
        "messages": [],
        "user_ques": message,
        "curated_ques": "",
        "prompt_query_context": "",
        "generated_sql_query": "",
        "is_safe": "No",
        "comments": "",
        "sql_query_execution_result": "",
        "final_answer": "",
    }

    response = sql_analyst.invoke(input_schema)
    state.sql_result = response
    state.final_answer = response.get("final_answer", "")
    state.messages = state.messages + [AIMessage(content=state.final_answer)]
    return state


def etl_node(state: DataAgentSchema) -> DataAgentSchema:
    message = state.messages[-1].content

    response = etl_analyst.invoke({"messages": [], "user_request": message})
    state.etl_result = response
    state.final_answer = response.get("final_answer", "")
    state.messages = state.messages + [AIMessage(content=state.final_answer)]
    return state


def route_edge(state: DataAgentSchema) -> str:
    if state.route_response == "sql":
        return "sql_node"
    elif state.route_response == "etl":
        return "etl_node"
    else:
        # Fail safe rather than crashing the whole request: default to SQL,
        # since most analytical questions are SQL questions.
        return "sql_node"


data_agent_graph = StateGraph(DataAgentSchema)

data_agent_graph.add_node("router_node", router_node)
data_agent_graph.add_node("etl_node", etl_node)
data_agent_graph.add_node("sql_node", sql_node)

data_agent_graph.add_edge(START, "router_node")
data_agent_graph.add_conditional_edges(
    "router_node",
    route_edge,
    {"sql_node": "sql_node", "etl_node": "etl_node"},
)
data_agent_graph.add_edge("sql_node", END)
data_agent_graph.add_edge("etl_node", END)

data_agent = data_agent_graph.compile()


if __name__ == "__main__":
    response = data_agent.invoke(
        {
            "messages": [
                HumanMessage(
                    content="I want to extract the data from the API endpoint "
                             "'https://pokeapi.co/api/v2/pokemon' and save it to a csv"
                )
            ],
            "route_response": "",
        }
    )
    print(response["final_answer"])

    # Optional: only run this manually, it needs network access + IPython and
    # is not something the API layer (or import of this module) should ever trigger.
    # from IPython.display import Image
    # img = Image(data_agent.get_graph().draw_mermaid_png())
    # with open("data_agent_graph.png", "wb") as f:
    #     f.write(img.data)
