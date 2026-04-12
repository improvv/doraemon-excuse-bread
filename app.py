from flask import Flask, render_template, jsonify, request
from pymongo import MongoClient
from datetime import datetime
import os

app_dir = os.path.dirname(os.path.abspath(__file__))

app = Flask(
    __name__,
    template_folder=app_dir,
    static_folder=app_dir,
    static_url_path=''
)

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME", "animal_league")

try:
    if not MONGO_URI:
        raise ValueError("MONGO_URI is not set")

    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    client.server_info()  # 실제 연결 확인
    db = client[DB_NAME]
    rankings_collection = db["rankings"]
    rankings_collection.create_index([("score", -1), ("date", -1)])
    print("MongoDB 연결 성공")
except Exception as e:
    print(f"MongoDB 연결 실패: {e}")
    rankings_collection = None


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

    data = request.get_json() or {}
    nickname = str(data.get("nickname", "")).strip()
    score = data.get("score", 0)

    if not nickname:
        return jsonify({"success": False, "error": "Invalid nickname"}), 400

    try:
        score = int(score)
    except (TypeError, ValueError):
        return jsonify({"success": False, "error": "Invalid score"}), 400

    if score < 0:
        return jsonify({"success": False, "error": "Invalid score"}), 400

    try:
        rankings_collection.insert_one({
            "nickname": nickname,
            "score": score,
            "date": datetime.utcnow()
        })
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/ranking/get", methods=["GET"])
def get_rankings():
    if rankings_collection is None:
        return jsonify({"success": False, "rankings": []}), 500

    try:
        rankings = list(rankings_collection.find().sort("score", -1).limit(10))
        result = []
        for rank in rankings:
            result.append({
                "_id": str(rank.get("_id")),
                "nickname": rank.get("nickname", ""),
                "score": rank.get("score", 0),
                "date": rank.get("date").strftime("%Y-%m-%d %H:%M:%S") if rank.get("date") else ""
            })
        return jsonify({"success": True, "rankings": result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e), "rankings": []}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)))