from collections import defaultdict, deque
from datetime import datetime, timedelta
import os
import re

from flask import Flask, jsonify, render_template, request
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 1024

MAX_NICKNAME_LENGTH = 10
NICKNAME_PATTERN = re.compile(r"^[0-9A-Za-z가-힣 _-]{1,10}$")
ALLOWED_DIFFICULTIES = {"easy", "normal", "hard"}
SAVE_RATE_LIMIT = 10
SAVE_RATE_WINDOW = timedelta(minutes=1)
save_attempts = defaultdict(deque)

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME", "animal_league")

try:
    if not MONGO_URI:
        raise ValueError("MONGO_URI is not set")

    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    client.server_info()

    db = client[DB_NAME]
    rankings_collection = db["rankings"]

    rankings_collection.create_index([("score", -1), ("date", -1)])
    app.logger.info("MongoDB connection established")

except Exception as e:
    app.logger.warning("MongoDB connection failed: %s", e)
    rankings_collection = None


def _is_allowed_origin():
    origin = request.headers.get("Origin")
    if not origin:
        return True

    expected_origin = request.host_url.rstrip("/")
    return origin.rstrip("/") == expected_origin


def _get_client_ip():
    forwarded_for = request.headers.get("X-Forwarded-For", "")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.remote_addr or "unknown"


def _is_rate_limited(ip_address):
    now = datetime.utcnow()
    attempts = save_attempts[ip_address]

    while attempts and now - attempts[0] > SAVE_RATE_WINDOW:
        attempts.popleft()

    if len(attempts) >= SAVE_RATE_LIMIT:
        return True

    attempts.append(now)
    return False


def _is_valid_nickname(nickname):
    return bool(NICKNAME_PATTERN.fullmatch(nickname))


@app.after_request
def add_security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data:; "
        "font-src 'self'; "
        "connect-src 'self'; "
        "object-src 'none'; "
        "base-uri 'self'; "
        "frame-ancestors 'none'"
    )
    return response


@app.errorhandler(413)
def request_entity_too_large(_error):
    if request.path.startswith("/api/"):
        return jsonify({"success": False, "error": "Request body too large"}), 413
    return render_template("start.html"), 413


@app.route("/")
def index():
    return render_template("start.html")


@app.route("/start")
def start():
    return render_template("start.html")


@app.route("/start.html")
def start_html():
    return render_template("start.html")


@app.route("/game")
def game():
    return render_template("index.html")


@app.route("/index.html")
def index_html():
    return render_template("index.html")


@app.route("/api/ranking/save", methods=["POST"])
def save_ranking():
    if rankings_collection is None:
        return jsonify({"success": False, "error": "Database connection failed"}), 500

    if not _is_allowed_origin():
        return jsonify({"success": False, "error": "Invalid origin"}), 403

    if not request.is_json:
        return jsonify({"success": False, "error": "JSON body required"}), 415

    client_ip = _get_client_ip()
    if _is_rate_limited(client_ip):
        return jsonify({"success": False, "error": "Too many requests"}), 429

    data = request.get_json(silent=True) or {}

    nickname = str(data.get("nickname", "")).strip()
    score = data.get("score", 0)
    difficulty = str(data.get("difficulty", "")).strip().lower()

    if not nickname or len(nickname) > MAX_NICKNAME_LENGTH or not _is_valid_nickname(nickname):
        return jsonify({"success": False, "error": "Invalid nickname"}), 400

    if difficulty not in ALLOWED_DIFFICULTIES:
        return jsonify({"success": False, "error": "Invalid difficulty"}), 400

    try:
        score = int(score)
    except (TypeError, ValueError):
        return jsonify({"success": False, "error": "Invalid score"}), 400

    if score < 0 or score > 5000:
        return jsonify({"success": False, "error": "Invalid score"}), 400

    try:
        rankings_collection.insert_one({
            "nickname": nickname,
            "score": score,
            "difficulty": difficulty,
            "date": datetime.utcnow()
        })
        return jsonify({"success": True})
    except Exception as e:
        app.logger.warning("Ranking save failed: %s", repr(e))
        return jsonify({"success": False, "error": "Failed to save ranking"}), 500


@app.route("/api/ranking/get", methods=["GET"])
def get_rankings():
    if rankings_collection is None:
        return jsonify({"success": False, "rankings": []}), 500

    try:
        rankings = list(rankings_collection.find().sort("score", -1).limit(10))

        result = []
        for rank in rankings:
            raw_date = rank.get("date")

            if isinstance(raw_date, datetime):
                date_str = raw_date.strftime("%Y-%m-%d %H:%M:%S")
            elif raw_date is None:
                date_str = ""
            else:
                date_str = str(raw_date)

            result.append({
                "_id": str(rank.get("_id")),
                "nickname": str(rank.get("nickname", ""))[:MAX_NICKNAME_LENGTH],
                "score": int(rank.get("score", 0)),
                "difficulty": str(rank.get("difficulty", "easy")).lower(),
                "date": date_str
            })

        return jsonify({"success": True, "rankings": result})

    except Exception as e:
        app.logger.warning("Ranking fetch failed: %s", repr(e))
        return jsonify({"success": False, "error": "Failed to load rankings", "rankings": []}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5050)))
