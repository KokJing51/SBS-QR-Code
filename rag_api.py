# rag_api.py
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import time
import chromadb
from sentence_transformers import SentenceTransformer

# ---------- App setup ----------
app = FastAPI(title="Salon RAG", version="1.0")

# Allow local frontend / other services to call this
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten later if you want
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Load model + Chroma ----------
EMBED_MODEL_NAME = "all-MiniLM-L6-v2"
PERSIST_DIR = "chroma_store"
COLLECTION_NAME = "salon_kb"

model = SentenceTransformer(EMBED_MODEL_NAME)
client = chromadb.PersistentClient(path=PERSIST_DIR)
collection = client.get_or_create_collection(name=COLLECTION_NAME)

# ---------- Schemas ----------
class RetrieveResponse(BaseModel):
    query: str
    k: int
    latency_ms: float
    results: list

# ---------- Routes ----------
@app.get("/health")
def health():
    try:
        # light touch to ensure collection exists
        _ = collection.count()
        return {"status": "ok", "collection": COLLECTION_NAME, "count": _}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/rag/retrieve", response_model=RetrieveResponse)
def retrieve(q: str = Query(..., min_length=1), k: int = 3):
    """
    Semantic similarity search against local Chroma store.
    Returns top-k snippets + latency.
    """
    t0 = time.perf_counter()

    # Encode the query with the same model used at ingestion time
    query_vec = model.encode([q])

    # Query Chroma
    res = collection.query(
        query_embeddings=query_vec,
        n_results=k,
        include=["documents", "metadatas", "distances"],  # distances = smaller is closer
    )

    docs = res.get("documents", [[]])[0]
    metas = res.get("metadatas", [[]])[0]
    dists = res.get("distances", [[]])[0]

    # Package results
    results = []
    for doc, meta, dist in zip(docs, metas, dists):
        results.append({
            "text": doc,
            "distance": float(dist),
            "source": meta.get("source") if isinstance(meta, dict) else None,
            "row": meta.get("row") if isinstance(meta, dict) else None,
            "metadata": meta,
        })

    latency_ms = (time.perf_counter() - t0) * 1000.0
    return RetrieveResponse(query=q, k=k, latency_ms=round(latency_ms, 2), results=results)

# ---------- Local dev entry ----------
# Run with: uvicorn rag_api:app --reload --port 8000
