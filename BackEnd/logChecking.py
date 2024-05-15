# import requests 
# import os

# def get_chat_id():
#     url = f'https://api.telegram.org/bot{TOKEN}/getUpdates'
#     try:
#         response = requests.get(url)
#         response.raise_for_status()
#         updates = response.json()
#         for update in updates['result']:
#             if 'message' in update:
#                 chat_id = update['message']['chat']['id']
#                 print(f"Chat ID: {chat_id}")
#                 return chat_id
#     except requests.exceptions.RequestException as e:
#         print(f"Error: {e}")

# def sendMessageCheck(message):
#     url = f'https://api.telegram.org/bot{TOKEN}/sendMessage'
#     params = {
#         'chat_id': CHAT_ID,
#         'text': message
#     }
#     try:
#         response = requests.post(url, json=params)
#         response.raise_for_status()
#         print("Message sent successfully")
#     except requests.exceptions.RequestException as e:
#         print(f"Error sending message to Telegram: {e}")

# file_path = 'controller/detailed_logs.csv'

# def checkFilePath(path):
#     if os.path.exists(path):
#         print(f"File exists at {path}")
#         with open(path, 'a') as file:
#             file.write("check\n")
#             print("Added")
#     else:
#         print(f"File does not exist at {path}")
# # get_chat_id()
# # sendMessageCheck("Hello, this is a test message from my bot!")
# # checkFilePath(file_path)

# from datetime import datetime
# import requests


# LOG_FILE_PATH = 'controller/detailed_logs.csv'

# def send_message_to_telegram(message):
#     url = f'https://api.telegram.org/bot{TOKEN}/sendMessage'
#     params = {'chat_id': CHAT_ID, 'text': message}
#     try:
#         response = requests.post(url, json=params)
#         response.raise_for_status()
#         print("Message sent successfully")
#     except requests.exceptions.RequestException as e:
#         print(f"Error sending message to Telegram: {e}")

# def format_alert_message(log_entry):
#     parts = log_entry.split(',')
#     if len(parts) >= 2:
#         # Extract date, time and the message
#         date_str = parts[0].split(': ')[-1].strip()
#         time_str = parts[1].split(': ')[-1].strip()
#         message = parts[-1].split(': ')[-1].strip()
#         return f"Date: {date_str}, Time: {time_str} - {message}"
#     return "Unknown Event"

# def check_logs():
#     with open(LOG_FILE_PATH, 'r', encoding='utf-8') as file:
#         lines = file.readlines()

#     alerts = []
#     current_date = datetime.now().date()

#     for line in lines:
#         parts = line.split(',')
#         if len(parts) >= 2:
#             date_str = parts[0].split(': ')[-1].strip()
#             time_str = parts[1].split(': ')[-1].strip()
#             log_time_str = f"{date_str} {time_str}"
#             try:
#                 log_datetime = datetime.strptime(log_time_str, '%d-%m-%Y %H:%M:%S')
#                 log_date = log_datetime.date()
#                 log_hour = log_datetime.hour

#                 if log_date == current_date and datetime.now().hour - log_hour <= 1:
#                     if ('Update User' in line or 'Edit Product' in line or
#                         'Delete Product' in line or 'Add new Discount' in line or
#                         'Upload Product Image' in line or 'Failed login attempt' in line):
#                         alerts.append(format_alert_message(line))
#             except ValueError as e:
#                 print(f"Error parsing date and time: {log_time_str}, Error: {e}")

#     if alerts:
#         message = "Alert: Critical actions detected:\n\n" + '\n'.join(alerts)
#         send_message_to_telegram(message)
#     else:
#         print("No relevant logs found in the last hour.")

# check_logs()

from datetime import datetime
import requests
import time

TOKEN='1234567890:ABCDEfghijKLMNopqrSTUvwxYZ1234567890'
CHAT_ID = "987654321"
LOG_FILE_PATH = 'controller/detailed_logs.csv'

def send_message_to_telegram(message):
    url = f'https://api.telegram.org/bot{TOKEN}/sendMessage'
    params = {'chat_id': CHAT_ID, 'text': message}
    try:
        response = requests.post(url, json=params)
        response.raise_for_status()
        print("Message sent successfully")
    except requests.exceptions.RequestException as e:
        print(f"Error sending message to Telegram: {e}")

def format_alert_message(log_entry):
    parts = log_entry.split(',')
    if len(parts) >= 2:
        # Extract date, time and the message
        date_str = parts[0].split(': ')[-1].strip()
        time_str = parts[1].split(': ')[-1].strip()
        message = parts[-1].split(': ')[-1].strip()
        return f"Date: {date_str}, Time: {time_str} - {message}"
    return "Unknown Event"

def check_logs():
    with open(LOG_FILE_PATH, 'r', encoding='utf-8') as file:
        lines = file.readlines()

    alerts = []
    current_date = datetime.now().date()

    for line in lines:
        parts = line.split(',')
        if len(parts) >= 2:
            date_str = parts[0].split(': ')[-1].strip()
            time_str = parts[1].split(': ')[-1].strip()
            log_time_str = f"{date_str} {time_str}"
            try:
                log_datetime = datetime.strptime(log_time_str, '%d-%m-%Y %H:%M:%S')
                log_date = log_datetime.date()
                log_hour = log_datetime.hour

                if log_date == current_date and datetime.now().hour - log_hour <= 1:
                    if ('Update User' in line or 'Edit Product' in line or
                        'Delete Product' in line or 'Add new Discount' in line or
                        'Upload Product Image' in line or 'Failed login attempt' in line):
                        alerts.append(format_alert_message(line))
            except ValueError as e:
                print(f"Error parsing date and time: {log_time_str}, Error: {e}")

    if alerts:
        message = "Alert: Critical actions detected:\n\n" + '\n'.join(alerts)
        send_message_to_telegram(message)
    else:
        print("No relevant logs found in the last hour.")

while True:
    check_logs()
    time.sleep(3600)  # Sleep for one hour
