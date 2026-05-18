import fitz
import os
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

CHROMA_DIR = "./chromadb_store"

embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

def ingest_pdf(file_bytes: bytes, filename: str):
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    full_text = ""
    for page in doc:
        full_text += page.get_text()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50
    )
    chunks = splitter.split_text(full_text)

    collection_name = filename.replace(".pdf", "").replace(" ", "_")

    vectorstore = Chroma.from_texts(
        texts=chunks,
        embedding=embeddings,
        collection_name=collection_name,
        persist_directory=CHROMA_DIR
    )

    return {"message": f"Ingested {len(chunks)} chunks from {filename}", "collection": collection_name}