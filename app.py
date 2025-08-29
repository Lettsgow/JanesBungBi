from flask import Flask, render_template, request, jsonify
from math import floor
import math

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.post("/calculate")
def calculate():
    # Request JSON format:
    # {
    #   "unit": 100,
    #       #   "round_amounts": [a1,a2,a3,a4],
    #   "people": [
    #     {"name": "홍길동", "attend": [true,false,true,false]},
    #     ...
    #   ]
    # }
    data = request.get_json(force=True, silent=True) or {}
    unit = int(data.get("unit", 100))
    round_amounts = data.get("round_amounts", [0,0,0,0])
    people = data.get("people", [])

    round_amounts = (round_amounts + [0,0,0,0])[:4]

    names = [p.get("name","").strip() for p in people]
    attendance = [p.get("attend", [False,False,False,False])[:4] for p in people]

    per_person_raw = [0.0 for _ in people]
    grand_total = sum(round_amounts)

    for j in range(4):
        amt = float(round_amounts[j] or 0)
        if amt <= 0:
            continue
        group = [i for i, p in enumerate(people) if j < len(attendance[i]) and bool(attendance[i][j])]
        if len(group) == 0:
            continue
        share = amt / len(group)
        for i in group:
            per_person_raw[i] += share

    
# Always ceil to the given unit; totals may not match grand_total by design
def ceil_to_unit(x, u):
    if u <= 1:
        return int(math.ceil(x))
    q = x / u
    return int(math.ceil(q) * u)
final = [ceil_to_unit(v, unit) for v in per_person_raw]


    results = []
    for i, p in enumerate(people):
        labels = []
        for j, flag in enumerate(attendance[i]):
            if flag and j < 4:
                labels.append(f"{j+1}차")
        results.append({
            "name": names[i] if names[i] else f"참가자{i+1}",
            "attended": ", ".join(labels),
            "raw_sum": round(per_person_raw[i]),
            "final_sum": int(final[i]),
        })

    results.sort(key=lambda r: r["name"])

    per_round = []
    for j in range(4):
        group_cnt = sum(1 for i in range(len(people)) if j < len(attendance[i]) and attendance[i][j])
        per_round.append({
            "round_label": f"{j+1}차",
            "amount": int(round_amounts[j] or 0),
            "count": int(group_cnt),
        })

    return jsonify({"grand_total": int(grand_total), "grand_final_total": int(sum(final)),
        "per_round": per_round,
        "results": results,
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
