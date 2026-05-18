from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from ingest import ingest_pdf
from query import answer_question
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    contents = await file.read()
    result = ingest_pdf(contents, file.filename)
    return result

@app.post("/ask")
async def ask(payload: dict):
    question = payload.get("question")
    filename = payload.get("filename")
    answer = answer_question(question, filename)
    return {"answer": answer}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)