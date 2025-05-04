from flask import Flask, render_template, url_for, redirect, request, session, jsonify
import sys
import os

# Add the parent directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import your Flask app
from app import app as flask_app

# This is the Vercel serverless function entry point
@flask_app.route('/', defaults={'path': ''})
@flask_app.route('/<path:path>')
def catch_all(path):
    if path == "":
        # Redirect to start page when the root URL is accessed
        return redirect(url_for('start'))
    return flask_app.dispatch_request()

# Export the Flask app as "app" for Vercel
app = flask_app
