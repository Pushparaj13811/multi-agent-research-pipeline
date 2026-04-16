import io

import markdown


def markdown_to_pdf(markdown_text: str) -> bytes:
    """Convert markdown text to PDF bytes. WeasyPrint imported lazily."""
    from weasyprint import HTML

    html_content = markdown.markdown(
        markdown_text,
        extensions=["tables", "fenced_code", "toc"],
    )

    styled_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Helvetica', 'Arial', sans-serif; margin: 40px; line-height: 1.6; color: #333; }}
            h1 {{ color: #1a1a2e; border-bottom: 2px solid #1a1a2e; padding-bottom: 10px; }}
            h2 {{ color: #16213e; margin-top: 30px; }}
            h3 {{ color: #0f3460; }}
            p {{ margin-bottom: 12px; }}
            blockquote {{ border-left: 4px solid #e94560; padding-left: 16px; color: #555; }}
            table {{ border-collapse: collapse; width: 100%; margin: 20px 0; }}
            th, td {{ border: 1px solid #ddd; padding: 8px 12px; text-align: left; }}
            th {{ background-color: #1a1a2e; color: white; }}
            a {{ color: #0f3460; }}
            code {{ background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }}
        </style>
    </head>
    <body>{html_content}</body>
    </html>
    """

    pdf_buffer = io.BytesIO()
    HTML(string=styled_html).write_pdf(pdf_buffer)
    return pdf_buffer.getvalue()
