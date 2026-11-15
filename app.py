import os
import json
import uuid
import csv
import io
from functools import wraps
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, render_template, send_from_directory, Response, session
from flask_cors import CORS
from werkzeug.utils import secure_filename
import database

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg", "webp", "doc", "docx", "txt"}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app, supports_credentials=True)

app.secret_key = os.environ.get("SECRET_KEY", "karthikeyan_portfolio_secret_key_2026_xyz")
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(days=30)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 32 * 1024 * 1024  # 32MB max file size

# Initialize database
database.init_db()
database.seed_karthikeyan_data_if_empty()

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get("user_id"):
            return jsonify({"success": False, "error": "Login required. Please sign in to perform this action."}), 401
        return f(*args, **kwargs)
    return decorated_function

# ==================== AUTHENTICATION ROUTES ====================

@app.route("/api/auth/login", methods=["POST"])
def auth_login():
    data = request.get_json(force=True, silent=True) or request.form.to_dict()
    username = data.get("username") or data.get("email")
    password = data.get("password")

    if not username or not password:
        return jsonify({"success": False, "error": "Username/Email and password required"}), 400

    user = database.verify_user(username, password)
    if not user:
        return jsonify({"success": False, "error": "Invalid username/email or password"}), 401

    session["user_id"] = user["id"]
    session["username"] = user["username"]
    session["name"] = user.get("name")
    session.permanent = True

    return jsonify({
        "success": True,
        "user": user,
        "message": f"Welcome back, {user.get('name') or user['username']}!"
    })

@app.route("/api/auth/logout", methods=["POST"])
def auth_logout():
    session.clear()
    return jsonify({"success": True, "message": "Logged out successfully"})

@app.route("/api/auth/me", methods=["GET"])
def auth_me():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"success": True, "authenticated": False, "user": None})

    user = database.get_user_by_id(user_id)
    if not user:
        session.clear()
        return jsonify({"success": True, "authenticated": False, "user": None})

    return jsonify({"success": True, "authenticated": True, "user": user})

@app.route("/api/auth/change-password", methods=["POST"])
@login_required
def auth_change_password():
    data = request.get_json(force=True, silent=True) or request.form.to_dict()
    current_pass = data.get("current_password")
    new_pass = data.get("new_password")

    if not current_pass or not new_pass:
        return jsonify({"success": False, "error": "Current and new password required"}), 400

    success, msg = database.change_user_password(session["user_id"], current_pass, new_pass)
    if not success:
        return jsonify({"success": False, "error": msg}), 400

    return jsonify({"success": True, "message": msg})

# ==================== MAIN PAGES ====================

@app.route("/")
def dashboard():
    return render_template("index.html")

@app.route("/cv")
def cv_view():
    return render_template("cv.html")

# ==================== DATA API ROUTES ====================

@app.route("/api/stats", methods=["GET"])
def get_stats():
    stats = database.get_stats()
    return jsonify({"success": True, "data": stats})

@app.route("/api/categories", methods=["GET"])
def get_categories():
    categories = database.get_categories()
    return jsonify({"success": True, "data": categories})

@app.route("/api/items", methods=["GET"])
def get_items():
    category = request.args.get("category")
    search = request.args.get("search")
    tag = request.args.get("tag")
    year = request.args.get("year")
    sort_by = request.args.get("sort", "date_desc")

    items = database.get_items(category=category, search=search, tag=tag, year=year, sort_by=sort_by)
    return jsonify({"success": True, "count": len(items), "data": items})

@app.route("/api/items/<int:item_id>", methods=["GET"])
def get_item(item_id):
    item = database.get_item(item_id)
    if not item:
        return jsonify({"success": False, "error": "Item not found"}), 404
    return jsonify({"success": True, "data": item})

@app.route("/api/items", methods=["POST"])
@login_required
def create_item():
    try:
        if request.content_type and "multipart/form-data" in request.content_type:
            data = request.form.to_dict()
            file = request.files.get("file")
            
            if "extra_data" in data and isinstance(data["extra_data"], str):
                try:
                    json.loads(data["extra_data"])
                except Exception:
                    data["extra_data"] = "{}"

            if file and file.filename and allowed_file(file.filename):
                original_filename = secure_filename(file.filename)
                ext = original_filename.rsplit(".", 1)[1].lower()
                unique_name = f"{uuid.uuid4().hex[:12]}_{original_filename}"
                saved_path = os.path.join(app.config["UPLOAD_FOLDER"], unique_name)
                file.save(saved_path)
                
                data["file_path"] = f"uploads/{unique_name}"
                data["file_name"] = original_filename
                data["file_size"] = os.path.getsize(saved_path)
                data["file_type"] = ext
        else:
            data = request.get_json(force=True)

        if not data.get("title") or not data.get("category"):
            return jsonify({"success": False, "error": "Title and Category are required"}), 400

        item = database.create_item(data)
        return jsonify({"success": True, "data": item, "message": "Credential added successfully!"}), 201

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/items/<int:item_id>", methods=["PUT", "POST"])
@login_required
def update_item(item_id):
    try:
        existing = database.get_item(item_id)
        if not existing:
            return jsonify({"success": False, "error": "Item not found"}), 404

        if request.content_type and "multipart/form-data" in request.content_type:
            data = request.form.to_dict()
            file = request.files.get("file")
            
            if file and file.filename and allowed_file(file.filename):
                if existing.get("file_path"):
                    old_path = os.path.join(BASE_DIR, existing["file_path"])
                    if os.path.exists(old_path):
                        try:
                            os.remove(old_path)
                        except Exception:
                            pass

                original_filename = secure_filename(file.filename)
                ext = original_filename.rsplit(".", 1)[1].lower()
                unique_name = f"{uuid.uuid4().hex[:12]}_{original_filename}"
                saved_path = os.path.join(app.config["UPLOAD_FOLDER"], unique_name)
                file.save(saved_path)
                
                data["file_path"] = f"uploads/{unique_name}"
                data["file_name"] = original_filename
                data["file_size"] = os.path.getsize(saved_path)
                data["file_type"] = ext
            elif request.form.get("remove_file") == "true":
                if existing.get("file_path"):
                    old_path = os.path.join(BASE_DIR, existing["file_path"])
                    if os.path.exists(old_path):
                        try:
                            os.remove(old_path)
                        except Exception:
                            pass
                data["file_path"] = None
                data["file_name"] = None
                data["file_size"] = 0
                data["file_type"] = None
        else:
            data = request.get_json(force=True)

        updated = database.update_item(item_id, data)
        return jsonify({"success": True, "data": updated, "message": "Credential updated successfully!"})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/items/<int:item_id>", methods=["DELETE"])
@login_required
def delete_item(item_id):
    success = database.delete_item(item_id)
    if not success:
        return jsonify({"success": False, "error": "Item not found"}), 404
    return jsonify({"success": True, "message": "Credential removed successfully!"})

@app.route("/uploads/<path:filename>")
def serve_upload(filename):
    # Only authenticated users or public items can access files
    safe_name = os.path.basename(filename)
    return send_from_directory(app.config["UPLOAD_FOLDER"], safe_name)

@app.route("/api/export/csv", methods=["GET"])
def export_csv():
    items = database.get_items(sort_by="category")
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    headers = [
        "ID", "Category", "Subcategory", "Title", "Organization / Issuer / Journal / Conf",
        "Year", "Date", "Identifier (DOI / ISBN / Patent / Roll)", "Score / Grade / Impact Factor",
        "Authors / Role", "URL / Link", "Tags", "Description", "Certificate Attached"
    ]
    writer.writerow(headers)
    
    for item in items:
        tags = ", ".join(item.get("tags_list", []))
        has_cert = "Yes" if item.get("file_path") else "No"
        writer.writerow([
            item.get("id"),
            item.get("category_label", item.get("category")),
            item.get("subcategory") or "",
            item.get("title") or "",
            item.get("issuer_or_org") or "",
            item.get("year") or "",
            item.get("event_date") or "",
            item.get("identifier") or "",
            item.get("score_or_grade") or "",
            item.get("role_or_authors") or "",
            item.get("url") or "",
            tags,
            item.get("description") or "",
            has_cert
        ])
    
    output.seek(0)
    filename = f"Karthikeyan_Portfolio_Export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@app.route("/api/export/json", methods=["GET"])
def export_json():
    items = database.get_items(sort_by="date_desc")
    categories = database.get_categories()
    stats = database.get_stats()
    
    data = {
        "exported_at": datetime.now().isoformat(),
        "stats": stats,
        "categories": categories,
        "items": items
    }
    
    json_str = json.dumps(data, indent=2)
    filename = f"Karthikeyan_Portfolio_Backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    return Response(
        json_str,
        mimetype="application/json",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@app.route("/api/import/json", methods=["POST"])
@login_required
def import_json():
    try:
        if "file" in request.files:
            file = request.files["file"]
            content = json.load(file)
        else:
            content = request.get_json(force=True)

        items = content.get("items", [])
        imported_count = 0
        for item in items:
            item_data = {
                "category": item.get("category", "other"),
                "subcategory": item.get("subcategory"),
                "title": item.get("title"),
                "issuer_or_org": item.get("issuer_or_org"),
                "year": item.get("year"),
                "event_date": item.get("event_date"),
                "end_date": item.get("end_date"),
                "identifier": item.get("identifier"),
                "score_or_grade": item.get("score_or_grade"),
                "role_or_authors": item.get("role_or_authors"),
                "url": item.get("url"),
                "tags": item.get("tags_list", item.get("tags", [])),
                "description": item.get("description"),
                "file_path": None,
                "file_name": None,
                "file_size": 0,
                "file_type": None,
                "extra_data": item.get("extra_obj", item.get("extra_data", {}))
            }
            if item_data["title"]:
                database.create_item(item_data)
                imported_count += 1

        return jsonify({"success": True, "message": f"Successfully imported {imported_count} credentials!"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == "__main__":
    PORT = int(os.environ.get("PORT", 5050))
    print("=" * 65)
    print(f" Prof. Karthikeyan S. - Academic & Certificate Dashboard")
    print(f" Running live at: http://127.0.0.1:{PORT}")
    print(" Default Login: admin / admin (or link2karthikcse@gmail.com)")
    print("=" * 65)
    app.run(host="0.0.0.0", port=PORT, debug=True)
