# Running Local Hugging Face Models

If you want to run Hugging Face models via Window, you can do so by configuring `server.py` to serve downloaded models up to your endpoint. Currently, no streaming is supported, so the functionality of some apps may be affected.

## Installation

There should only be two requirements for the server (Flask and transformers), though you are welcome to add your own modifications. Simply run:

`pip install -r requirements.txt`.

### Downloading Models

If you are installing models for the first time, it's recommended to download the models ahead of time before using them via the endpoint. Usually, the Hugging Face page for the model will include sample code. For instance, for [finbert-tone](<[url](https://huggingface.co/yiyanghkust/finbert-tone)>), running the following code in your Python console will automatically download the model to your system's cache.

```python
from transformers import BertTokenizer, BertForSequenceClassification
from transformers import pipeline

finbert = BertForSequenceClassification.from_pretrained('yiyanghkust/finbert-tone',num_labels=3)
tokenizer = BertTokenizer.from_pretrained('yiyanghkust/finbert-tone')
```

## Writing Connectors

Because models may have slightly different inference interfaces (e.g., some have tokenizers, some use `transformers`'s `pipeline`), you have to write a little bit of custom logic to serve them up. In the future, there may be better abstractions for this, but in the meantime, two example `import_and_return` functions are shown. You must them save them in the `CONNECTED_MODELS` dict.

```python
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
```

Note that each function returns a tuple of `(model, tokenizer, model_function)`, where model_function is called to get the inference. The `model_function` is usually copied directly from the examples provided on the Hugging Face model page.

And that should be it!
