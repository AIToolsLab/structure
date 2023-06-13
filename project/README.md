# AI-for-Writers

## How to run server.py:
In the terminal:
1. cd to the project file
2. Run pip install -r requirements.txt
3. Run python -m spacy download em_core_web_sm
4. Run python server.py
5. You will need an OpenAPI secret key to run the server properly. See https://platform.openai.com/account/api-keys. To store the key, create a .env file and set the variable OPENAI_API_KEY to your key.
#### NOTE: You will need to cd to the 'project' file whenever you open a new terminal.