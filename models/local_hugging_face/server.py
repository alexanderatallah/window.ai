"""Example server definition for deploying Huggingface models to a local endpoint.
Sets up the /completions endpoint which (broadly) conforms to what's described
in the link below.
https://github.com/alexanderatallah/window.ai#-local-model-setup

Main thing to note in this file is the `import_and_return` functions which download the
Huggingface model and return the necessary components to use it.
This connector function is stored in the `CONNECTED_MODELS` dictionary.
"""
from flask import Flask, jsonify, request
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from transformers import BertTokenizer, BertForSequenceClassification
from transformers import pipeline

app = Flask(__name__)


"""Connector functions."""

def import_and_return_tk_instruct_3b_def():
    """Example import function for Huggingface model. Returns model, tokenizer,
    and code for running the model."""
    tokenizer = AutoTokenizer.from_pretrained("allenai/tk-instruct-3b-def")
    model = AutoModelForSeq2SeqLM.from_pretrained("allenai/tk-instruct-3b-def")

    def model_fn(model, string, tokenizer):
        input_ids = tokenizer.encode(string, return_tensors="pt")
        output = model.generate(input_ids, max_length=10)
        output = tokenizer.decode(output[0], skip_special_tokens=True)
        return output

    return model, tokenizer, model_fn


def import_and_return_finbert_tone():
    """Imports https://huggingface.co/yiyanghkust/finbert-tone."""
    finbert = BertForSequenceClassification.from_pretrained('yiyanghkust/finbert-tone', num_labels=3)
    tokenizer = BertTokenizer.from_pretrained('yiyanghkust/finbert-tone')

    def model_fn(model, string, tokenizer):
        nlp = pipeline("sentiment-analysis", model=model, tokenizer=tokenizer)
        return nlp([string])

    return finbert, tokenizer, model_fn



CONNECTED_MODELS = {
    "allenai/tk-instruct-3b-def": import_and_return_tk_instruct_3b_def,
    "yiyanghkust/finbert-tone": import_and_return_finbert_tone,
}


"""Endpoint."""

@app.route("/completions", methods=["POST"])
def completions():
    """The completions endpoint."""
    # Get the request data.
    data = request.get_json()
    model = data.get("model", "yiyanghkust/finbert-tone")
    prompt = data["prompt"]
    # max_tokens = data["max_tokens"]  # Unused.
    # temperature = data["temperature"]  # Unused.
    # stop = data["stop"]
    # stream = False

    # Figure out which model to import and import it.
    if model not in CONNECTED_MODELS:
        return jsonify({"error": f"Could not find model {model}."})

    get_model_fn = CONNECTED_MODELS[model]
    model, tokenizer, model_fn = get_model_fn()

    # Make a prediction.
    prediction = model_fn(model, prompt, tokenizer)

    # Return the prediction as a JSON object.
    ret_data = {
        "choices": [
            {"text": str(prediction)}
        ]
    }
    print(ret_data)

    return jsonify(ret_data)


if __name__ == "__main__":
    app.run(debug=True, host="localhost", port=8000)
