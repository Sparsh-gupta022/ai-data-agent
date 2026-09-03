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
        schema_info_context = f"Database Schema: {schema_name}"
        
        try:
            cursor.execute("SELECT table_name from information_schema.tables where table_schema = %s;", (schema_name,))
            tables_list = cursor.fetchall()   # will fetch the complete result
            
            for table in tables_list:   # har table se uska tablename fetch kia and 
                table_name = table[0]   # usko schema_info_contxt mai add kr dia
                schema_info_context = f"{schema_info_context}\nTable: {table_name}\n"
            
            
            # har table k columns fetch krliye 
            
            cursor.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = %s;", (table_name,))
            columns_list = cursor.fetchall()

            for column in columns_list:   # har column name add kr dia in shcema_info cntext
                    column_name = column[0]
                    data_type = column[1]
                    schema_info_context = f"{schema_info_context}  Column: {column_name}, Data Type: {data_type}\n"
            
            # Adding Sample Data
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

dbconfig = {
    "host": os.getenv("host"),
    "port": os.getenv("port"),
    "user": os.getenv("user"),
    "password": os.getenv("password"),
    "dbname": os.getenv("database")
}
obj = DatabaseUtil(dbconfig)

result = obj.schema_details("public")

with open("test_schema_details.txt","w") as f:
    f.write(result)
    