# AI-for-Writers

## How to run the server

In the terminal:

1. cd `project`
2. Run `pip install -r requirements.txt`
3. Run `python -m spacy download en_core_web_sm`
4. Go to [OpenAI API keys](https://platform.openai.com/account/api-keys) to get an API key. Make sure you copy the key and store it somewhere safe (you won't be able to see it again.
5. Create a file named `.env` in the `project` folder, containing:
    ```
    OPENAI_API_KEY=<your key>
    ```
6. Run `python server.py` to run the server.


> NOTE: You will need to cd to the 'project' file whenever you open a new terminal.
