# AI-for-Writers

## How to run the server

In the terminal:

1. Run `pip install -r requirements.txt`
2. Run `python -m spacy download en_core_web_sm`
3. Create a file named `.env` in the `project` folder, containing:

    ```
    OPENAI_API_KEY=YOUR_API_KEY
    ```

    We'll get the API key in the next step.
4. Go to [OpenAI API keys](https://platform.openai.com/account/api-keys) to get an API key. Replace `YOUR_API_KEY` in the `.env` file with the API key you just copied.
5. Run `python server.py` to run the server.
