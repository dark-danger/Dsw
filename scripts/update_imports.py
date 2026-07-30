import os
import re

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))

print(f"Scanning directory: {backend_dir}")

for root, dirs, files in os.walk(backend_dir):
    for file in files:
        if file.endswith(".py"):
            filepath = os.path.join(root, file)
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()

            # Replace imports
            updated_content = content
            updated_content = re.sub(r'\bfrom app\b', 'from backend', updated_content)
            updated_content = re.sub(r'\bfrom app\.', 'from backend.', updated_content)
            updated_content = re.sub(r'\bimport app\b', 'import backend', updated_content)
            updated_content = re.sub(r'\bimport app\.', 'import backend.', updated_content)

            if updated_content != content:
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(updated_content)
                print(f"Updated imports in: {filepath}")

print("Done scanning and updating python imports.")
