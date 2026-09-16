# 🤖 AI Data Agent

An AI-powered data analysis and ETL platform that allows users to interact with structured data using natural language.

Built with **Google Gemini, LangGraph, FastAPI, PostgreSQL, and Next.js**, the system can understand a user's request, intelligently route it to the appropriate agent, generate and validate SQL, execute database analysis, or perform an API-based ETL workflow.

---

## ✨ Key Features

### 🧠 LLM-Powered Data Analysis
Ask questions about your database in natural language instead of writing SQL.

Example:

> Which payment method has the highest average payment amount?

The system uses an LLM to understand the request, generate SQL, execute it, and explain the results.

### 🔀 Intelligent Agent Routing

The **Data Agent** uses LangGraph and an LLM-powered router to determine which workflow should handle the request:

```text
User Query
    ↓
LLM Router
    ↓
 ┌───────────────┐
 │               │
SQL             ETL
 ↓               ↓
SQL Agent    ETL Agent

This allows the system to dynamically choose between database analysis and ETL operations.

🧑‍⚖️ LLM-as-a-Judge

Generated SQL is evaluated by a separate LLM-based judge before execution.

SQL Generation
      ↓
LLM Judge
      ↓
 ┌────┴────┐
Safe      Unsafe
 ↓          ↓
Execute    Cancel

The judge returns structured Yes/No output with comments explaining the decision.

🔐 Read-Only SQL Safety

The system is designed for read-only analytical queries. SQL is checked before being executed against PostgreSQL.

Supported analytical operations include:

SELECT
GROUP BY
ORDER BY
JOIN
AVG()
SUM()
COUNT()

The application also displays the safety decision and generated SQL in the frontend.

For production deployment, deterministic SQL validation and a dedicated read-only database role should be added in addition to the LLM judge.

🗄️ Automatic Database Schema Context

The SQL Agent retrieves PostgreSQL schema information including:

Tables
Columns
Data types
Sample records

This context is provided to the LLM before SQL generation, allowing it to generate queries based on the actual database structure.

🔄 AI-Powered ETL Pipeline

The ETL Agent handles API-based data workflows:

User Request
     ↓
LLM ETL Planning
     ↓
API Extraction
     ↓
Data Transformation
     ↓
CSV Generation

It extracts data from APIs, cleans and normalizes it using Pandas, and saves the processed dataset as CSV.

📊 Automatic Visualization

SQL results are returned in structured form and can automatically be displayed as:

Interactive tables
Bar charts
KPI-style summaries
Generated SQL
Execution details
💻 Full-Stack AI Application

The project includes a complete web interface built with:

Next.js
React
TypeScript
Tailwind CSS
Recharts

The FastAPI backend exposes the AI agents through REST APIs.

🏗️ Architecture
                       User
                        │
                        ▼
                ┌───────────────┐
                │  Next.js UI   │
                └───────┬───────┘
                        │
                        ▼
                ┌───────────────┐
                │ FastAPI API   │
                └───────┬───────┘
                        │
                        ▼
                ┌───────────────┐
                │ LangGraph     │
                │ LLM Router    │
                └───────┬───────┘
                        │
                 ┌──────┴──────┐
                 ▼             ▼
          SQL Analyst       ETL Analyst
                 │             │
                 ▼             ▼
          PostgreSQL       External API
                 │             │
                 ▼             ▼
          SQL Results       Clean CSV
                 │
                 ▼
          LLM Final Answer
                 │
                 ▼
           Tables + Charts
🤖 SQL Agent Workflow
User Question
      ↓
Question Curation
      ↓
Database Schema Retrieval
      ↓
LLM SQL Generation
      ↓
LLM-as-a-Judge
      ↓
Conditional Safety Check
      ↓
SQL Execution
      ↓
Structured Results
      ↓
LLM Final Answer

Example generated SQL:

SELECT payment_method,
       AVG(amount) AS average_amount
FROM payments
GROUP BY payment_method
ORDER BY average_amount DESC;
🔄 ETL Agent Workflow
User Request
      ↓
LLM Extraction Plan
      ↓
API Extraction
      ↓
Pandas Transformation
      ↓
CSV Loading
      ↓
Summary

The ETL pipeline tracks:

Raw record count
Clean record count
Output file
Execution time
Pipeline status
Errors
🛠️ Tech Stack
Category	Technologies
LLM	Google Gemini
Agent Framework	LangGraph, LangChain
Backend	Python, FastAPI
Database	PostgreSQL
Data Processing	Pandas
Validation	Pydantic, LLM-as-a-Judge
Frontend	Next.js, React, TypeScript
Styling	Tailwind CSS
Visualization	Recharts
HTTP / ETL	Requests
Package Management	uv, npm
📁 Project Structure
ai-data-agent/
│
├── agents/
│   ├── data_agent.py
│   ├── sql_analyst.py
│   └── etl_analyst.py
│
├── api/
│   ├── server.py
│   ├── schemas.py
│   └── history_store.py
│
├── data/
│   ├── users.csv
│   ├── vehicles.csv
│   ├── rides.csv
│   ├── payments.csv
│   ├── ratings.csv
│   └── extract/
│
├── models/
│   └── schema.py
│
├── utils/
│   ├── database.py
│   ├── etl_tools.py
│   └── llm_pick.py
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   └── lib/
│
├── feed_db.py
├── main.py
├── test.py
├── pyproject.toml
└── README.md
⚙️ Local Setup
Prerequisites
Python 3.12+
Node.js
npm
PostgreSQL
uv
Google Gemini API key
1. Clone
git clone https://github.com/Sparsh-gupta022/ai-data-agent.git
cd ai-data-agent
2. Install backend dependencies
uv sync

If using OneDrive on Windows and uv encounters a hardlink error:

uv sync --link-mode=copy
3. Configure environment

Create .env using .env.example.

GEMINI_API_KEY=your_gemini_api_key

host=localhost
port=5432
user=your_postgres_username
password=your_postgres_password
database=your_database_name

Never commit .env or API keys to GitHub.

4. Load the database

Make sure PostgreSQL is running, then:

uv run python feed_db.py
5. Start the backend
uv run uvicorn api.server:app --reload --port 8000

Backend:

http://127.0.0.1:8000

Health check:

http://127.0.0.1:8000/api/health
6. Start the frontend

Open another terminal:

cd frontend
npm install
npm run dev

Open:

http://localhost:3000
💡 Example Queries

Try:

What are the different payment methods?
Which payment method has the highest average payment amount?
Which 10 users have spent the most money on rides?
Which vehicle type has the highest average fare?
Show the number of rides for each vehicle type.
Analyze the monthly ride trends.
🔐 Security & Production Considerations

The current project includes an LLM-based read-only safety check before SQL execution.

For production use, additional protections should be implemented:

Deterministic SQL parsing/validation
Dedicated read-only PostgreSQL user
Authentication and authorization
API rate limiting
SSRF protection / URL allowlisting for ETL
Structured logging and monitoring
Production secrets management
🔮 Future Improvements
 Real-time LangGraph node streaming
 Stronger deterministic SQL validation
 Query correction and retry
 Persistent conversation storage
 Anomaly detection
 Automated report generation
 More advanced visualizations
 Authentication
 Docker deployment
 CI/CD
 Production monitoring
🎯 What This Project Demonstrates

This project demonstrates practical AI Engineering concepts including:

LLM application development
LangGraph agent orchestration
Conditional agent routing
LLM structured outputs
LLM-as-a-Judge
Natural-language-to-SQL
AI + deterministic tool execution
SQL safety validation
API-based ETL pipelines
PostgreSQL integration
FastAPI backend development
Next.js AI application development
Data visualization

The core idea is to combine LLM reasoning with deterministic software tools to build a complete AI-powered data analysis system.

👨‍💻 Author

Sparsh Gupta

GitHub:
https://github.com/Sparsh-gupta022

Project:
https://github.com/Sparsh-gupta022/ai-data-agent