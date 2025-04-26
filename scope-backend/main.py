from fastapi import FastAPI
from pydantic import BaseModel
import torch
from torch.serialization import safe_globals
from sklearn.preprocessing import LabelEncoder
from transformers import AutoTokenizer, AutoModel # type: ignore
import torch.nn as nn
from contextlib import asynccontextmanager

class MultiTaskModel(nn.Module):
    def __init__(self, num_genres, num_priority):
        super().__init__()
        self.enc = AutoModel.from_pretrained('distilbert-base-uncased')
        h = self.enc.config.hidden_size
        self.drop = nn.Dropout(0.3)
        self.head_cat = nn.Linear(h, num_genres)
        self.head_urg = nn.Linear(h, num_priority)
    def forward(self, input_ids, attention_mask, token_type_ids=None):
        x = self.enc(input_ids, attention_mask=attention_mask)[0][:,0]
        x = self.drop(x)
        return self.head_cat(x), self.head_urg(x)

class PredictRequest(BaseModel):
    text: str

class PredictResponse(BaseModel):
    genre: str
    priority: str

@asynccontextmanager
async def lifespan(app: FastAPI):
    global model, tokenizer, le_cat, le_urg, device
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    with safe_globals([LabelEncoder]):
        ck = torch.load("model/model.pt", map_location=device, weights_only=False)
    le_cat, le_urg = ck['le_cat'], ck['le_urg']
    tokenizer = AutoTokenizer.from_pretrained('distilbert-base-uncased')
    model = MultiTaskModel(len(le_cat.classes_), len(le_urg.classes_))
    model.load_state_dict(ck['state'])
    model.to(device).eval()
    yield

app = FastAPI(lifespan=lifespan)

@app.get("/")
async def root():
    return {"message": "Welcome to the Multi-Task Model API"}

@app.post("/predict", response_model=PredictResponse)
async def predict(req: PredictRequest):
    toks = tokenizer(req.text, return_tensors="pt", truncation=True, padding=True).to(device)
    with torch.no_grad():
        lc, lu = model(**toks)
    g = int(lc.argmax(1).item())
    p = int(lu.argmax(1).item())
    return PredictResponse(genre=le_cat.inverse_transform([g])[0], priority=le_urg.inverse_transform([p])[0])

@app.post("/batch", response_model=list[PredictResponse])
async def batch_predict(req: list[PredictRequest]):
    texts = [r.text for r in req]
    toks = tokenizer(texts, return_tensors="pt", truncation=True, padding=True).to(device)
    with torch.no_grad():
        lc, lu = model(**toks)
    genres = le_cat.inverse_transform(lc.argmax(1).cpu().numpy())
    priorities = le_urg.inverse_transform(lu.argmax(1).cpu().numpy())
    return [PredictResponse(genre=g, priority=p) for g, p in zip(genres, priorities)]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
