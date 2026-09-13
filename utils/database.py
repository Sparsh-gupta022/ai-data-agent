import psycopg2
import os
import sys
from dotenv import load_dotenv
load_dotenv()


class DatabaseUtil:
    
    def __init__(self,dbconfig):   # constructor will connect to the database
        self.dbconfig = dbconfig
        try:
            self.connection = psycopg2.connect(**dbconfig)
        except Exception as e:
            print(f"Error in connecting to the database{e}")
            self.connection = None            
    
        
    def schema_details(self,schema_name):   # will find context related to the query
        schema_info_context = ""
        connection  = self.connection
        cursor = connection.cursor()   # cursor is the thing through which we execute the queries
        schema_info_context = f"Database Schema: {schema_name}\n"
        
        try:
            cursor.execute("SELECT table_name from information_schema.tables where table_schema = %s;", (schema_name,))
            tables_list = cursor.fetchall()   # will fetch the complete result
            
            for table in tables_list:
                table_name = table[0]

                schema_info_context = f"{schema_info_context}\nTable: {table_name}\n"

                # Get columns for THIS table
                cursor.execute(
                """
                SELECT column_name, data_type
                FROM information_schema.columns
                WHERE table_schema = %s AND table_name = %s;
                """,
                (schema_name, table_name)
            )

                columns_list = cursor.fetchall()

                for column in columns_list:
                    column_name = column[0]
                    data_type = column[1]

                    schema_info_context = f"{schema_info_context}  Column: {column_name}, Data Type: {data_type}\n"


                #  Get sample data for THIS table
                cursor.execute(f"SELECT * FROM {schema_name}.{table_name} LIMIT 5;")

                sample_data = cursor.fetchall()

                schema_info_context = f"{schema_info_context}  Sample Data:\n"

                for row in sample_data:
                    schema_info_context = f"{schema_info_context}    {row}\n"
            
        
            
        except Exception as e:
            print(f"Error fetching schema details: {e}")
            schema_info_context = f"Error fetching schema details: {e}"

        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()
        
        return schema_info_context  
    
    def execute_sql(self,query):
        try:
            connection = self.connection
            cursor = connection.cursor()
            cursor.execute(query)
            result = cursor.fetchall()  # fetchall converts the reukst in the form of list
            connection.commit()
            return str(result)
        except Exception as e:
            error_message = f"Error executing query: {e}"
            print(error_message)

            return error_message             
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()

    def execute_sql_structured(self, query):
        """
        Same execution as execute_sql, but also returns column names and rows
        as JSON-friendly primitives so the API layer can hand a real table
        (columns + rows) to the frontend instead of a stringified tuple list.

        Returns a dict: {"success": bool, "columns": [...], "rows": [[...]], "error": str|None}
        """
        connection = self.connection
        cursor = None
        try:
            cursor = connection.cursor()
            cursor.execute(query)
            columns = [desc[0] for desc in cursor.description] if cursor.description else []
            raw_rows = cursor.fetchall() if cursor.description else []
            connection.commit()

            def _to_jsonable(value):
                # Decimal, datetime, date, etc. all stringify cleanly and safely
                if value is None or isinstance(value, (int, float, str, bool)):
                    return value
                return str(value)

            rows = [[_to_jsonable(v) for v in row] for row in raw_rows]
            return {"success": True, "columns": columns, "rows": rows, "error": None}
        except Exception as e:
            error_message = f"Error executing query: {e}"
            print(error_message)
            return {"success": False, "columns": [], "rows": [], "error": error_message}
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()
        

if __name__ == "__main__":

    dbconfig = {
        "host": os.getenv("host"),
        "port": os.getenv("port"),
        "user": os.getenv("user"),
        "password": os.getenv("password"),
        "dbname": os.getenv("database")
    }

    obj = DatabaseUtil(dbconfig)

    result = obj.schema_details("public")

    with open("test_schema_details.txt", "w") as f:
        f.write(result)