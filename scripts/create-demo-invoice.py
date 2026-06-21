from pathlib import Path
from shutil import copyfile

from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "factorfi-demo-invoice.pdf"
PUBLIC_COPY = ROOT / "web" / "public" / "factorfi-demo-invoice.pdf"

INK = HexColor("#172033")
NAVY = HexColor("#14213D")
COBALT = HexColor("#2457E6")
EMERALD = HexColor("#1FA977")
AMBER = HexColor("#F4B942")
PAPER = HexColor("#FBFCFA")
MIST = HexColor("#EDF1F5")
MUTED = HexColor("#667085")
WHITE = HexColor("#FFFFFF")


def draw_text(c, text, x, y, size=9, color=INK, font="Helvetica", align="left"):
    c.setFillColor(color)
    c.setFont(font, size)
    if align == "right":
        c.drawRightString(x, y, text)
    else:
        c.drawString(x, y, text)


def draw_paragraph(c, text, x, y, width, height, size=9, color=INK, leading=13, align=TA_LEFT):
    style = ParagraphStyle(
        "invoice",
        fontName="Helvetica",
        fontSize=size,
        leading=leading,
        textColor=color,
        alignment=align,
    )
    paragraph = Paragraph(text, style)
    paragraph.wrapOn(c, width, height)
    paragraph.drawOn(c, x, y - paragraph.height)


def create_invoice():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    width, height = A4
    c = canvas.Canvas(str(OUTPUT), pagesize=A4)
    c.setTitle("FactorFi Demo Invoice")
    c.setAuthor("Northline Studio Ltd")
    c.setSubject("Uploadable invoice for the FactorFi Sui testnet demo")

    c.setFillColor(PAPER)
    c.rect(0, 0, width, height, fill=1, stroke=0)

    c.setFillColor(NAVY)
    c.rect(0, height - 42 * mm, width, 42 * mm, fill=1, stroke=0)
    c.setFillColor(COBALT)
    c.rect(0, height - 42 * mm, 8 * mm, 42 * mm, fill=1, stroke=0)
    c.setFillColor(EMERALD)
    c.roundRect(width - 26 * mm, height - 24 * mm, 8 * mm, 2 * mm, 1 * mm, fill=1, stroke=0)

    draw_text(c, "NORTHLINE", 18 * mm, height - 18 * mm, 18, WHITE, "Helvetica-Bold")
    draw_text(c, "STUDIO LTD", 18 * mm, height - 25 * mm, 8, HexColor("#BFD0FF"), "Helvetica-Bold")
    draw_text(c, "INVOICE", width - 18 * mm, height - 19 * mm, 24, WHITE, "Helvetica-Bold", "right")
    draw_text(c, "Prepared for FactorFi testnet financing", width - 18 * mm, height - 27 * mm, 8, HexColor("#DDE5FF"), align="right")

    top = height - 58 * mm
    draw_text(c, "FROM", 18 * mm, top, 7, COBALT, "Helvetica-Bold")
    draw_text(c, "Northline Studio Ltd", 18 * mm, top - 7 * mm, 11, INK, "Helvetica-Bold")
    draw_paragraph(
        c,
        "14 Market Street<br/>Bengaluru, Karnataka 560001<br/>billing@northline.example",
        18 * mm,
        top - 11 * mm,
        70 * mm,
        30 * mm,
        8,
        MUTED,
        12,
    )

    detail_x = width - 77 * mm
    details = [
        ("Invoice number", "FFI-2026-0621"),
        ("Issue date", "21 June 2026"),
        ("Due date", "21 July 2026"),
        ("Terms", "Net 30"),
    ]
    for index, (label, value) in enumerate(details):
        row_y = top - index * 8 * mm
        draw_text(c, label, detail_x, row_y, 7, MUTED, "Helvetica-Bold")
        draw_text(c, value, width - 18 * mm, row_y, 8, INK, "Helvetica-Bold", "right")

    bill_y = height - 104 * mm
    c.setFillColor(MIST)
    c.roundRect(18 * mm, bill_y - 27 * mm, width - 36 * mm, 31 * mm, 3 * mm, fill=1, stroke=0)
    draw_text(c, "BILL TO", 24 * mm, bill_y - 5 * mm, 7, COBALT, "Helvetica-Bold")
    draw_text(c, "Demo Buyer Ltd", 24 * mm, bill_y - 13 * mm, 12, INK, "Helvetica-Bold")
    draw_text(c, "Accounts Payable - Bengaluru, India", 24 * mm, bill_y - 20 * mm, 8, MUTED)
    draw_text(c, "Reference", width - 63 * mm, bill_y - 5 * mm, 7, MUTED, "Helvetica-Bold")
    draw_text(c, "PO-FACTORFI-05", width - 24 * mm, bill_y - 13 * mm, 8, INK, "Helvetica-Bold", "right")
    draw_text(c, "Currency", width - 63 * mm, bill_y - 20 * mm, 7, MUTED, "Helvetica-Bold")
    draw_text(c, "DUSDC", width - 24 * mm, bill_y - 20 * mm, 8, INK, "Helvetica-Bold", "right")

    table_top = height - 149 * mm
    c.setFillColor(NAVY)
    c.roundRect(18 * mm, table_top - 10 * mm, width - 36 * mm, 11 * mm, 2 * mm, fill=1, stroke=0)
    draw_text(c, "DESCRIPTION", 23 * mm, table_top - 6.5 * mm, 7, WHITE, "Helvetica-Bold")
    draw_text(c, "QTY", width - 75 * mm, table_top - 6.5 * mm, 7, WHITE, "Helvetica-Bold", "right")
    draw_text(c, "RATE", width - 46 * mm, table_top - 6.5 * mm, 7, WHITE, "Helvetica-Bold", "right")
    draw_text(c, "AMOUNT", width - 23 * mm, table_top - 6.5 * mm, 7, WHITE, "Helvetica-Bold", "right")

    item_y = table_top - 24 * mm
    draw_text(c, "Product design consultation", 23 * mm, item_y, 10, INK, "Helvetica-Bold")
    draw_text(c, "Discovery session and receivables workflow review", 23 * mm, item_y - 6 * mm, 8, MUTED)
    draw_text(c, "1", width - 75 * mm, item_y, 9, INK, align="right")
    draw_text(c, "5.00", width - 46 * mm, item_y, 9, INK, align="right")
    draw_text(c, "5.00", width - 23 * mm, item_y, 9, INK, "Helvetica-Bold", "right")
    c.setStrokeColor(MIST)
    c.setLineWidth(0.8)
    c.line(18 * mm, item_y - 13 * mm, width - 18 * mm, item_y - 13 * mm)

    totals_y = item_y - 34 * mm
    label_x = width - 76 * mm
    value_x = width - 23 * mm
    draw_text(c, "Subtotal", label_x, totals_y, 8, MUTED)
    draw_text(c, "5.00 DUSDC", value_x, totals_y, 9, INK, "Helvetica-Bold", "right")
    draw_text(c, "Tax", label_x, totals_y - 8 * mm, 8, MUTED)
    draw_text(c, "0.00 DUSDC", value_x, totals_y - 8 * mm, 9, INK, "Helvetica-Bold", "right")
    c.setFillColor(COBALT)
    c.roundRect(label_x - 4 * mm, totals_y - 25 * mm, width - label_x - 19 * mm, 12 * mm, 2 * mm, fill=1, stroke=0)
    draw_text(c, "TOTAL DUE", label_x, totals_y - 21 * mm, 8, WHITE, "Helvetica-Bold")
    draw_text(c, "5.00 DUSDC", value_x, totals_y - 21 * mm, 11, WHITE, "Helvetica-Bold", "right")

    terms_y = 70 * mm
    draw_text(c, "PAYMENT TERMS", 18 * mm, terms_y, 7, COBALT, "Helvetica-Bold")
    draw_paragraph(
        c,
        "Payment is due within 30 days of issue. This receivable may be financed through FactorFi. Supporting documentation is attached to the corresponding Walrus blob and Sui invoice object.",
        18 * mm,
        terms_y - 5 * mm,
        105 * mm,
        34 * mm,
        8,
        MUTED,
        12,
    )

    remittance_bottom = 34 * mm
    c.setFillColor(HexColor("#FFF7E1"))
    c.roundRect(width - 72 * mm, remittance_bottom, 54 * mm, 29 * mm, 3 * mm, fill=1, stroke=0)
    draw_text(c, "REMITTANCE", width - 66 * mm, remittance_bottom + 22 * mm, 7, HexColor("#9A6700"), "Helvetica-Bold")
    draw_paragraph(
        c,
        "Settlement currency<br/><b>DUSDC on Sui Testnet</b><br/>Wallet supplied during demo",
        width - 66 * mm,
        remittance_bottom + 18 * mm,
        43 * mm,
        24 * mm,
        8,
        INK,
        12,
    )

    c.setStrokeColor(MIST)
    c.line(18 * mm, 27 * mm, width - 18 * mm, 27 * mm)
    draw_text(c, "DEMO ARTIFACT", 18 * mm, 18 * mm, 7, EMERALD, "Helvetica-Bold")
    draw_text(c, "Prepared for the FactorFi Sui testnet workflow", 49 * mm, 18 * mm, 7, MUTED)
    draw_text(c, "Page 1 of 1", width - 18 * mm, 18 * mm, 7, MUTED, align="right")

    c.showPage()
    c.save()
    PUBLIC_COPY.parent.mkdir(parents=True, exist_ok=True)
    copyfile(OUTPUT, PUBLIC_COPY)
    print(OUTPUT)


if __name__ == "__main__":
    create_invoice()
