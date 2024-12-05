import pandas as pd
import re
import json
import spacy
import chardet
import requests
from io import StringIO
import boto3
import time

nlp = spacy.load("en_core_web_sm")
about_people = False
col_name = ''
def lambda_handler(event, context):
    global about_people
    # Getting the CSV from event body (assuming it is base64 encoded)
    body = json.loads(event["body"])

    # Extract the file name and content from the body
    file_name = body["fileName"]  # Default value in case fileName is missing
    file_name = file_name.replace("csv", "json")
    #print(file_name)
    file_content = json.loads(body["fileContent"])

    #parsed_data = json.loads(csv_data)
    #csv_content = parsed_data.get('csv_data', '')
    # Convert CSV data to DataFrame
    df = pd.DataFrame(file_content)
    # Scan for malicious content
    initial_scan = check_for_malicious(df)
    if initial_scan['Unusual Character Rows Count'] > 0 or initial_scan['Suspicious Keywords'] > 0 or initial_scan['Shell Commands'] > 0:
        raise Exception("Malicious or suspicious content found, aborting.")
    
    about_people = contains_people(df)
    # Clean PII
    cleaned_df = clean_pii(df)
    cleaned_df = cleaned_df.applymap(lambda x: None if pd.isna(x) else x)
    # Call for IPFS function
    response = {
        "statusCode": 200,
        "body": json.dumps({
            "fileName": file_name,
            "fileContent": cleaned_df.to_json(orient='records')
        })
    }
    
    client = boto3.client('lambda', region_name='us-east-2')
    payload = {
        "fileName": file_name,
        "fileContent": cleaned_df.to_json(orient='records')
    }
    
    max_retries = 4
    wait_time = 10 
    
    for attempt in range(max_retries):
        response = client.invoke(
            FunctionName='ipfs_upload',  # Replace with the actual Lambda function name
            InvocationType='RequestResponse',  # Synchronous invocation
            Payload=json.dumps(payload)
        )
        
        response_payload = json.loads(response['Payload'].read().decode('utf-8'))
        status_code = response_payload.get('statusCode', 202)
        
        if status_code != 202:
            try:
                return {
                    "statusCode": 200,
                    "ipfsCID":  json.loads(response_payload['body'])['ipfsCID']
                    }
               
            except:
                continue
        
        # Wait before retrying
        time.sleep(wait_time)
    
    raise TimeoutError("Lambda function did not complete processing within the allowed retries.")



def check_for_malicious(df):
    # Check for suspicious content in the DataFrame (malicious keywords, special characters, etc.)
    suspicious_keywords = r'\b(?:eval|exec\b(?!utive)|os\.system|popen|pickle|__import__)\b'
    shell_commands = r'(\b(?:rm|mv|cp|ls|cat|curl|wget|chmod|chown)\b|&&|\||;)'

    unusual_characters = r'[^\x20-\x7E]'

    # Check for unusual characters
    unusual_char_rows_count = df.apply(lambda row: row.astype(str).str.contains(unusual_characters).any(), axis=1).sum()

    # Count suspicious keywords
    suspicious_keywords_count = df.apply(lambda row: row.astype(str).str.contains(suspicious_keywords).any(), axis=1).sum()

    # Count Shell Commands
    shell_commands_count = df.apply(lambda row: row.astype(str).str.contains(shell_commands).any(), axis=1).sum()


    return {
        'Unusual Character Rows Count': unusual_char_rows_count,
        'Suspicious Keywords': suspicious_keywords_count,
        'Shell Commands' : shell_commands_count
    }

offenses = 0

def clean_pii(df):
    global col_name, offenses
    # Function to clean PII in the DataFrame (email, SSN, credit card, etc.)
    for column in df.columns:
        #try:
        col_name = column
        df[column] = df[column].apply(pii_finder)
        #except Exception as e: 
        #    offenses += 1

        if offenses > 10:
            raise Exception("Remove all PII from dataset.")

    for column in df.columns:
        try:
            df[column] = pd.to_numeric(df[column])
        except ValueError:
            try:
                df[column] = pd.to_datetime(df[column])
            except ValueError:
                if df[column].str.lower().isin(['true', 'false']).all():
                    df[column] = df[column].str.lower() == 'true'
                else:
                    pass
    return df

def pii_finder(text):
    global col_name, offenses
    if not isinstance(text, str):
        text = str(text)

    # Patterns for SQL Injection
    sql_patterns = [
        r"(?i)\bSELECT\s+\*?\s+FROM\s+[`\[\]\"']?\w+[`\[\]\"']?(?:\s+WHERE\s+.*?|\s*;?)",
        r"(?i)\bINSERT\s+INTO\s+[`\[\]\"']?\w+[`\[\]\"']?\s+\(.*?\)\s+VALUES\s+\(.*?\)\s*;?",
        r"(?i)\bUPDATE\s+[`\[\]\"']?\w+[`\[\]\"']?\s+SET\s+\w+\s*=\s*.*?(?:\s+WHERE\s+.*?|;?)",
        r"(?i)\bDELETE\s+FROM\s+[`\[\]\"']?\w+[`\[\]\"']?(?:\s+WHERE\s+.*?|;?)",
        r"(?i)\bALTER\s+TABLE\s+[`\[\]\"']?\w+[`\[\]\"']?\s+.*?;?",
        r"(?i)\bDROP\s+TABLE\s+[`\[\]\"']?\w+[`\[\]\"']?\s*;?",
        r"(?i)\bCREATE\s+TABLE\s+[`\[\]\"']?\w+[`\[\]\"']?\s+\(.*?\)\s*;?",
        r"(?i)\bUNION\s+SELECT\b.*?;"
    ]
    for pattern in sql_patterns:
        if re.search(pattern, text, re.IGNORECASE):
            offenses += 1
            return "[REDACTED SQL]"
    
    # Patterns for detecting PII
    patterns = {
        "email_address": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",
        #"phone_number": r"\b(?:\+?\d{1,3}\s?)?\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4}\b",
        "phone_number": r"\b(?:\+?\d{1,3}[ -]?)?\(?\d{3}\)?[ -]?\d{3}[ -]?\d{4}\b",
        "ssn": r"\b\d{3}[-]?\d{2}[-]?\d{4}\b",
        "ip_address": r"\b(?:(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])|(?:[0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4})\b",
        "last_name": r"\b([A-Z][a-z]+(?:\s[Jr\.|Sr\.|II|III|IV])?)\b",
        "credit_card": r"\b(?:\d{4}[-\s]?){3}\d{4}|\b(?:\d{4}[-\s]?){3}\d{3}\b|\b(?:\d{4}[-\s]?){2}\d{4}[-\s]?\d{4}\b|\b\d{13,19}\b",
        "age": r"\b(?:(?:age|around|approximately|about|was|were)\s*)?(1[01]?[0-9]|[1-9]?\d)(?:\s*years?\s*(?:\d+\s*days?)?\s*old|\s*yrs?\.?|old)?\b",
        "birth_date": r"\b(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{4})\b"
    }
    for category, pattern in patterns.items():
        matches = re.finditer(pattern, text)
        first_match = next(matches, None)
        if category == "phone_number" and first_match != None:
            offenses += 1
            return "[REDACTED NUMBER]"
        
        elif category == "email_address" and first_match != None:
            offenses += 1
            return "[REDACTED EMAIL]"
        
        # Raise errors and not return the df if dangerous PII like SSN, ip_address, and credit card info is found.
        elif category == "ssn" and first_match != None:
            raise Exception("SSNs Included; please remove. Failure to do so again will result in a 0.5 ETH penalty.")
        
        elif category == "ip_address" and first_match != None:
            raise Exception("IP Addresses Included; please remove. Failure to do so again will result in a 0.5 ETH penalty.")
        
        elif category == 'credit_card' and first_match != None:
            raise Exception("Credit Card Information Detected; please remove. Failure to do so again will result in a 0.5 ETH penalty.")
        
        elif category == 'last_name':
            offenses += 1            
            about_people_holder, cleaned = replace_last_names(text)
            return cleaned
        
        elif category == 'age' and about_people and first_match != None:
            offenses += 1
            return "[REDACTED AGE]"
        
        elif category == 'birth_date' and about_people and first_match != None and 'birth' in col_name.lower():
            offenses += 1
            return "[REDACTED BIRTH DATE]"
        
        else:
            continue
    return text

def contains_people(df):
    for _, row in df.iterrows():
        for cell in row:
            # Apply the helper function to each cell
            people, _ = replace_last_names(str(cell))
            if people:
                return True
    return False
       

def replace_last_names(text):
    modified_text = text
    people = False
    # Uses the natural language processor (NLP) to find potential names
    for ent in nlp(text).ents:
        if ent.label_ == "PERSON":
            name_parts = ent.text.split()
            if len(name_parts) > 1:  # Ensure there's 1+ last names, then converts the text
                people = True
                last_name = name_parts[-1]
                anonymized_name = name_parts[0][0] + last_name[0]
                modified_text = modified_text.replace(ent.text, anonymized_name)
                #print(anonymized_name)

    return people, modified_text
