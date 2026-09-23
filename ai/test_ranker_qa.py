"""
StyleMate QA Verification Suite: Tests 1, 2, and 3
Agent 3 (Tester / QA Verifier)

Tests:
1. Python Parity & Accuracy Test
2. Edge Case Robustness Test
3. Benchmark Test (Inference < 15ms & Speedup Analysis)
"""

import os
import sys
import time
import json
import statistics
import pandas as pd

# Add paths for imports
AI_DIR = os.path.dirname(os.path.abspath(__file__))
RULE_ENGINE_DIR = os.path.join(AI_DIR, "rule-engine")
sys.path.append(AI_DIR)
sys.path.append(RULE_ENGINE_DIR)

from ranker import rank_outfits, score_outfit, MODEL
from feature_extractor import extract_features
from fake_wardrobe_generator import CLOTHING_CATALOG
from clothing_filter import filter_clothes
from outfit_generator import group_clothes_by_slot, generate_outfits


def old_rank_outfits(outfits, weather, user_preferences, user_history):
    """
    Original sequential rank_outfits behavior before vectorized batching.
    Loops through each outfit, computes single-row DataFrame, predicts,
    and sorts descending by score.
    """
    ranked_outfits = []
    for outfit in outfits:
        result = score_outfit(
            outfit,
            weather,
            user_preferences,
            user_history
        )
        ranked_outfits.append(result)

    ranked_outfits.sort(
        key=lambda x: x["score"],
        reverse=True
    )
    return ranked_outfits


def run_test_1_parity():
    print("=" * 75)
    print("TEST 1: Python Parity & Accuracy Test")
    print("=" * 75)

    # Load User 7 real wardrobe if available
    user7_path = os.path.join(AI_DIR, "user7_wardrobe.json")
    user7_wardrobe = []
    if os.path.exists(user7_path):
        with open(user7_path, "r") as f:
            user7_wardrobe = json.load(f)

    test_scenarios = [
        {
            "name": "Scenario A: Catalog Summer Casual (72 candidate outfits)",
            "source": "catalog",
            "wardrobe": CLOTHING_CATALOG,
            "season": "summer",
            "occasion": "casual",
            "prefs": {"occasion": "casual", "preferred_style": "casual", "preferred_color": "white"},
            "weather": {"season": "summer", "temperature": 28, "condition": "sunny"},
            "history": {"average_rating": 4.2, "times_worn": 12},
        },
        {
            "name": "Scenario B: Catalog Summer Party (84 candidate outfits)",
            "source": "catalog",
            "wardrobe": CLOTHING_CATALOG,
            "season": "summer",
            "occasion": "party",
            "prefs": {"occasion": "party", "preferred_style": "formal", "preferred_color": "black"},
            "weather": {"season": "summer", "temperature": 26, "condition": "clear"},
            "history": {"average_rating": 4.8, "times_worn": 5},
        },
        {
            "name": "Scenario C: Catalog Winter Casual (72 candidate outfits)",
            "source": "catalog",
            "wardrobe": CLOTHING_CATALOG,
            "season": "winter",
            "occasion": "casual",
            "prefs": {"occasion": "casual", "preferred_style": "casual", "preferred_color": "blue"},
            "weather": {"season": "winter", "temperature": 10, "condition": "cloudy"},
            "history": {"average_rating": 3.9, "times_worn": 8},
        },
    ]

    if user7_wardrobe:
        test_scenarios.append({
            "name": "Scenario D: Real User 7 Wardrobe Summer Casual (42 candidate outfits)",
            "source": "user7",
            "wardrobe": user7_wardrobe,
            "season": "summer",
            "occasion": "casual",
            "prefs": {"occasion": "casual", "preferred_style": "casual", "preferred_color": "beige"},
            "weather": {"season": "summer", "temperature": 25, "condition": "sunny"},
            "history": {"average_rating": 4.0, "times_worn": 5},
        })

    total_outfits_tested = 0

    for sc in test_scenarios:
        print(f"\n--- Running {sc['name']} ---")
        if sc["source"] == "user7":
            filtered = filter_clothes(
                clothes=sc["wardrobe"],
                selected_season=sc["season"],
                selected_occasions=[sc["occasion"]] if sc["occasion"] else []
            )
            grouped = group_clothes_by_slot(filtered)
        else:
            grouped = group_clothes_by_slot(sc["wardrobe"])

        outfits = generate_outfits(grouped, selected_season=sc["season"], selected_occasion=sc["occasion"])
        outfit_count = len(outfits)
        print(f"Candidate outfits generated: {outfit_count}")
        assert outfit_count > 0, f"No outfits generated for {sc['name']}"
        total_outfits_tested += outfit_count

        old_res = old_rank_outfits(outfits, sc["weather"], sc["prefs"], sc["history"])
        new_res = rank_outfits(outfits, sc["weather"], sc["prefs"], sc["history"])

        # Assertion 1: Same outfit count
        assert len(old_res) == len(new_res), f"Count mismatch: old={len(old_res)}, new={len(new_res)}"

        # Assertion 2: Individual outfit scores match to 4 decimal places
        max_diff = 0.0
        for i in range(len(old_res)):
            old_score = old_res[i]["score"]
            new_score = new_res[i]["score"]
            diff = abs(old_score - new_score)
            if diff > max_diff:
                max_diff = diff
            assert diff < 1e-4, f"Score mismatch at index {i}: old={old_score}, new={new_score}, diff={diff}"

        # Assertion 3: Outfit ranking order identical
        for i in range(len(old_res)):
            assert old_res[i]["outfit"] == new_res[i]["outfit"], (
                f"Ranking order mismatch at index {i}!\n"
                f"Old outfit: {old_res[i]['outfit']}\n"
                f"New outfit: {new_res[i]['outfit']}"
            )

        print(f"  ✔ Outfits evaluated: {outfit_count}")
        print(f"  ✔ Score parity verified: individual scores match to 4 decimal places (max diff = {max_diff:.6f})")
        print(f"  ✔ Ranking order parity verified: 100% identical sequence")

    print(f"\n[TEST 1 FINAL VERDICT]: PASS ({total_outfits_tested} total candidate outfits verified across {len(test_scenarios)} realistic scenarios)")
    return True


def run_test_2_edge_cases():
    print("\n" + "=" * 75)
    print("TEST 2: Edge Case Robustness Test")
    print("=" * 75)

    weather = {"season": "summer", "temperature": 30, "condition": "sunny"}
    prefs = {"occasion": "casual", "preferred_style": "casual", "preferred_color": "blue"}
    history = {"average_rating": 4.0, "times_worn": 1}

    # Edge Case 1: Empty list
    print("\n--- Subtest 2.1: Calling rank_outfits([], weather, prefs, history) ---")
    res_empty = rank_outfits([], weather, prefs, history)
    assert res_empty == [], f"Expected [], got {res_empty}"
    assert isinstance(res_empty, list), f"Expected list type, got {type(res_empty)}"
    print(f"  Returned value: {res_empty}")
    print("  ✔ PASS: rank_outfits([], ...) safely returned [] without error or IndexError.")

    # Edge Case 2: Single outfit
    print("\n--- Subtest 2.2: Calling rank_outfits([single_outfit], weather, prefs, history) ---")
    single_outfit = {
        "upper_body": {
            "name": "White T-Shirt",
            "category": "Top",
            "colors": ["white"],
            "styles": ["casual"],
            "occasions": ["casual"],
            "seasons": ["summer"]
        },
        "lower_body": {
            "name": "Blue Denim Jeans",
            "category": "Bottom",
            "colors": ["blue"],
            "styles": ["casual"],
            "occasions": ["casual"],
            "seasons": ["summer"]
        },
        "full_body": None,
        "footwear": {
            "name": "White Sneakers",
            "category": "Footwear",
            "colors": ["white"],
            "styles": ["casual", "sporty"],
            "occasions": ["casual"],
            "seasons": ["summer"]
        },
        "outerwear": None,
        "accessories": []
    }

    res_single = rank_outfits([single_outfit], weather, prefs, history)
    assert isinstance(res_single, list), f"Expected list, got {type(res_single)}"
    assert len(res_single) == 1, f"Expected length 1, got {len(res_single)}"
    assert "outfit" in res_single[0] and "score" in res_single[0], f"Keys missing: {res_single[0].keys()}"
    assert res_single[0]["outfit"] == single_outfit, "Outfit content mismatch"
    assert isinstance(res_single[0]["score"], float), f"Score is not float: {type(res_single[0]['score'])}"
    assert 0.0 <= res_single[0]["score"] <= 1.0, f"Score out of range: {res_single[0]['score']}"
    print(f"  Returned value: 1 ranked outfit, score = {res_single[0]['score']}")
    print("  ✔ PASS: rank_outfits([single_outfit], ...) returned a list with exactly 1 correctly scored outfit.")

    print("\n[TEST 2 FINAL VERDICT]: PASS (All edge cases handled robustly)")
    return True


def run_test_3_benchmark():
    print("\n" + "=" * 75)
    print("TEST 3: Benchmark Test")
    print("=" * 75)

    grouped = group_clothes_by_slot(CLOTHING_CATALOG)
    outfits = generate_outfits(grouped, selected_season="summer", selected_occasion="casual")
    
    # Ensure outfit count is in 50-100 range
    outfit_count = len(outfits)
    print(f"Benchmark Dataset: {outfit_count} realistic candidate outfits (target range: 50-100)")
    assert 50 <= outfit_count <= 100, f"Expected 50-100 outfits, got {outfit_count}"

    weather = {"season": "summer", "temperature": 28, "condition": "sunny"}
    prefs = {"occasion": "casual", "preferred_style": "casual", "preferred_color": "white"}
    history = {"average_rating": 4.2, "times_worn": 10}

    # Warmup runs
    for _ in range(10):
        _ = rank_outfits(outfits, weather, prefs, history)

    # Measure pure batch inference: MODEL.predict(batch_df)
    feature_rows = [
        extract_features(
            outfit=outfit,
            weather=weather,
            user_preferences=prefs,
            user_history=history
        )
        for outfit in outfits
    ]
    batch_df = pd.DataFrame(feature_rows)

    model_predict_times = []
    for _ in range(100):
        t0 = time.perf_counter()
        _ = MODEL.predict(batch_df)
        t1 = time.perf_counter()
        model_predict_times.append((t1 - t0) * 1000.0)

    # Measure full rank_outfits function (extract features + DataFrame + MODEL.predict + sort)
    full_ranker_times = []
    for _ in range(100):
        t0 = time.perf_counter()
        _ = rank_outfits(outfits, weather, prefs, history)
        t1 = time.perf_counter()
        full_ranker_times.append((t1 - t0) * 1000.0)

    # Measure baseline: old sequential rank_outfits
    old_ranker_times = []
    for _ in range(10):
        t0 = time.perf_counter()
        _ = old_rank_outfits(outfits, weather, prefs, history)
        t1 = time.perf_counter()
        old_ranker_times.append((t1 - t0) * 1000.0)

    avg_inference = statistics.mean(model_predict_times)
    min_inference = min(model_predict_times)
    max_inference = max(model_predict_times)
    p95_inference = statistics.quantiles(model_predict_times, n=20)[18]  # 95th percentile

    avg_full = statistics.mean(full_ranker_times)
    min_full = min(full_ranker_times)
    max_full = max(full_ranker_times)
    p95_full = statistics.quantiles(full_ranker_times, n=20)[18]

    avg_old = statistics.mean(old_ranker_times)

    speedup_full = avg_old / avg_full
    speedup_inference = avg_old / avg_inference

    print(f"\n--- Timing Results (over 100 iterations on {outfit_count} outfits) ---")
    print(f"1. Pure Vectorized ML Inference (`MODEL.predict(batch_df)`):")
    print(f"   • Min:  {min_inference:.3f} ms")
    print(f"   • Mean: {avg_inference:.3f} ms")
    print(f"   • P95:  {p95_inference:.3f} ms")
    print(f"   • Max:  {max_inference:.3f} ms")
    print(f"   • Target Threshold: < 15.000 ms")

    print(f"\n2. Full `rank_outfits()` Execution (Feature Extraction + Batch DF + Predict + Sort):")
    print(f"   • Min:  {min_full:.3f} ms")
    print(f"   • Mean: {avg_full:.3f} ms")
    print(f"   • P95:  {p95_full:.3f} ms")
    print(f"   • Max:  {max_full:.3f} ms")

    print(f"\n3. Old Sequential `rank_outfits()` Baseline:")
    print(f"   • Mean: {avg_old:.3f} ms")

    print(f"\n4. Speedup Factor:")
    print(f"   • Full pipeline speedup: {speedup_full:.1f}x faster")
    print(f"   • Vectorized inference vs sequential: {speedup_inference:.1f}x faster")

    # Hard assertion: inference must execute in under 15ms
    assert avg_inference < 15.0, f"Benchmark FAILED: Inference took {avg_inference:.3f}ms (threshold: 15ms)"
    assert p95_inference < 15.0, f"Benchmark FAILED: P95 inference took {p95_inference:.3f}ms (threshold: 15ms)"
    assert avg_full < 15.0, f"Benchmark FAILED: Full rank_outfits took {avg_full:.3f}ms (threshold: 15ms)"

    print(f"\n✔ Hard Assertion Passed: Inference ({avg_inference:.3f}ms avg, {p95_inference:.3f}ms P95) executes in under 15ms!")
    print(f"✔ Full function execution ({avg_full:.3f}ms avg, {p95_full:.3f}ms P95) also executes in under 15ms!")
    print(f"[TEST 3 FINAL VERDICT]: PASS")
    return True


if __name__ == "__main__":
    t_start = time.time()
    t1_ok = run_test_1_parity()
    t2_ok = run_test_2_edge_cases()
    t3_ok = run_test_3_benchmark()

    total_time = (time.time() - t_start) * 1000.0
    print("\n" + "=" * 75)
    print(f"ALL PYTHON QA TESTS (1, 2, 3) COMPLETED SUCCESSFULLY in {total_time:.1f}ms")
    print("=" * 75)
