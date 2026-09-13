import os
import time
import pandas as pd
import requests


class ETLTools:
    """
    Small, dependency-light ETL toolkit used by the ETL analyst agent.

    Extract  -> pull JSON data from a public API endpoint
    Transform -> normalize into a flat pandas DataFrame, drop empty/duplicate rows
    Load     -> write the cleaned dataset to a CSV file under data/extract/
    """

    OUTPUT_DIR = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "data", "extract")
    )

    @classmethod
    def extract_from_api(cls, api_url: str, timeout: int = 20) -> list:
        """
        GET the given API URL and return a list of records (list[dict]).
        Raises a RuntimeError with a clean message on any failure so the
        calling agent node can surface it without a stack trace.
        """
        try:
            response = requests.get(api_url, timeout=timeout)
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            raise RuntimeError(f"Failed to reach API '{api_url}': {e}")

        try:
            payload = response.json()
        except ValueError:
            raise RuntimeError(f"API '{api_url}' did not return valid JSON")

        records = cls._coerce_to_records(payload)

        if not records:
            raise RuntimeError(f"API '{api_url}' returned no usable records")

        return records

    @staticmethod
    def _coerce_to_records(payload) -> list:
        """
        APIs return data in different shapes. Handle the common ones:
        - a plain list of objects
        - a dict with a top-level "results" / "data" / "items" list
        - a single object (wrap it in a list)
        """
        if isinstance(payload, list):
            return payload

        if isinstance(payload, dict):
            for key in ("results", "data", "items"):
                value = payload.get(key)
                if isinstance(value, list):
                    return value
            # No known list field found - treat the whole dict as one record
            return [payload]

        return []

    @staticmethod
    def transform(records: list) -> pd.DataFrame:
        """
        Flatten nested JSON into a DataFrame, drop fully-empty rows/columns,
        drop exact duplicate rows, and normalize column names.
        """
        df = pd.json_normalize(records)

        if df.empty:
            return df

        df = df.dropna(axis=1, how="all")
        df = df.dropna(axis=0, how="all")
        df = df.drop_duplicates()
        df.columns = [str(c).strip().lower().replace(" ", "_") for c in df.columns]
        df = df.reset_index(drop=True)

        return df

    @classmethod
    def load_to_csv(cls, df: pd.DataFrame, filename: str) -> str:
        """
        Write the DataFrame to data/extract/<filename> and return the
        absolute path. Filename is sanitized to stay inside OUTPUT_DIR.
        """
        os.makedirs(cls.OUTPUT_DIR, exist_ok=True)

        safe_name = os.path.basename(filename) or "etl_output.csv"
        if not safe_name.lower().endswith(".csv"):
            safe_name += ".csv"

        output_path = os.path.join(cls.OUTPUT_DIR, safe_name)
        df.to_csv(output_path, index=False)

        return output_path


if __name__ == "__main__":
    # Quick manual smoke test (requires network access to pokeapi.co)
    start = time.time()
    raw = ETLTools.extract_from_api("https://pokeapi.co/api/v2/pokemon?limit=20")
    cleaned = ETLTools.transform(raw)
    path = ETLTools.load_to_csv(cleaned, "pokemon_sample.csv")
    print(f"Extracted {len(raw)} raw records, {len(cleaned)} clean rows -> {path}")
    print(f"Took {time.time() - start:.2f}s")
