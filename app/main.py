from fastapi import FastAPI

app = FastAPI()

@app.get("/home")
def get_response():
    return{
        "message": "The project is started"
    }