# StyleMate --- Final Recommendation System Specification

## Purpose

This document defines the **final intended architecture and behavior**
for StyleMate's outfit recommendation system.

This specification replaces previous experimental approaches involving
automatic calendar-based season detection, hard Style/Color filtering,
or Preferred Category.

The implementation must preserve all existing working StyleMate
functionality and make the smallest possible changes required.

------------------------------------------------------------------------

# 1. FINAL PRODUCT DESIGN

The Recommendation page should have two required main inputs:

-   **Occasion**
-   **Season**

It should have two optional Advanced Filters:

-   **Preferred Style**
-   **Preferred Color**

There should be **NO Preferred Category filter**.

------------------------------------------------------------------------

# 2. OCCASION

Occasion is a **hard contextual constraint**.

Examples:

-   Casual
-   College
-   Office
-   Party
-   Wedding
-   Cafe

If a clothing item does not satisfy the selected occasion according to
the existing occasion rules, it should not be considered for
recommendation.

Preserve the existing occasion rule engine.

------------------------------------------------------------------------

# 3. SEASON

Season is a **hard contextual constraint**, but it must remain
**manually selected by the user**.

The UI should provide:

-   Summer
-   Winter
-   Spring
-   Autumn

Do NOT automatically replace the user's selected season with the current
calendar season.

## Reason

A user may be:

-   planning a vacation for another season,
-   planning an outfit for a future event,
-   exploring outfits for another season,
-   traveling to a location with different weather.

Therefore, the current calendar month must not silently determine the
recommendation season.

## Important

Do NOT create a new weather system for this task.

Keep the existing weather-related architecture intact unless it is
already required by the current recommendation pipeline.

A future feature may allow users to use current weather, but that is NOT
part of this task.

------------------------------------------------------------------------

# 4. REMOVE PREFERRED CATEGORY

Preferred Category must NOT exist in Advanced Filters.

Do not add category filtering to the recommendation UI.

Category remains an important property of individual wardrobe items and
must continue to be used by the existing outfit-generation logic.

Do NOT remove or modify the existing `ClothingItem.category` field.

------------------------------------------------------------------------

# 5. PREFERRED STYLE

Preferred Style is a **soft preference**, NOT a hard filter.

This is extremely important.

The system must NOT do:

``` text
User selects Casual
        ↓
Delete every clothing item that is not Casual
        ↓
Generate outfit
```

That approach can destroy valid complete outfits.

Instead:

``` text
Occasion + Season
        ↓
Hard-filter eligible clothing
        ↓
Generate complete outfits
        ↓
Evaluate each complete outfit
        ↓
Apply Style preference score
        ↓
Final ranking
```

## Style should be evaluated at outfit level

The system should evaluate the styles of the pieces in the complete
outfit.

Example:

### Outfit A

-   Casual Top
-   Casual Bottom
-   Casual Sneakers

Strong Casual match.

### Outfit B

-   Casual Top
-   Casual Bottom
-   Formal Shoes

Moderate Casual match.

### Outfit C

-   Formal Top
-   Formal Bottom
-   Formal Shoes

Weak Casual match.

If all three satisfy Occasion + Season, they may all remain valid, but:

``` text
A > B > C
```

when the user prefers Casual.

## Style consistency

Do not merely check whether one item contains the requested style.

Prefer outfits where the requested style is represented consistently
across multiple pieces.

The exact scoring implementation should use the existing ranker
architecture and existing score scale.

Do not invent arbitrary weights without inspecting the existing ranker.

------------------------------------------------------------------------

# 6. PREFERRED COLOR

Preferred Color is also a **soft preference**, NOT a hard filter.

The system must NOT do:

``` text
User selects Black
        ↓
Delete every non-black item
```

Instead:

``` text
Generate valid complete outfits
        ↓
Evaluate colors across the complete outfit
        ↓
Reward stronger matches to preferred color
        ↓
Keep valid non-perfect matches
        ↓
Final ranking
```

Example:

### Outfit A

-   Black Dress
-   Black Heels

Strong Black preference match.

### Outfit B

-   Black Top
-   Blue Jeans
-   White Sneakers

Moderate Black preference match.

### Outfit C

-   Pink Dress
-   Silver Heels

Weak Black preference match.

If all satisfy Occasion + Season:

``` text
A > B > C
```

when Black is preferred.

## Existing color compatibility must remain

Preferred Color is NOT the same thing as color compatibility.

The existing color compatibility logic should continue to influence
whether an outfit works well together.

------------------------------------------------------------------------

# 7. STYLE + COLOR TOGETHER

When both preferences are selected:

``` text
Style = Casual
Color = Black
```

the system should favor outfits that satisfy both.

Example:

``` text
Outfit A:
Casual + Black
→ strongest

Outfit B:
Casual + non-black
→ strong

Outfit C:
Non-casual + Black
→ weaker

Outfit D:
Neither
→ weakest
```

Do NOT require every individual clothing item to satisfy both
preferences.

Evaluate the **complete outfit**.

------------------------------------------------------------------------

# 8. HARD CONSTRAINTS VS SOFT PREFERENCES

This distinction must remain clear.

## Hard constraints

These determine eligibility:

-   Occasion
-   Season

## Soft preferences

These influence ranking:

-   Preferred Style
-   Preferred Color

Architecture:

``` text
                    USER
                     │
             Occasion + Season
                     │
                     ▼
          ┌────────────────────┐
          │ HARD CONSTRAINTS   │
          │                    │
          │ Occasion           │
          │ Season             │
          └─────────┬──────────┘
                    │
                    ▼
          Generate complete outfits
                    │
                    ▼
          Existing recommendation
               / compatibility
                  scoring
                    │
                    ▼
          Style preference score
                    +
          Color preference score
                    │
                    ▼
             FINAL SCORE
                    │
                    ▼
             SORT / RERANK
                    │
                    ▼
          Top recommendations
```

------------------------------------------------------------------------

# 9. EXISTING RANKER

Use the existing ranking architecture.

Do NOT replace the recommendation system with a completely new
algorithm.

The conceptual final score should be:

``` text
Final Score =
    Existing Recommendation Score
    + Style Preference Score
    + Color Preference Score
    + Existing Compatibility / Recommendation Factors
```

The exact implementation and weights must be based on the existing
`ranker.py`.

## Critical requirement

After Style and Color preference scores are added:

**the recommendations must be sorted again using the final score.**

Do not add a preference bonus after the final sorting and forget to
re-sort.

------------------------------------------------------------------------

# 10. NO PERFECT MATCH

This is a critical user-experience requirement.

Suppose the user selects:

``` text
Style = Vintage
Color = Purple
```

but their wardrobe contains no perfect Vintage + Purple outfit.

If valid Occasion + Season outfits exist:

**StyleMate must still recommend them.**

It should show the closest valid outfits ranked by preference match.

Do NOT return:

``` text
No matching outfit found
```

just because a soft preference has no perfect match.

"No matching outfit" should be reserved for cases where there are
genuinely no valid complete outfits under the hard constraints.

------------------------------------------------------------------------

# 11. NO ADVANCED FILTERS

If:

``` text
Preferred Style = Any Style
Preferred Color = Any Color
```

then no Style/Color preference bonus should be applied.

The system should behave like the existing recommendation system.

------------------------------------------------------------------------

# 12. COMPLETE OUTFITS

Style and Color preferences must never destroy required outfit slots.

For example:

``` text
Black Dress
White Heels
```

may be a valid outfit even though the preferred color is Black.

Do NOT remove White Heels simply because they are not Black.

The existing outfit generator remains responsible for creating valid
complete outfits.

------------------------------------------------------------------------

# 13. RECOMMENDATION FLOW

Preserve the existing architecture:

``` text
React Recommendation page
        ↓
Node recommendation controller
        ↓
Python recommendation pipeline
        ↓
Occasion + Season hard filtering
        ↓
Existing outfit generation
        ↓
Existing ranking / compatibility logic
        ↓
Style preference scoring
        ↓
Color preference scoring
        ↓
Final sorting / reranking
        ↓
Node.js
        ↓
React
```

Do not replace this architecture.

------------------------------------------------------------------------

# 14. TRY ANOTHER OUTFIT

Preserve the existing Try Another Outfit behavior.

It should continue using the ranked recommendation list.

Do not redesign this feature as part of this task.

------------------------------------------------------------------------

# 15. DISLIKE / FEEDBACK

Do NOT modify the existing:

-   I Don't Like This Recommendation button
-   Feedback modal
-   Feedback reasons
-   Other feedback text
-   Feedback submission
-   Removing rejected recommendations
-   Showing the next recommendation

These systems are already working.

------------------------------------------------------------------------

# 16. WEAR / HISTORY / RATING

Do NOT modify:

-   Wear This Outfit
-   Outfit History
-   Rating
-   Feedback
-   History display

These systems are already working.

------------------------------------------------------------------------

# 17. FUTURE PERSONALIZATION

Do not add this functionality in the current task.

However, the architecture should not prevent future use of:

-   Outfit History
-   Ratings
-   User feedback
-   Disliked outfit combinations
-   User preferences

For example, a future system could learn that:

``` text
Blue Denim Shirt + Denim Jacket
```

is a combination this particular user dislikes.

That is a future personalization/compatibility feature, NOT another
Advanced Filter.

Do not implement it now.

------------------------------------------------------------------------

# 18. EXISTING COLOR AND STYLE DATA

Use the existing wardrobe data:

-   `styles`
-   `colors`

Do not redesign the ClothingItem schema.

The existing available Style and Color values should populate the
frontend dropdowns.

If no Style or Color is selected, the corresponding preference is
inactive.

------------------------------------------------------------------------

# 19. TESTING REQUIREMENTS

Before claiming the implementation is complete, test all of the
following.

## Test 1 --- Basic recommendation

``` text
Occasion = Casual
Season = Summer
Style = Any
Color = Any
```

Expected:

-   Valid recommendations appear.
-   Complete outfits are generated.

## Test 2 --- Style only

``` text
Occasion = Casual
Season = Summer
Style = Casual
Color = Any
```

Expected:

-   Recommendations still appear when valid outfits exist.
-   Casual-compatible outfits rank higher.
-   Non-perfect style matches remain possible.

## Test 3 --- Color only

``` text
Occasion = Casual
Season = Summer
Style = Any
Color = Black
```

Expected:

-   Recommendations still appear when valid outfits exist.
-   Black-compatible outfits rank higher.
-   Non-black pieces are not automatically removed from necessary outfit
    slots.

## Test 4 --- Style + Color

``` text
Occasion = Casual
Season = Summer
Style = Casual
Color = Black
```

Expected:

-   Outfits matching both preferences rank highest.

## Test 5 --- Impossible preference

Choose a Style + Color combination that does not exist in the wardrobe.

Expected:

-   Valid Occasion + Season outfits are still returned.
-   The system does not incorrectly report "No matching outfit."

## Test 6 --- Preference actually changes ranking

Use a wardrobe with at least two valid outfits where one clearly matches
the selected Style or Color better.

Expected:

-   The better matching outfit moves higher in the final recommendation
    list.

## Test 7 --- Try Another

Verify that:

``` text
Find My Outfit
→ Try Another Outfit
```

continues to show other ranked outfits.

## Test 8 --- Dislike

Verify:

``` text
I Don't Like This Recommendation
→ Select reason
→ Submit
→ Rejected outfit disappears
→ Next recommendation appears
```

## Test 9 --- Wear / History / Rating

Verify:

``` text
Wear This Outfit
→ History
→ Rate Outfit
```

continues working.

------------------------------------------------------------------------

# 20. SAFETY RULES FOR IMPLEMENTATION

Before editing:

1.  Inspect the current working tree.
2.  Inspect the existing recommendation flow.
3.  Understand current uncommitted changes.
4.  Do not overwrite unrelated work.

Do NOT:

-   run `git reset --hard`
-   blindly run `git restore`
-   overwrite uncommitted work
-   rewrite unrelated components
-   modify database schema
-   install unnecessary dependencies
-   introduce a new weather system
-   replace working recommendation architecture
-   modify History/Feedback/Wear/Rating functionality

If an existing uncommitted change conflicts with this task:

**STOP and ask before overwriting it.**

------------------------------------------------------------------------

# 21. FILES TO INSPECT

Before making changes, inspect:

``` text
stylemate-frontend/src/pages/Recommendation.jsx

stylemate-backend/controllers/recommendationController.js

ai/recommendation.py

ai/rule-engine/clothing_filter.py

ai/rule-engine/style_rules.py

ai/rule-engine/color_rules.py

ai/rule-engine/occasion_rules.py

ai/rule-engine/weather_rules.py

ai/rule-engine/outfit_generator.py

ai/rule-engine/ranker.py
```

Do not assume their current contents.

------------------------------------------------------------------------

# 22. IMPLEMENTATION APPROACH

Before editing, explain briefly:

1.  Current recommendation flow.
2.  Current hard filters.
3.  Current outfit generation flow.
4.  Current ranking flow.
5.  Where Style preference scoring will be added.
6.  Where Color preference scoring will be added.
7.  How final reranking will happen.
8.  Which files will be changed.

Only after that should implementation begin.

Make the smallest possible changes.

------------------------------------------------------------------------

# 23. FINAL REPORT

After implementation, report:

1.  Files changed.
2.  Exact purpose of each change.
3.  Files intentionally left unchanged.
4.  Any assumptions.
5.  Tests performed.
6.  Test results.
7.  Any remaining limitations.

Do not claim something works unless it was actually tested.

------------------------------------------------------------------------

# FINAL PRODUCT DECISION

The final StyleMate recommendation system is:

``` text
Occasion + Season
        ↓
   HARD CONTEXT
        ↓
Generate valid complete outfits
        ↓
Existing compatibility / ML ranking
        ↓
Preferred Style
   SOFT PREFERENCE
        +
Preferred Color
   SOFT PREFERENCE
        ↓
Final score
        ↓
Final reranking
        ↓
Best complete outfits
```

The system should answer:

> "Given where you're going and the season, what are the best outfits
> from your wardrobe, considering what styles and colors you prefer?"

It should NOT answer:

> "Which individual clothes exactly match three filters?"

That distinction is fundamental to the design.
