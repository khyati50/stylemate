"""
StyleMate AI — v2 & v3 Complete System Architecture & Manual Guide
==================================================================
Generates an executive, publication-grade PDF report documenting the full
evolution of StyleMate AI:
  - v2 Tabular Machine Learning (Polyvore 20k, HistGradientBoosting, SHAP)
  - v3 Multimodal Vision LLM (Gemini Vision, Texture & Weather Reasoning)
  - The End-to-End 2-Stage Production Funnel
  - Step-by-Step Manual Playbook (How to build & code it yourself)
  - Technical Interview Master Sheet (Exact talking points & defense)

Saves directly to: /Users/khyatianand/Desktop/StyleMate_V2_and_V3_Complete_Guide.pdf
"""

import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak, HRFlowable, KeepTogether
)
from reportlab.pdfgen import canvas

PDF_OUTPUT_PATH = "/Users/khyatianand/Desktop/StyleMate_V2_and_V3_Complete_Guide.pdf"
DOCS_DIR = "/Users/khyatianand/Documents/stylemate/ai/docs"

SHAP_BAR_IMG = os.path.join(DOCS_DIR, "shap_global_bar.png")
ROC_IMG = os.path.join(DOCS_DIR, "model_roc_auc_curves.png")
CONF_IMG = os.path.join(DOCS_DIR, "model_confusion_matrices.png")


class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))

        # Header on later pages
        if self._pageNumber > 1:
            self.drawString(54, 750, "StyleMate AI — v2 & v3 Architecture, Vision LLM & Manual Engineering Guide")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(54, 742, 558, 742)

        # Footer
        self.drawString(54, 36, "CONFIDENTIAL & PROPRIETARY — STYLEMATE PERSONAL STYLIST AI")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 36, page_str)
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(54, 48, 558, 48)
        self.restoreState()


def build_pdf():
    doc = SimpleDocTemplate(
        PDF_OUTPUT_PATH,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=22,
        leading=26,
        textColor=colors.HexColor("#0F172A"),
        spaceAfter=4
    )
    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=11,
        leading=15,
        textColor=colors.HexColor("#475569"),
        spaceAfter=12
    )
    h1_style = ParagraphStyle(
        "Heading1_Custom",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=17,
        textColor=colors.HexColor("#1E3A8A"),
        spaceBefore=12,
        spaceAfter=5,
        keepWithNext=True
    )
    h2_style = ParagraphStyle(
        "Heading2_Custom",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor("#334155"),
        spaceBefore=8,
        spaceAfter=3,
        keepWithNext=True
    )
    body_style = ParagraphStyle(
        "Body_Custom",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#1E293B"),
        spaceAfter=6
    )
    bullet_style = ParagraphStyle(
        "Bullet_Custom",
        parent=body_style,
        leftIndent=14,
        firstLineIndent=-10,
        spaceAfter=3
    )
    table_cell = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#1E293B")
    )
    table_cell_bold = ParagraphStyle(
        "TableCellBold",
        parent=table_cell,
        fontName="Helvetica-Bold",
        textColor=colors.HexColor("#0F172A")
    )
    callout_style = ParagraphStyle(
        "Callout",
        parent=body_style,
        fontName="Helvetica-Oblique",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#1E3A8A")
    )

    story = []

    # =========================================================================
    # PAGE 1: TITLE & EXECUTIVE SUMMARY
    # =========================================================================
    story.append(Paragraph("StyleMate AI — System Architecture & Engineering Guide", title_style))
    story.append(Paragraph("From Tabular Polyvore ML (v2) to Multimodal Vision LLM Personal Stylist (v3)", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#1E3A8A"), spaceAfter=10))

    story.append(Paragraph("1. Executive Summary & Product Vision", h1_style))
    story.append(Paragraph(
        "<b>StyleMate</b> is an intelligent digital wardrobe and personal styling platform. "
        "Unlike generic fashion chat assistants that invent imaginary clothes, StyleMate operates as an "
        "<b>inventory optimization and personal stylist engine strictly grounded in the user's physical wardrobe</b>. "
        "This engineering report documents the comprehensive evolution of the core intelligence layer across three generations:",
        body_style
    ))

    # Architecture Evolution Table
    gen_data = [
        [Paragraph("Generation", table_cell_bold), Paragraph("Core Technology", table_cell_bold), Paragraph("Input Type", table_cell_bold), Paragraph("Strengths & Bottlenecks", table_cell_bold)],
        [
            Paragraph("<b>v1 (Legacy)</b>", table_cell),
            Paragraph("Synthetic Formula & Random Forest Regressor", table_cell),
            Paragraph("Synthetic outfit records with hand-tuned weights", table_cell),
            Paragraph("Fast proof of concept, but memorized artificial equations rather than real fashion taste.", table_cell)
        ],
        [
            Paragraph("<b>v2 (Tabular ML)</b>", table_cell),
            Paragraph("HistGradientBoosting Classifier + SHAP Explainability", table_cell),
            Paragraph("20,000 real stylist outfits from the Polyvore dataset (13 engineered features)", table_cell),
            Paragraph("74.2% ROC-AUC, 96.1% Recall. Excellent at style & color alignment in 2ms, but blind to fabric textures and drape.", table_cell)
        ],
        [
            Paragraph("<b>v3 (Vision LLM)</b>", table_cell),
            Paragraph("2-Stage Funnel: v2 Pre-Ranker + Gemini Multimodal Vision Stylist", table_cell),
            Paragraph("High-resolution garment photos, temperature context & occasion semantics", table_cell),
            Paragraph("True visual harmony: detects fabric clash (denim-on-denim), weather warmth, and writes human-grade styling advice.", table_cell)
        ],
    ]
    t_gen = Table(gen_data, colWidths=[65, 125, 130, 184])
    t_gen.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_gen)
    story.append(Spacer(1, 10))

    story.append(Paragraph("The Production 2-Stage Funnel Architecture", h2_style))
    story.append(Paragraph(
        "To achieve industry-grade performance, StyleMate utilizes a <b>2-Stage Funnel</b>: "
        "<br/>• <b>Stage 1 (Candidate Generation · 2ms):</b> Hard filters (Occasion, Season) and the trained v2 tabular model evaluate all wardrobe combinations, filtering out 90% of clashes and selecting the top 3 unique candidate outfits."
        "<br/>• <b>Stage 2 (Vision LLM Evaluation · ~800ms):</b> Gemini Vision inspects actual photos of the top candidates, evaluating fabric textures, proportions, and thermal insulation to select the final winning look and generate personalized styling rationales.",
        body_style
    ))
    story.append(Spacer(1, 8))

    # =========================================================================
    # PAGE 2: v2 TABULAR ML DEEP-DIVE
    # =========================================================================
    story.append(PageBreak())
    story.append(Paragraph("2. v2 Tabular Machine Learning Engine", h1_style))
    story.append(Paragraph(
        "The v2 engine transformed StyleMate from artificial formulas into genuine machine learning. "
        "It was trained on <b>20,000 outfits</b> derived from the benchmark <b>Polyvore dataset</b>, "
        "consisting of 10,000 stylist-approved outfits (y = 1) and 10,000 negative-sampled clashing outfits (y = 0).",
        body_style
    ))

    story.append(Paragraph("The 13 Engineered Feature Specifications", h2_style))
    feat_data = [
        [Paragraph("Feature Name", table_cell_bold), Paragraph("Type", table_cell_bold), Paragraph("Range", table_cell_bold), Paragraph("Formula & Fashion Engineering Meaning", table_cell_bold)],
        [Paragraph("formality_consistency", table_cell), Paragraph("Continuous", table_cell), Paragraph("0.0 – 1.0", table_cell), Paragraph("Inverse variance of style ranks (sporty=0 to formal=3). Penalizes formal+gym mixes.", table_cell)],
        [Paragraph("color_harmony", table_cell), Paragraph("Continuous", table_cell), Paragraph("0.0 – 1.0", table_cell), Paragraph("Scores complementary, analogous, monochromatic palettes via HSV color wheel.", table_cell)],
        [Paragraph("neutral_ratio", table_cell), Paragraph("Continuous", table_cell), Paragraph("0.0 – 1.0", table_cell), Paragraph("Proportion of anchor neutrals (black, white, grey, navy, beige).", table_cell)],
        [Paragraph("style_compatibility", table_cell), Paragraph("Continuous", table_cell), Paragraph("0.0 – 1.0", table_cell), Paragraph("Pairwise compatibility matrix across flat style tags (smart, chic, casual).", table_cell)],
        [Paragraph("garment_compatibility", table_cell), Paragraph("Continuous", table_cell), Paragraph("0.0 – 1.0", table_cell), Paragraph("Slot-level coherence comparing dominant styles of top vs bottom vs outerwear.", table_cell)],
        [Paragraph("occasion_suitability", table_cell), Paragraph("Continuous", table_cell), Paragraph("0.0 – 1.0", table_cell), Paragraph("Semantic overlap between item occasion tags and requested user context.", table_cell)],
        [Paragraph("seasonal_suitability", table_cell), Paragraph("Continuous", table_cell), Paragraph("0.0 – 1.0", table_cell), Paragraph("Fraction of core garments tagged appropriately for target weather season.", table_cell)],
        [Paragraph("layering_score", table_cell), Paragraph("Continuous", table_cell), Paragraph("0.0 – 1.0", table_cell), Paragraph("Evaluates presence of outerwear relative to cold vs warm ambient temperatures.", table_cell)],
        [Paragraph("has_core, has_shoes", table_cell), Paragraph("Binary", table_cell), Paragraph("0 or 1", table_cell), Paragraph("Binary presence flags for top+bottom/dress and footwear (data-driven).", table_cell)],
        [Paragraph("has_outer, has_acc", table_cell), Paragraph("Binary", table_cell), Paragraph("0 or 1", table_cell), Paragraph("Binary flags for outerwear and accessories allowing model to learn weights naturally.", table_cell)],
    ]
    t_feat = Table(feat_data, colWidths=[95, 55, 50, 304])
    t_feat.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#F8FAFC")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(t_feat)
    story.append(Spacer(1, 8))

    story.append(Paragraph("Model Benchmark Results (4,000 Held-Out Test Outfits)", h2_style))
    bench_data = [
        [Paragraph("Model", table_cell_bold), Paragraph("Accuracy", table_cell_bold), Paragraph("ROC-AUC", table_cell_bold), Paragraph("F1-Score", table_cell_bold), Paragraph("Precision", table_cell_bold), Paragraph("Recall", table_cell_bold)],
        [Paragraph("Logistic Regression", table_cell), Paragraph("66.57%", table_cell), Paragraph("70.53%", table_cell), Paragraph("69.85%", table_cell), Paragraph("63.61%", table_cell), Paragraph("77.45%", table_cell)],
        [Paragraph("Random Forest (300 trees)", table_cell), Paragraph("69.23%", table_cell), Paragraph("72.83%", table_cell), Paragraph("75.17%", table_cell), Paragraph("63.00%", table_cell), Paragraph("93.15%", table_cell)],
        [Paragraph("<b>HistGradientBoosting (Winner)</b>", table_cell), Paragraph("<b>69.92%</b>", table_cell), Paragraph("<b>74.18%</b>", table_cell), Paragraph("<b>76.17%</b>", table_cell), Paragraph("<b>63.07%</b>", table_cell), Paragraph("<b>96.15%</b>", table_cell)],
    ]
    t_bench = Table(bench_data, colWidths=[130, 70, 75, 75, 75, 79])
    t_bench.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
        ('BACKGROUND', (0, 3), (-1, 3), colors.HexColor("#ECFDF5")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_bench)
    story.append(Spacer(1, 10))

    # SHAP Plot
    if os.path.exists(SHAP_BAR_IMG):
        story.append(Paragraph("SHAP Game-Theoretic Feature Ranking:", h2_style))
        story.append(Image(SHAP_BAR_IMG, width=6.5 * inch, height=2.2 * inch))
        story.append(Paragraph("<i>Key finding: Formality Consistency (0.54) and Color Harmony (0.30) drive over 70% of compatibility decisions. Slot presence (has_core, has_shoes) registered ~0.00 importance, mathematically proving that fashion harmony governs compatibility rather than garment counts.</i>", callout_style))

    # =========================================================================
    # PAGE 3: v3 VISION LLM SYSTEM
    # =========================================================================
    story.append(PageBreak())
    story.append(Paragraph("3. v3 Multimodal Vision LLM Personal Stylist", h1_style))
    story.append(Paragraph(
        "While v2 achieved high statistical accuracy on tabular tags, tabular ML possesses a fundamental flaw: "
        "<b>it is completely blind to fabric textures, silhouettes, and physical realities</b>. "
        "A washed denim jacket and a denim shirt both carry the tag 'casual' — causing tabular models to score double-denim as 100% compatible. "
        "v3 bridges this gap by introducing <b>Multimodal Vision Intelligence</b> via Google Gemini.",
        body_style
    ))

    story.append(Paragraph("Under the Hood: How Vision Models 'See' Clothes", h2_style))
    story.append(Paragraph(
        "• <b>Patch Projection:</b> Photographs are divided into 16x16 pixel patches. Convolutional & linear layers project pixel colors and micro-textures into a 768-dimensional visual vector.<br/>"
        "• <b>Cross-Attention Mechanism:</b> The model performs self-attention across the top, bottom, and outerwear patches simultaneously. It mathematically identifies when two garments share identical heavy diagonal twill weaves (catching denim-on-denim monotony) without needing text labels.<br/>"
        "• <b>Unified Semantic Space:</b> The visual vector for a cable-knit sweater sits directly adjacent to text concepts of 'warmth', 'winter', and 'casual comfort'.",
        body_style
    ))
    story.append(Spacer(1, 8))

    story.append(Paragraph("Real Wardrobe Test: Tabular Blindness vs. Vision Intelligence", h2_style))
    case_data = [
        [Paragraph("Scenario / Outfit", table_cell_bold), Paragraph("v2 Tabular Model (Blind)", table_cell_bold), Paragraph("v3 Vision LLM (With Eyes)", table_cell_bold)],
        [
            Paragraph("<b>Triple Denim</b><br/>Denim Shirt + Denim Jacket + Jeans (8°C Winter)", table_cell),
            Paragraph("<b>Score: 0.68 (Approved)</b><br/>All items tagged 'casual' and 'winter', so mathematical formality was 1.0.", table_cell),
            Paragraph("<b>Verdict: NEEDS_ADJUSTMENT (0.58)</b><br/><i>'Triple denim creates textural monotony... unlined denim layering provides minimal thermal warmth for 8°C. Swap shirt for a cream ribbed turtleneck knit.'</i>", table_cell)
        ],
        [
            Paragraph("<b>Dinner Date Chic</b><br/>Emerald Satin Top + White Trousers + Nude Heels (24°C)", table_cell),
            Paragraph("<b>Score: 0.61 (Neutral)</b><br/>Tags only showed 'smart' and 'casual'; missed the high-end fabric contrast.", table_cell),
            Paragraph("<b>Verdict: APPROVED (0.95)</b><br/><i>'Fluid, luminous emerald satin offers sophisticated tactile contrast to crisp structured trousers. Nude sandals gracefully elongate the leg line.'</i>", table_cell)
        ],
    ]
    t_case = Table(case_data, colWidths=[120, 160, 224])
    t_case.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(t_case)
    story.append(Spacer(1, 10))

    story.append(Paragraph("The Production Fallback Architecture", h2_style))
    story.append(Paragraph(
        "Production AI must never crash. In StyleMate, the Vision LLM is wrapped in a <b>Fault-Tolerant Circuit Breaker</b>: "
        "if network connectivity drops, Gemini times out (> 15s), or API quotas are exceeded, the recommendation controller "
        "automatically and silently falls back to the v2 model bundle. The user always receives instant, verified recommendations.",
        body_style
    ))

    # =========================================================================
    # PAGE 4: THE MANUAL PLAYBOOK & HOW TO BUILD IT YOURSELF
    # =========================================================================
    story.append(PageBreak())
    story.append(Paragraph("4. The Manual Step-by-Step Engineering Playbook", h1_style))
    story.append(Paragraph(
        "If you were asked to reconstruct this system from a blank editor with no AI assistants, "
        "here is the exact 4-step engineering blueprint to follow:",
        body_style
    ))

    steps = [
        ("Step 1: Dataset Construction", "Extract complete outfits from JSON files into positive pairs (y=1). Synthesize realistic negatives (y=0) by swapping footwear or tops to introduce deliberate formality and style clashes. Extract 13 numerical features into a clean CSV."),
        ("Step 2: Model Training & Versioning", "Load features into Pandas. Perform a stratified 80/20 train/test split. Fit HistGradientBoostingClassifier. Evaluate with ROC-AUC and Confusion Matrices. Serialize the winning model bundle as a dictionary: {'model', 'scaler', 'features', 'version'} via joblib.dump()."),
        ("Step 3: Vision LLM Integration", "Read user garment images using base64. Assemble a multi-part payload with structured JSON schema enforcement. Use ThreadPoolExecutor to evaluate the top 2-3 candidates in parallel, blending the tabular score (30%) with the vision score (70%)."),
        ("Step 4: Frictionless Onboarding UX", "Solve the cold-start problem: provide a 30-second 'Capsule Starter Pack' where users tap 5 staples. Support camera snaps and product link pasting. For small closets, invoke Gap Analysis to show which missing item unlocks the most new outfits."),
    ]
    for title, desc in steps:
        story.append(Paragraph(f"<b>{title}:</b> {desc}", bullet_style))
        story.append(Spacer(1, 4))

    story.append(Spacer(1, 8))
    story.append(Paragraph("5. Technical Interview Master Sheet", h1_style))
    story.append(Paragraph("The 5 critical interview questions and your precise technical defense:", h2_style))

    qas = [
        ("Q1: Why use a 2-stage funnel instead of sending all wardrobe photos to the LLM?",
         "Sending 50 images to an LLM on every request causes 8–10s of latency and drains token budgets. Stage 1 (rule engine + v2 model) narrows hundreds of combinations down to the top 3 candidates in 2ms. Stage 2 evaluates only those top 3 visually, keeping latency sub-second and API costs negligible."),
        ("Q2: How do you prevent LLMs from hallucinating clothes the user doesn't own?",
         "Strict grounding: the LLM is never asked to invent clothes. It only receives pre-qualified item IDs from the user's database. Output is constrained to an exact JSON schema which is validated before rendering."),
        ("Q3: Why not train a custom CNN from scratch?",
         "Custom CNNs require hundreds of thousands of labeled images, expensive GPU clusters, and only output cold numbers. Multimodal foundation models provide zero-shot fashion semantics, weather reasoning, and natural language explanations that make the app feel like a real personal stylist."),
        ("Q4: Why did SHAP values show near-zero importance for outfit completeness?",
         "Because in real stylist data, a minimal 3-piece outfit (t-shirt, jeans, sneakers) is complete and stylish. Compatibility is governed by color harmony and formality alignment, not how many layers you pile on."),
        ("Q5: How does StyleMate solve the digital closet onboarding drop-off problem?",
         "By removing the burden of photographing 50 items. We provide an instant 'Capsule Starter Pack' for 30-second onboarding, product URL import, and Gap Analysis that turns small closets into personalized shopping roadmaps."),
    ]

    for q, a in qas:
        story.append(Paragraph(f"<b>{q}</b>", h2_style))
        story.append(Paragraph(f"<i>Defense:</i> {a}", body_style))
        story.append(Spacer(1, 2))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"\nSUCCESS! Master Guide PDF generated at:\n  {PDF_OUTPUT_PATH}")


if __name__ == "__main__":
    build_pdf()
