from flask import Flask, render_template, jsonify, request
from pymongo import MongoClient
from datetime import datetime
from dotenv import load_dotenv
import os

load_dotenv()

app_dir = os.path.dirname(os.path.abspath(__file__))

app = Flask(
    __name__,
    template_folder=app_dir,
    static_folder=app_dir,
    static_url_path=''
)

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME", "animal_league")

print("=== ENV CHECK ===")
print("MONGO_URI exists:", bool(MONGO_URI))
print("DB_NAME:", DB_NAME)
print("=================")

try:
    if not MONGO_URI:
        raise ValueError("MONGO_URI is not set")

    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    client.server_info()  # 실제 연결 확인

    print("Connected databases:", client.list_database_names())

    db = client[DB_NAME]
    rankings_collection = db["rankings"]

    print("Using DB:", db.name)
    print("Using collection:", rankings_collection.name)
    print("Current document count:", rankings_collection.count_documents({}))

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
        print("save 실패: rankings_collection is None")
        return jsonify({"success": False, "error": "Database connection failed"}), 500

    data = request.get_json() or {}
    print("save request raw:", data)

    nickname = str(data.get("nickname", "")).strip()
    score = data.get("score", 0)

    if not nickname:
        print("save 실패: nickname 없음")
        return jsonify({"success": False, "error": "Invalid nickname"}), 400

    try:
        score = int(score)
    except (TypeError, ValueError):
        print("save 실패: score 형변환 실패", score)
        return jsonify({"success": False, "error": "Invalid score"}), 400

    if score < 0:
        print("save 실패: 음수 score", score)
        return jsonify({"success": False, "error": "Invalid score"}), 400

    try:
        result = rankings_collection.insert_one({
            "nickname": nickname,
            "score": score,
            "date": datetime.utcnow()
        })
        print("save 성공, inserted_id:", result.inserted_id)
        print("저장 후 문서 수:", rankings_collection.count_documents({}))
        return jsonify({"success": True})
    except Exception as e:
        print("랭킹 저장 실패:", repr(e))
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/ranking/get", methods=["GET"])
def get_rankings():
    print("### get_rankings route hit ###")
    if rankings_collection is None:
        print("get 실패: rankings_collection is None")
        return jsonify({"success": False, "rankings": []}), 500

    try:
        print("조회 대상 문서 수:", rankings_collection.count_documents({}))
        rankings = list(rankings_collection.find().sort("score", -1).limit(10))
        print("raw rankings:", rankings)

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
                "nickname": rank.get("nickname", ""),
                "score": int(rank.get("score", 0)),
                "date": date_str
            })

        print("가공 후 rankings:", result)
        return jsonify({"success": True, "rankings": result})

    except Exception as e:
        print("랭킹 조회 실패:", repr(e))
        return jsonify({"success": False, "error": str(e), "rankings": []}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5050)))