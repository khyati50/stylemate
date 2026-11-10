"""
Generates an updated, comprehensive, professional PDF report of the Dataset Engineering,
Exploratory Data Analysis (EDA), AND the complete Manual EDA Playbook for StyleMate.
Saves directly to /Users/khyatianand/Desktop/StyleMate_Dataset_and_EDA_Report.pdf.
"""

import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak, HRFlowable
)
from reportlab.pdfgen import canvas

PDF_OUTPUT_PATH = "/Users/khyatianand/Desktop/StyleMate_Dataset_and_EDA_Report.pdf"
DOCS_DIR = "/Users/khyatianand/Documents/stylemate/ai/docs"
HEATMAP_IMG = os.path.join(DOCS_DIR, "eda_correlation_heatmap.png")
DIST_IMG = os.path.join(DOCS_DIR, "eda_feature_distributions.png")

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
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 750, "StyleMate AI — Dataset Engineering & EDA Comprehensive Report")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(54, 742, 558, 742)

        # Footer (all pages)
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 36, page_text)
        self.drawString(54, 36, "CONFIDENTIAL & PROPRIETARY — STYLEMATE AI")
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
        fontSize=24,
        leading=28,
        textColor=colors.HexColor("#0F172A"),
        spaceAfter=6
    )
    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#475569"),
        spaceAfter=15
    )
    h1_style = ParagraphStyle(
        "Heading1_Custom",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=17,
        textColor=colors.HexColor("#1E3A8A"),
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )
    h2_style = ParagraphStyle(
        "Heading2_Custom",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor("#0F172A"),
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )
    body_style = ParagraphStyle(
        "Body_Custom",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13.5,
        textColor=colors.HexColor("#334155"),
        spaceAfter=6
    )
    bullet_style = ParagraphStyle(
        "Bullet_Custom",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12.5,
        textColor=colors.HexColor("#334155"),
        leftIndent=15,
        spaceAfter=3
    )
    callout_style = ParagraphStyle(
        "Callout_Custom",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=8.5,
        leading=12.5,
        textColor=colors.HexColor("#1E293B")
    )
    code_style = ParagraphStyle(
        "CodeStyle",
        parent=styles["Normal"],
        fontName="Courier",
        fontSize=7.5,
        leading=10.5,
        textColor=colors.HexColor("#0F172A")
    )
    table_cell = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#1E293B")
    )
    table_cell_bold = ParagraphStyle(
        "TableCellBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#0F172A")
    )
    table_hdr = ParagraphStyle(
        "TableHdr",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.white
    )

    story = []

    # Title Banner
    story.append(Paragraph("StyleMate AI Recommendation Engine", title_style))
    story.append(Paragraph("Dataset Engineering, Cleaning, EDA & Manual Analysis Playbook", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#2563EB"), spaceAfter=12))

    # Executive Summary Box
    summary_text = (
        "<b>Executive Summary:</b> This report provides a complete audit of the dataset transformation for StyleMate. "
        "Previously, the recommendation system trained a regressor to memorize an artificial formula (<i>sum(weight * feature)</i>). "
        "To achieve true AI intelligence, we replaced the synthetic pipeline with the authentic <b>Polyvore Outfits Dataset</b>. "
        "This document details the raw dataset, noise/missing values encountered, data cleaning, negative sampling, "
        "the 10-feature mathematical specification, statistical summaries, correlation dynamics, and an explicit "
        "<b>Manual EDA Playbook</b> detailing what a data scientist types cell-by-cell in Python."
    )
    summary_table = Table([[Paragraph(summary_text, callout_style)]], colWidths=[504])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F1F5F9")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 10))

    # Section 1: The Raw Dataset
    story.append(Paragraph("1. The Raw Dataset: Polyvore Outfits", h1_style))
    story.append(Paragraph(
        "The raw dataset is the academic gold standard <b>Maryland Polyvore Outfits Dataset</b>, curated by human fashion stylists. "
        "Unlike synthetic generators, Polyvore captures real human aesthetic pairings spanning varied fashion aesthetics.", body_style
    ))
    polyvore_overview = [
        [Paragraph("Split / File", table_hdr), Paragraph("Raw Outfits", table_hdr), Paragraph("Purpose / Content", table_hdr)],
        [Paragraph("train_no_dup.json", table_cell_bold), Paragraph("17,316", table_cell), Paragraph("Primary training outfits curated by human stylists", table_cell)],
        [Paragraph("valid_no_dup.json", table_cell_bold), Paragraph("1,497", table_cell), Paragraph("Validation outfits for hyperparameter tuning", table_cell)],
        [Paragraph("test_no_dup.json", table_cell_bold), Paragraph("3,076", table_cell), Paragraph("Unseen test outfits for final model evaluation", table_cell)],
        [Paragraph("Total Outfits", table_cell_bold), Paragraph("21,889", table_cell_bold), Paragraph("Over 130,000 unique human-curated fashion pieces", table_cell_bold)],
    ]
    t_poly = Table(polyvore_overview, colWidths=[130, 84, 290])
    t_poly.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1E3A8A")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_poly)
    story.append(Spacer(1, 10))

    # Section 2: What was Missing and Data Cleaning
    story.append(Paragraph("2. Data Quality Audit: What Was Missing & How We Cleaned It", h1_style))
    story.append(Paragraph(
        "Raw real-world datasets are never model-ready out of the box. An extensive audit revealed significant noise and missing data:", body_style
    ))
    story.append(Paragraph("• <b>Missing & Zero Prices:</b> Many items had null prices or price = 0.0. Prices were excluded from the compatibility features to avoid socioeconomic bias in style scoring.", bullet_style))
    story.append(Paragraph("• <b>Empty Names & Phantom Items:</b> Multiple records contained blank names (<i>name: ''</i>) or placeholders (<i>'polyvore'</i>). These were filtered out via validation checks.", bullet_style))
    story.append(Paragraph("• <b>Non-Clothing Noise:</b> Raw Polyvore data included cosmetics (lipsticks, eyeliners, perfume), tech accessories (phone cases), and collage graphics. These were identified via Category IDs (e.g., CatID 200, 1967) and completely purged.", bullet_style))
    story.append(Paragraph("• <b>Missing Color Annotations:</b> Items lacked dedicated color tags. An automated NLP regex pipeline parsed 22 color keywords from item titles (e.g., 'white', 'navy', 'burgundy'), with safe neutral fallbacks ('black').", bullet_style))
    story.append(Paragraph("• <b>Wearability Filtering:</b> Only outfits containing a complete wearable base (Footwear + [Top + Bottom OR Full Body Dress]) were retained, producing 13,318 clean wearable looks.", bullet_style))
    story.append(Paragraph("• <b>Zero-NaN Mathematical Guarantee:</b> All 10 feature functions were built with fallback bounds, guaranteeing exactly 0 NaN values across the final 20,000 rows.", bullet_style))
    story.append(Spacer(1, 10))

    # Section 3: Ground Truth & Negative Sampling
    story.append(Paragraph("3. Formulation & Negative Sampling Strategy", h1_style))
    story.append(Paragraph(
        "A classification model requires both positive examples (cohesive looks) and negative examples (clashes). "
        "We generated a strictly balanced 20,000-outfit master dataset (50% positive / 50% negative):", body_style
    ))
    story.append(Paragraph("• <b>Positive Class (y = 1, 10,000 outfits):</b> Real, complete human stylist outfits extracted directly from Polyvore.", bullet_style))
    story.append(Paragraph("• <b>Negative Class (y = 0, 10,000 outfits):</b> Synthesized via multi-tier <b>Negative Sampling</b>:", bullet_style))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;1. <i>Footwear Swaps:</i> Replacing loafers/boots with random shoes from unrelated outfits.", bullet_style))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;2. <i>Bottom/Top Swaps:</i> Replacing trousers with random shorts/skirts from other aesthetics.", bullet_style))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;3. <i>Hard Formality Clashes:</i> Injected extreme aesthetic conflicts (e.g. patent leather stilettos into oversized streetwear, or athletic gym runners into formal evening wear).", bullet_style))
    story.append(Spacer(1, 10))

    # Page Break for Feature Specification Table
    story.append(PageBreak())

    # Section 4: Feature Specification Table
    story.append(Paragraph("4. Feature Specification: The 10 Compatibility Features", h1_style))
    story.append(Paragraph(
        "Every outfit is mapped to 10 mathematical signals bounded in [0.0, 1.0], organized into 4 fashion pillars:", body_style
    ))

    feat_table_data = [
        [Paragraph("Pillar", table_hdr), Paragraph("Feature Name", table_hdr), Paragraph("Formula / Logic", table_hdr), Paragraph("Bound", table_hdr)],
        [Paragraph("Color", table_cell_bold), Paragraph("neutral_ratio", table_cell_bold), Paragraph("Ratio of neutral colors (black, white, grey, navy, beige) to total colors.", table_cell), Paragraph("0.0 - 1.0", table_cell)],
        [Paragraph("Color", table_cell_bold), Paragraph("color_harmony", table_cell_bold), Paragraph("Palette classification: Monochromatic (0.9), Analogous (0.8), Complementary (0.7), Clashing (0.1).", table_cell), Paragraph("0.1 - 1.0", table_cell)],
        [Paragraph("Color", table_cell_bold), Paragraph("color_count", table_cell_bold), Paragraph("Rule of 3 enforcement: 1.0 for <=3 colors, linear penalty toward 0.0 at 6+ colors.", table_cell), Paragraph("0.0 - 1.0", table_cell)],
        [Paragraph("Style", table_cell_bold), Paragraph("style_compatibility", table_cell_bold), Paragraph("Average pairwise compatibility across garment style tags (casual, formal, streetwear, sporty, smart).", table_cell), Paragraph("0.0 - 1.0", table_cell)],
        [Paragraph("Style", table_cell_bold), Paragraph("formality_consistency", table_cell_bold), Paragraph("Consistency of formality rank across core items: 1.0 - (range / max_range).", table_cell), Paragraph("0.0 - 1.0", table_cell)],
        [Paragraph("Context", table_cell_bold), Paragraph("occasion_suitability", table_cell_bold), Paragraph("Fraction of core garments appropriate for user selected occasion (1.0 default if unprompted).", table_cell), Paragraph("0.0 - 1.0", table_cell)],
        [Paragraph("Context", table_cell_bold), Paragraph("seasonal_suitability", table_cell_bold), Paragraph("Fraction of core garments appropriate for weather/season (summer, winter, etc.).", table_cell), Paragraph("0.0 - 1.0", table_cell)],
        [Paragraph("Context", table_cell_bold), Paragraph("layering_score", table_cell_bold), Paragraph("Cold season demands outerwear (1.0) vs warm season penalty for heavy layers.", table_cell), Paragraph("0.0 - 1.0", table_cell)],
        [Paragraph("Outfit", table_cell_bold), Paragraph("garment_compatibility", table_cell_bold), Paragraph("Pairwise category compatibility: Top <-> Bottom <-> Footwear.", table_cell), Paragraph("0.0 - 1.0", table_cell)],
        [Paragraph("Outfit", table_cell_bold), Paragraph("outfit_completeness", table_cell_bold), Paragraph("Completeness score: 0.8 for top+bottom+shoe, 1.0 with outerwear/accessories.", table_cell), Paragraph("0.0 - 1.0", table_cell)],
    ]
    t_feat = Table(feat_table_data, colWidths=[55, 110, 280, 59])
    t_feat.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1E3A8A")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_feat)
    story.append(Spacer(1, 10))

    # Section 5: Statistical Findings & Signal Analysis
    story.append(Paragraph("5. Exploratory Data Analysis: Statistical Findings", h1_style))
    story.append(Paragraph(
        "Analysis across the 20,000 samples reveals clear mathematical separation between stylist and clashing outfits:", body_style
    ))

    eda_stats_data = [
        [Paragraph("Feature", table_hdr), Paragraph("Mean (y=1)", table_hdr), Paragraph("Mean (y=0)", table_hdr), Paragraph("Delta", table_hdr), Paragraph("Cohen's d", table_hdr), Paragraph("Signal Strength", table_hdr)],
        [Paragraph("garment_compatibility", table_cell_bold), Paragraph("0.9383", table_cell), Paragraph("0.8582", table_cell), Paragraph("+0.0801", table_cell), Paragraph("+0.642", table_cell_bold), Paragraph("Very Strong", table_cell_bold)],
        [Paragraph("formality_consistency", table_cell_bold), Paragraph("0.8702", table_cell), Paragraph("0.7019", table_cell), Paragraph("+0.1683", table_cell), Paragraph("+0.613", table_cell_bold), Paragraph("Very Strong", table_cell_bold)],
        [Paragraph("style_compatibility", table_cell_bold), Paragraph("0.8697", table_cell), Paragraph("0.7315", table_cell), Paragraph("+0.1382", table_cell), Paragraph("+0.611", table_cell_bold), Paragraph("Very Strong", table_cell_bold)],
        [Paragraph("color_harmony", table_cell_bold), Paragraph("0.9209", table_cell), Paragraph("0.8492", table_cell), Paragraph("+0.0717", table_cell), Paragraph("+0.483", table_cell), Paragraph("Moderate", table_cell)],
        [Paragraph("neutral_ratio", table_cell_bold), Paragraph("0.7624", table_cell), Paragraph("0.6340", table_cell), Paragraph("+0.1284", table_cell), Paragraph("+0.466", table_cell), Paragraph("Moderate", table_cell)],
        [Paragraph("color_count", table_cell_bold), Paragraph("0.9538", table_cell), Paragraph("0.8840", table_cell), Paragraph("+0.0698", table_cell), Paragraph("+0.363", table_cell), Paragraph("Moderate", table_cell)],
        [Paragraph("seasonal_suitability", table_cell_bold), Paragraph("0.7466", table_cell), Paragraph("0.8023", table_cell), Paragraph("-0.0557", table_cell), Paragraph("-0.220", table_cell), Paragraph("Context Only", table_cell)],
        [Paragraph("occasion_suitability", table_cell_bold), Paragraph("0.9193", table_cell), Paragraph("0.9187", table_cell), Paragraph("+0.0006", table_cell), Paragraph("+0.003", table_cell), Paragraph("Context Only", table_cell)],
        [Paragraph("layering_score", table_cell_bold), Paragraph("0.8694", table_cell), Paragraph("0.8694", table_cell), Paragraph("0.0000", table_cell), Paragraph("0.000", table_cell), Paragraph("Flat / Constant", table_cell)],
        [Paragraph("outfit_completeness", table_cell_bold), Paragraph("0.9244", table_cell), Paragraph("0.9244", table_cell), Paragraph("0.0000", table_cell), Paragraph("0.000", table_cell), Paragraph("Flat / Constant", table_cell)],
    ]
    t_eda = Table(eda_stats_data, colWidths=[120, 68, 68, 60, 68, 110])
    t_eda.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1E3A8A")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_eda)
    story.append(Spacer(1, 10))

    # Page Break for Visualizations
    story.append(PageBreak())

    # Section 6: Visualizations
    story.append(Paragraph("6. Visualizations: Correlation Heatmap & Distributions", h1_style))
    if os.path.exists(HEATMAP_IMG):
        story.append(Paragraph("<b>Figure 1: Feature Correlation Heatmap</b> (Identifying Collinearity & Target Alignment)", h2_style))
        story.append(Image(HEATMAP_IMG, width=6.0*inch, height=4.0*inch))
        story.append(Spacer(1, 8))

    if os.path.exists(DIST_IMG):
        story.append(PageBreak())
        story.append(Paragraph("<b>Figure 2: Feature Distribution Curves (Stylist Green vs. Clashing Red)</b>", h2_style))
        story.append(Image(DIST_IMG, width=6.5*inch, height=7.8*inch))
        story.append(Spacer(1, 10))

    # Page Break for the Manual Playbook
    story.append(PageBreak())

    # Section 7: The Manual Data Analysis Playbook
    story.append(Paragraph("7. The Manual Data Analysis Playbook (Jupyter Notebook Walkthrough)", h1_style))
    story.append(Paragraph(
        "If a data scientist were executing this analysis manually from scratch in a Jupyter Notebook, "
        "here is the exact cell-by-cell playbook, including the code typed and the questions being answered at each step:", body_style
    ))

    # Step 7.1
    story.append(Paragraph("Step 7.1: Data Ingestion & Shape Inspection", h2_style))
    story.append(Paragraph("<i>Question: Did the data load properly, how big is it, and what are the column types?</i>", callout_style))
    code_71 = (
        "import pandas as pd\n"
        "df = pd.read_csv('data/polyvore_outfits_features.csv')\n"
        "print('Dimensions:', df.shape)  # Returns (20000, 11)\n"
        "df.head()  # Inspect first 5 rows\n"
        "df.info()  # Check data types and non-null counts"
    )
    t_c71 = Table([[Paragraph(code_71.replace('\n', '<br/>'), code_style)]], colWidths=[504])
    t_c71.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F8FAFC")),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0,0), (-1,-1), 5), ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_c71)
    story.append(Spacer(1, 6))

    # Step 7.2
    story.append(Paragraph("Step 7.2: Data Quality & Missing Value Audit", h2_style))
    story.append(Paragraph("<i>Question: Are there NaNs, duplicate rows, or numbers outside [0.0, 1.0]?</i>", callout_style))
    code_72 = (
        "print('Missing Values per Column:\\n', df.isnull().sum())\n"
        "print('Duplicate Rows:', df.duplicated().sum())\n"
        "print('Values < 0.0:', (df < 0.0).any().any())\n"
        "print('Values > 1.0:', (df > 1.0).any().any())"
    )
    t_c72 = Table([[Paragraph(code_72.replace('\n', '<br/>'), code_style)]], colWidths=[504])
    t_c72.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F8FAFC")),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0,0), (-1,-1), 5), ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_c72)
    story.append(Spacer(1, 6))

    # Step 7.3
    story.append(Paragraph("Step 7.3: Target Variable & Class Balance Check", h2_style))
    story.append(Paragraph("<i>Question: Is the dataset balanced, or does it suffer from severe majority-class skew?</i>", callout_style))
    code_73 = (
        "print(df['is_compatible'].value_counts())\n"
        "print(df['is_compatible'].value_counts(normalize=True) * 100)\n"
        "# Quick barplot: 50% positive (10,000) vs 50% negative (10,000)\n"
        "sns.countplot(x='is_compatible', data=df, palette=['#EF4444', '#10B981'])\n"
        "plt.title('Target Distribution: Clashing (0) vs Stylist (1)')\n"
        "plt.show()"
    )
    t_c73 = Table([[Paragraph(code_73.replace('\n', '<br/>'), code_style)]], colWidths=[504])
    t_c73.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F8FAFC")),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0,0), (-1,-1), 5), ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_c73)
    story.append(Spacer(1, 6))

    # Page Break for Playbook continued
    story.append(PageBreak())

    # Step 7.4
    story.append(Paragraph("Step 7.4: Univariate Analysis (Examining Features Individually)", h2_style))
    story.append(Paragraph("<i>Question: What are the variances and spreads? Are any features completely flat/constant?</i>", callout_style))
    code_74 = (
        "# 1. Statistical spread (mean, standard deviation, quartiles)\n"
        "df.describe().T\n\n"
        "# 2. Critical check: Feature Variance (Identifies zero-variance dead features)\n"
        "variance = df.var()\n"
        "print('Feature Variances:\\n', variance.sort_values())"
    )
    t_c74 = Table([[Paragraph(code_74.replace('\n', '<br/>'), code_style)]], colWidths=[504])
    t_c74.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F8FAFC")),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0,0), (-1,-1), 5), ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_c74)
    story.append(Spacer(1, 6))

    # Step 7.5
    story.append(Paragraph("Step 7.5: Bivariate Analysis (Feature vs. Target Label)", h2_style))
    story.append(Paragraph("<i>Question: Which features actually show mathematical separation between good and bad outfits?</i>", callout_style))
    code_75 = (
        "# 1. Compare feature means grouped by class\n"
        "means = df.groupby('is_compatible').mean().T\n"
        "means['Delta'] = means[1] - means[0]\n"
        "print(means.sort_values(by='Delta', ascending=False))\n\n"
        "# 2. Overlaid Kernel Density Estimation (KDE) plot\n"
        "sns.kdeplot(data=df, x='formality_consistency', hue='is_compatible', common_norm=False)\n"
        "plt.title('Separation Power: Formality Consistency')\n"
        "plt.show()"
    )
    t_c75 = Table([[Paragraph(code_75.replace('\n', '<br/>'), code_style)]], colWidths=[504])
    t_c75.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F8FAFC")),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0,0), (-1,-1), 5), ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_c75)
    story.append(Spacer(1, 6))

    # Step 7.6
    story.append(Paragraph("Step 7.6: Multivariate Analysis & Multicollinearity", h2_style))
    story.append(Paragraph("<i>Question: Are any features redundant, and how does each feature align with the target?</i>", callout_style))
    code_76 = (
        "# 1. Pearson Correlation Matrix\n"
        "corr = df.corr()\n\n"
        "# 2. Heatmap Visualization\n"
        "sns.heatmap(corr, annot=True, fmt='.2f', cmap='coolwarm', vmin=-1, vmax=1)\n"
        "plt.title('Correlation Matrix Heatmap')\n"
        "plt.show()\n\n"
        "# 3. Target Correlation Ranking\n"
        "print('Correlation with Target:\\n', corr['is_compatible'].sort_values(ascending=False))"
    )
    t_c76 = Table([[Paragraph(code_76.replace('\n', '<br/>'), code_style)]], colWidths=[504])
    t_c76.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F8FAFC")),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0,0), (-1,-1), 5), ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_c76)
    story.append(Spacer(1, 6))

    # Step 7.7
    story.append(Paragraph("Step 7.7: Drawing Actionable Conclusions (The Data Science Decision)", h2_style))
    story.append(Paragraph(
        "The manual EDA culminates in documenting actionable engineering decisions before touching model training: "
        "<br/>1. <b>Class Balance:</b> 50/50 balance confirms no synthetic resampling (SMOTE) is needed."
        "<br/>2. <b>Multicollinearity Handling:</b> High correlation between style and formality (r = 0.87) indicates tree models will outperform linear equations."
        "<br/>3. <b>Model Showdown Hierarchy:</b> Validates benchmarking Logistic Regression, Random Forest, and HistGradientBoosting.", body_style
    ))
    story.append(Spacer(1, 8))

    # Section 8: Architectural Conclusions & Signoff
    story.append(PageBreak())
    story.append(Paragraph("8. Architectural Conclusions & Next Steps", h1_style))
    story.append(Paragraph(
        "With the dataset engineered and EDA validated, StyleMate is prepared for model training:", body_style
    ))
    story.append(Paragraph("• <b>Model Training Phase:</b> Execute stratified train/test split (80/20) and benchmark Logistic Regression, Random Forest, and HistGradientBoosting.", bullet_style))
    story.append(Paragraph("• <b>Evaluation Metrics:</b> Measure performance using ROC-AUC, PR-AUC, F1-Score, and Confusion Matrix.", bullet_style))
    story.append(Paragraph("• <b>Model Explainability (SHAP):</b> Compute TreeSHAP attribution to provide human-readable fashion advice to end users.", bullet_style))
    story.append(Paragraph("• <b>App Deployment:</b> Export winning model to <code>outfit_model.pkl</code> and integrate with <code>ranker.py</code>.", bullet_style))

    story.append(Spacer(1, 20))
    signoff_table = Table([
        [Paragraph("<b>Report Generated:</b> November 2026", body_style), Paragraph("<b>Status:</b> Dataset & EDA Validated (Ready for Model Training)", body_style)]
    ], colWidths=[250, 254])
    signoff_table.setStyle(TableStyle([
        ('LINEABOVE', (0,0), (-1,-1), 1, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(signoff_table)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"SUCCESS: Updated PDF generated at: {PDF_OUTPUT_PATH}")

if __name__ == "__main__":
    build_pdf()
