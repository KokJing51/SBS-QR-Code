# rag_ingest.py
import os
import pandas as pd
import chromadb
from sentence_transformers import SentenceTransformer

# 1️⃣  Load embedding model
print("Loading embedding model...")
model = SentenceTransformer("all-MiniLM-L6-v2")

# 2️⃣  Create / connect to local ChromaDB
persist_dir = "chroma_store"
client = chromadb.PersistentClient(path=persist_dir)
collection = client.get_or_create_collection(name="salon_kb")

# 3️⃣  Helper to load and add CSV data
def ingest_csv(file_path, source_name):
    df = pd.read_csv(file_path)
    print(f"Ingesting {len(df)} rows from {source_name} ...")

    # Flatten each row into a simple text string
    texts = []
    metadatas = []
    for i, row in df.iterrows():
        text = " | ".join([f"{col}: {str(row[col])}" for col in df.columns])
        texts.append(text)
        metadatas.append({"source": source_name, "row": i})

    # Generate embeddings
    embeddings = model.encode(texts, show_progress_bar=True)

    # Add to Chroma
    ids = [f"{source_name}_{i}" for i in range(len(texts))]
    collection.add(documents=texts, embeddings=embeddings, ids=ids, metadatas=metadatas)
    print(f"✅ Done adding {source_name}!")

# 4️⃣  Ingest all CSVs
csv_files = [
    ("services_aliases_expanded.csv", "services"),
    ("services_full.csv", "services"), 
    ("salon_kb_staffs.csv", "staffs"),
    ("salon_kb_hours.csv", "hours"),
    ("policies.csv", "policies"),
    ("salon_kb_faq.csv", "faq"),

]

for path, name in csv_files:
    if os.path.exists(path):
        ingest_csv(path, name)
    else:
        print(f"⚠️ Skipped {name}: file not found")

print("🎉 Ingestion complete! Embeddings stored in ./chroma_store/")
