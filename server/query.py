import os
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

CHROMA_DIR = "./chromadb_store"
client = Groq(api_key=os.getenv("GROQ_API_KEY"))
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

def answer_question(question: str, filename: str):
    collection_name = filename.replace(".pdf", "").replace(" ", "_")

    vectorstore = Chroma(
        collection_name=collection_name,
        embedding_function=embeddings,
        persist_directory=CHROMA_DIR
    )

    docs = vectorstore.similarity_search(question, k=4)
    context = "\n\n".join([doc.page_content for doc in docs])

    prompt = f"""You are MediQuery, a helpful medical document assistant.
Use the following document excerpts to answer the question in plain simple English.
No jargon. Be clear and friendly. End with a reminder to consult a doctor.

Document excerpts:
{context}

Question: {question}
Answer:"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}]
    )

    return response.choices[0].message.content