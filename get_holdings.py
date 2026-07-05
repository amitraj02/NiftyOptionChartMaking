import os                                                 # Access environment variables & system functions
import re                                                 # Regular expressions to parse config formats
from pathlib import Path                                   # Manipulate files/folders path system in OS
from dhanhq import dhanhq                                   # Python SDK for DhanHQ trading platform APIs
import pandas as pd                                         # Data analysis library to structure tables

def load_credentials():
    base_dir = Path(__file__).resolve().parent             # Get current folder path of get_holdings.py
    env_txt_path = base_dir / "database" / "env.txt"       # Absolute path to database/env.txt config file
    dot_env_path = base_dir / "database" / ".env"          # Absolute path to fallback database/.env file
    
    client_id = os.environ.get("DHAN_CLIENT_ID")           # Read client ID from OS environment variables
    access_token = os.environ.get("DHAN_ACCESS_TOKEN")     # Read access token from OS environment variables

    if client_id and access_token:                         # If credential variables are already defined...
        return client_id, access_token                     # ...return them immediately and skip files

    target_path = env_txt_path if env_txt_path.exists() else (dot_env_path if dot_env_path.exists() else None) # Determine which config file exists

    if target_path:                                        # If a credentials file is found...
        print(f"Loading credentials from {target_path.name}...") # Print loading status indicator
        content = target_path.read_text()                  # Read entire content of file as string
        
        client_id_match = re.search(r'client_ID\s*=\s*"([^"]+)"', content)       # Match client_ID="value" pattern
        access_token_match = re.search(r'access_Token\s*=\s*"([^"]+)"', content) # Match access_Token="value" pattern
        
        if client_id_match:                                # If client ID pattern match is successful...
            client_id = client_id_match.group(1)           # Extract actual ID string from group 1
        if access_token_match:                             # If access token pattern match is successful...
            access_token = access_token_match.group(1)     # Extract actual JWT token from group 1

    if not client_id or not access_token:                  # If credentials are still empty/missing...
        raise ValueError("Could not load DHAN_CLIENT_ID or DHAN_ACCESS_TOKEN from environment or database/env.txt") # Raise validation error
        
    return client_id, access_token                         # Return credentials as a tuple (ID, Token)

DHAN_CLIENT_ID, DHAN_ACCESS_TOKEN = load_credentials()     # Assign credentials from helper function
dhan = dhanhq(DHAN_CLIENT_ID, DHAN_ACCESS_TOKEN)           # Initialize DhanHQ client using credentials

def get_holdings(dhan):
    data_holdings = dhan.get_holdings()                    # Fetch user stock holdings from Dhan account

    print("\nAPI Response:")                               # Output label in console
    print(data_holdings)                                   # Print raw API JSON structure to console

    holdings_data = data_holdings.get("data", [])          # Get 'data' key array from response or default to list

    if isinstance(holdings_data, list):                    # If data is returned as a list of holdings...
        datafatch = pd.DataFrame(holdings_data)            # Convert list of holding dicts to Pandas DataFrame
    else:                                                  # If data is returned as a single dictionary...
        datafatch = pd.DataFrame([holdings_data])          # Wrap single dict in list & convert to DataFrame

    print("\n----------------------------Holdings DataFrame:------------------------") # Print header divider
    print(datafatch)                                       # Display structured table layout in terminal

if __name__ == "__main__":
    get_holdings(dhan)                                     # Invoke the holdings fetching script entry point
