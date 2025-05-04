from flask import Flask

app = Flask(__name__)

@app.route('/')
def home():
    return "Hello from Flask on Vercel!"

@app.route('/about')
def about():
    return "About page"

# This is the handler Vercel will call
def handler(request):
    return app(request)
