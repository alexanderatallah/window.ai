"""Server for demo app showing how to use multiple local models."""
import os
import openai
import dotenv
from flask import Flask, jsonify, request
from langchain.chat_models import ChatOpenAI
from llama_index import Document, GPTSimpleVectorIndex, LLMPredictor, ServiceContext
from transformers import pipeline

dotenv.load_dotenv()
openai.api_key = os.environ["OPENAI_API_KEY"]

LOCAL_INDEX_FILE = "code_snippet_index.json"

app = Flask(__name__)

@app.route("/completions", methods=["POST"])
def completions():
    """The completions endpoint."""
    # Get the request data.
    data = request.get_json()
    prompt = data["prompt"]
    model = data["model"]
    print(prompt)
    print(model)

    if model not in ["embedding", "codegen"]:
        return jsonify({"error": f"Could not find model {model}."})

    if model == "embedding":
        # Embed the input.
        documents = [Document(prompt)]
        index = GPTSimpleVectorIndex.from_documents(documents)
        index.save_to_disk(LOCAL_INDEX_FILE)
        ret_data = {
            "choices": [
                {"text": "Successfully embedded."}
            ]
        }
    else:
        # Ask ChatGPT for the output.
        llm = ChatOpenAI(model_name="gpt-3.5-turbo")
        llm_predictor = LLMPredictor(llm=llm)
        service_context = ServiceContext.from_defaults(llm_predictor=llm_predictor)
        index = GPTSimpleVectorIndex.load_from_disk(
            LOCAL_INDEX_FILE, service_context=service_context
        )
        response = index.query(prompt)

        ret_data = {
            "choices": [
                {"text": response.response}
            ]
        }

    print(ret_data)
    return jsonify(ret_data)


if __name__ == "__main__":
    app.run(debug=True, host="localhost", port=8000)
