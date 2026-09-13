from agents.sql_analyst import curate_ques
from models.schema import AgentSchema


test_state = AgentSchema(
    messages=[],
    user_ques="What are the different types of Payment Methods we have in our database",
    curated_ques="",
    prompt_query_context="",
    generated_sql_query="",
    is_safe="No",
    comments="",
    sql_query_execution_result="",
    final_answer=""
)


result = curate_ques(test_state)

print(result.curated_ques)
print(type(result.curated_ques))