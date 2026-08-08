# StyleMate Recommendation Refactor --- Controlled Changes Only

## Purpose

Refactor the **StyleMate recommendation system** so that:

1.  **Occasion + automatically detected Season** remain the hard
    constraints.
2.  **Preferred Style + Preferred Color** become optional ranking
    preferences, not hard filters.
3.  **Preferred Category is removed** from Advanced Filters.
4.  Existing working systems remain unchanged.

This document is the implementation specification. Read and follow it
before editing code.

------------------------------------------------------------------------

# 1. CRITICAL RULE: DO NOT BREAK EXISTING SYSTEMS

Make the **smallest possible changes** needed for this task.

Do NOT refactor, rename, redesign, or "improve" unrelated functionality.

Do NOT modify:

-   Authentication
-   JWT handling
-   Wardrobe CRUD
-   Wardrobe filtering
-   Outfit History
-   Wear This Outfit
-   Rating system
-   Feedback system
-   "I Don't Like This Recommendation"
-   Feedback reasons
-   `Other` feedback text
-   Try Another Outfit behavior
-   Existing outfit normalization
-   Existing Node → Python stdin/stdout communication
-   Existing outfit generation unless required for this exact change
-   Existing database models unless absolutely required
-   Existing API routes unrelated to recommendation preferences
-   Existing UI styling outside the recommendation form

If you discover that a change would affect any of these systems, stop
and explain the impact before proceeding.

------------------------------------------------------------------------

# 2. INSPECT BEFORE EDITING

Before making changes, inspect the existing implementation and
understand:

-   `Recommendation.jsx`
-   Node recommendation controller
-   `recommendation.py`
-   `clothing_filter.py`
-   `style_rules.py`
-   `color_rules.py`
-   `category_rules.py` if it exists
-   `outfit_generator.py`
-   `ranker.py`
-   Existing weather/season logic

Do not assume how the existing system works.

Do not immediately rewrite code.

------------------------------------------------------------------------

# 3. REMOVE PREFERRED CATEGORY

The current Advanced Filters include:

-   Preferred Style
-   Preferred Color
-   Preferred Category

Remove **Preferred Category completely**.

Remove only the Category functionality that was introduced for this
recommendation Advanced Filters feature.

This means:

### Frontend

Remove:

-   Category state
-   Category dropdown
-   Category from the recommendation request body

### Node.js

Remove:

-   `category` from the recommendation request destructuring if it was
    added only for this feature
-   `preferred_category` from `user_preferences` if it was added only
    for this feature

### Python

Remove category preference handling introduced for this feature.

If `category_rules.py` was created only for this feature and has no
other callers, remove it and its integration.

IMPORTANT:

Do NOT remove or modify the existing `ClothingItem.category` field.

Category is still part of wardrobe data and outfit generation.

------------------------------------------------------------------------

# 4. PREFERRED STYLE AND COLOR MUST NOT BE HARD FILTERS

This is the most important architectural change.

## Current problem

Style and Color are currently being treated as hard filters on
individual clothing items.

For example:

User selects:

-   Occasion = Party
-   Season = Summer
-   Style = Body-fit
-   Color = Pink

The system may currently remove every item that is not Body-fit or Pink.

That is wrong because a complete outfit requires multiple slots.

Example:

-   Pink Body-fit dress
-   Peep-toe heels
-   Accessory

If only the dress matches the style/color, the footwear must NOT be
removed just because it doesn't have the preferred style/color.

Hard filtering can therefore destroy otherwise valid complete outfits
and result in:

> No matching outfit found

------------------------------------------------------------------------

# 5. NEW RECOMMENDATION ARCHITECTURE

The intended flow is:

``` text
User
  ↓
Select Occasion
  ↓
Automatic Weather / Season
  ↓
Occasion + Season hard filtering
  ↓
Generate complete valid outfits
  ↓
Preferred Style + Preferred Color affect ranking
  ↓
Existing ranker
  ↓
Multiple ranked recommendations
```

## Hard constraints

These remain actual filters:

-   Occasion
-   Automatically detected Season

If an item does not fit the selected occasion/season rules, it can be
excluded.

## Soft preferences

These must NOT eliminate individual clothing items:

-   Preferred Style
-   Preferred Color

They should influence the score of a **complete outfit**.

------------------------------------------------------------------------

# 6. PREFERRED STYLE RANKING

If the user selects a preferred style such as:

``` text
Streetwear
```

do NOT remove all non-streetwear items from the wardrobe before
generating outfits.

Instead:

1.  Generate valid outfits using the existing occasion/season logic.
2.  Inspect the generated outfit.
3.  Give the outfit a higher score when its items match the requested
    style.
4.  Keep valid outfits that do not perfectly match.
5.  Let the existing ranker determine the final ordering.

Example:

``` text
Outfit A
Top: streetwear
Bottom: casual
Footwear: sporty

→ Strong style match

Outfit B
Top: casual
Bottom: casual
Footwear: formal

→ Weaker style match
```

Outfit A should rank higher, but Outfit B should not automatically be
deleted if it is otherwise valid.

Use the existing `ranker.py`.

Do NOT create a completely separate recommendation algorithm.

------------------------------------------------------------------------

# 7. PREFERRED COLOR RANKING

If the user selects:

``` text
Black
```

do NOT remove every non-black item from the wardrobe.

Instead:

1.  Generate valid complete outfits.
2.  Check the colors represented in the outfit.
3.  Give higher scores to outfits that better match the requested color.
4.  Keep otherwise valid outfits even if they do not contain the
    preferred color.
5.  Let the existing ranker determine final ordering.

The goal is:

> "Prefer black"

not:

> "Only allow black."

------------------------------------------------------------------------

# 8. STYLE + COLOR TOGETHER

If the user selects:

``` text
Style = Streetwear
Color = Black
```

the system should prioritize outfits that satisfy both.

It should NOT require every individual item in the outfit to be both
streetwear and black.

The scoring should reward stronger overall matches.

Example:

``` text
Outfit A
- Streetwear items
- Black item(s)

→ High score

Outfit B
- Streetwear items
- No black

→ Medium score

Outfit C
- No streetwear
- Black item

→ Lower score

Outfit D
- Neither

→ Lowest score
```

All four may remain valid if they satisfy the hard occasion/season
requirements.

------------------------------------------------------------------------

# 9. NO ADVANCED FILTERS SELECTED

If:

``` text
Style = Any Style
Color = Any Color
```

the recommendation behavior should remain equivalent to the existing
recommendation system.

Do not accidentally make Style/Color mandatory.

------------------------------------------------------------------------

# 10. AUTOMATIC SEASON

The user should no longer manually select Season.

Current UI has:

``` text
Occasion
Season
```

Change it so the user selects only:

``` text
Occasion
```

The season should come from the existing weather/season implementation
if one already exists.

## IMPORTANT

Inspect the project first.

If there is already a working weather API/integration or
season-detection implementation:

-   Reuse it.
-   Do not create a duplicate weather system.

If the existing project does NOT have a working way to determine the
current season:

-   Do NOT invent a fake implementation.
-   Do NOT install unnecessary packages.
-   Do NOT rewrite the weather architecture.
-   Stop and tell me exactly what is missing.

Do not silently create a new weather system.

------------------------------------------------------------------------

# 11. UI EXPECTATION

Advanced Filters should contain only:

``` text
Preferred Style    [ Any Style ▼ ]

Preferred Color    [ Any Color ▼ ]
```

There should be no Category filter.

The user experience should feel like:

``` text
Occasion: Party

Advanced Filters
Style: Any Style
Color: Any Color

Find My Outfit
```

or:

``` text
Occasion: Party

Advanced Filters
Style: Streetwear
Color: Black

Find My Outfit
```

------------------------------------------------------------------------

# 12. PRESERVE MULTIPLE RECOMMENDATIONS

The recommendation endpoint currently returns multiple ranked outfits.

Do not change that behavior.

The system should continue returning multiple recommendations where
valid combinations exist.

Do not reduce the result to only one outfit.

Preserve the existing:

-   `Try Another Outfit`
-   recommendation array
-   current-index behavior
-   dislike/removal behavior

------------------------------------------------------------------------

# 13. EMPTY RESULT BEHAVIOR

If Occasion + automatically detected Season genuinely produce no valid
complete outfit:

keep the existing no-match behavior.

Do NOT bypass hard constraints just to force a recommendation.

Do NOT manufacture an invalid outfit.

------------------------------------------------------------------------

# 14. DO NOT CHANGE DATABASE

This task should not require a database migration.

Do not modify the database unless absolutely necessary.

If you believe a database change is required:

STOP and explain why before doing it.

------------------------------------------------------------------------

# 15. TESTING REQUIREMENTS

After implementation, test all of the following.

## Test 1 --- No Advanced Filters

``` text
Occasion = Casual
Style = Any
Color = Any
```

Expected:

-   Recommendations appear.
-   Complete outfits are generated.
-   Existing behavior remains intact.

## Test 2 --- Style Only

``` text
Occasion = Casual
Style = Streetwear
Color = Any
```

Expected:

-   Recommendations still appear if valid occasion/season outfits exist.
-   Streetwear-compatible outfits rank higher.
-   Non-perfect matches are not automatically deleted.

## Test 3 --- Color Only

``` text
Occasion = Casual
Style = Any
Color = Black
```

Expected:

-   Recommendations still appear if valid outfits exist.
-   Black-compatible outfits rank higher.
-   Non-black items are not automatically removed from required outfit
    slots.

## Test 4 --- Style + Color

``` text
Occasion = Casual
Style = Streetwear
Color = Black
```

Expected:

-   Outfits matching both are prioritized.
-   Complete outfits remain valid.

## Test 5 --- Impossible Preference

Choose a style/color combination that is not represented well in the
wardrobe.

Expected:

-   The system should still return valid occasion/season outfits if they
    exist.
-   It should not simply return "No matching outfit" because a soft
    preference has no perfect match.

## Test 6 --- Existing Recommendation Flow

Verify:

``` text
Find My Outfit
↓
Recommendation
↓
Try Another Outfit
↓
Wear This Outfit
↓
History
↓
Rate Outfit
```

## Test 7 --- Dislike Flow

Verify:

``` text
I Don't Like This Recommendation
↓
Feedback
↓
Submit
↓
Rejected outfit disappears
↓
Next recommendation appears
```

Do not break this flow.

------------------------------------------------------------------------

# 16. WEATHER / SEASON SAFETY RULE

The automatic season requirement is conditional on the existing project
architecture.

If current weather/season functionality is insufficient:

DO NOT:

-   install random weather packages
-   create a new weather service
-   rewrite APIs
-   add unrelated dependencies
-   fabricate a season from a hardcoded value

Instead, stop and report:

1.  What existing weather/season functionality was found.
2.  What is missing.
3.  What would need to be added.

------------------------------------------------------------------------

# 17. IMPLEMENTATION SAFETY

Before finishing:

-   Check the git diff.
-   Make sure unrelated files were not changed.
-   Make sure unrelated functions were not rewritten.
-   Make sure existing APIs still work.
-   Make sure Python stdin/stdout communication still works.
-   Make sure recommendation normalization is unchanged.
-   Make sure history/feedback code was untouched.

If you change something unrelated accidentally, revert that change.

------------------------------------------------------------------------

# 18. FINAL REPORT

After implementation, report:

1.  Files changed.
2.  Exact purpose of each change.
3.  Files intentionally left unchanged.
4.  Any assumptions.
5.  Tests performed.
6.  Test results.
7.  Any remaining issue or limitation.

Do not claim something works unless it was actually tested.

## FINAL PRINCIPLE

The goal is NOT:

> "Make Style and Color stricter."

The goal is:

> "Find valid complete outfits for the user's occasion and season, then
> rank those outfits according to the user's preferred Style and Color."

Make the smallest, safest change that achieves that goal.
