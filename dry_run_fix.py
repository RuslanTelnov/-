import os
import sys
import json
from dotenv import load_dotenv

# Add paths
sys.path.append(os.path.abspath('temp_tlnv_parser/velveto-app/automation/kaspi'))
sys.path.append(os.path.abspath('temp_tlnv_parser/velveto-app/automation/kaspi/modules'))

from modules.category_mapper import KaspiCategoryMapper

def test_cache_mapping():
    print("--- Testing classification cache ---")
    mapper = KaspiCategoryMapper()
    
    # Check if cache is loaded
    mapper._load_cache()
    if not mapper._cache:
        print("❌ ERROR: Cache not loaded!")
        return

    # Test Case 1: AEON массажная расческа 25 см
    name = "AEON массажная расческа 25 см"
    print(f"Testing: {name}")
    cat, cat_type = mapper.detect_category(name)
    print(f"Result: {cat} ({cat_type})")
    
    if cat == "Master - Massage combs":
        print("✅ SUCCESS: Correct category from cache.")
    else:
        print(f"❌ FAILED: Unexpected category: {cat}")

    # Test Case 2: Christian Dior (should still map from cache if in it)
    name = "Christian Dior Addict Eau Fraiche Кристиан Диор Аддикт"
    # Wait, check if I added it to the cache... 
    # Actually I classified it from logs earlier.
    # Let me use one from the export I specifically mapped.
    name = "Borofone BH72"
    print(f"\nTesting: {name}")
    cat, cat_type = mapper.detect_category(name)
    print(f"Result: {cat} ({cat_type})")
    # Test Case 4: Name Integrity Check
    from create_from_ms_v2 import check_name_integrity
    test_ms = "AEON массажная расческа 25 см"
    test_wb_bad = "Тетрадь А5 48 л. АЛЬТ скоба клетка глянц"
    test_wb_good = "Массажная расческа AEON"
    
    print(f"\nTesting integrity check (Should be False): {check_name_integrity(test_ms, test_wb_bad)}")
    print(f"Testing integrity check (Should be True): {check_name_integrity(test_ms, test_wb_good)}")

    # Test Case 5: Name hint mapping
    from create_from_wb import map_wb_to_kaspi
    print("\n--- Testing map_wb_to_kaspi with name_hint ---")
    wb_data = {
        "id": 106172714,
        "name": "Тетрадь А5 48 л. АЛЬТ скоба клетка глянц",
        "description": "Some description",
        "attributes": {}
    }
    # Passing the MS name as hint should trigger the cache
    res = map_wb_to_kaspi(wb_data, name_hint="AEON массажная расческа 25 см")
    print(f"Result Category: {res.get('category_name')}")
    if res.get('category_name') == "Master - Massage combs":
        print("✅ SUCCESS: Name hint correctly triggered cache.")
    else:
        print("❌ FAILED: Name hint did not trigger cache.")

if __name__ == "__main__":
    test_cache_mapping()
