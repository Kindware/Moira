import os
import json

# Paths to clear
MEMORY_FILE = 'memory/memory.json'
HEALTH_BUFFER_FILE = 'documents/health_buffer.json'
HEALTH_RECORDS_FILE = 'documents/health_records.json'
FAMILY_DIR = 'family'

# Clear memory.json
os.makedirs('memory', exist_ok=True)
with open(MEMORY_FILE, 'w') as f:
    json.dump({"conversations": []}, f, indent=2)
print(f"Cleared {MEMORY_FILE}")

# Clear health_buffer.json
os.makedirs('documents', exist_ok=True)
with open(HEALTH_BUFFER_FILE, 'w') as f:
    json.dump([], f, indent=2)
print(f"Cleared {HEALTH_BUFFER_FILE}")

# Clear health_records.json
with open(HEALTH_RECORDS_FILE, 'w') as f:
    json.dump([], f, indent=2)
print(f"Cleared {HEALTH_RECORDS_FILE}")

# Delete all .json files in family directory
os.makedirs(FAMILY_DIR, exist_ok=True)
for filename in os.listdir(FAMILY_DIR):
    if filename.endswith('.json'):
        path = os.path.join(FAMILY_DIR, filename)
        try:
            os.remove(path)
            print(f"Deleted {path}")
        except Exception as e:
            print(f"Failed to delete {path}: {e}")

print("All Moira memory and records cleared.") 