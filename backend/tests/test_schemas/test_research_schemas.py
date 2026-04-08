import pytest
from pydantic import ValidationError

from app.schemas.research import CreateResearchRequest
from app.schemas.report import ResearchPlan, SectionPlan, Report, ReportSection, SourceCitation


def test_create_research_request_valid():
    req = CreateResearchRequest(query="What are LLM scaling laws?", mode="topic")
    assert req.llm_provider == "openai"


def test_create_research_request_empty_query_rejected():
    with pytest.raises(ValidationError):
        CreateResearchRequest(query="", mode="topic")


def test_create_research_request_invalid_mode_rejected():
    with pytest.raises(ValidationError):
        CreateResearchRequest(query="test", mode="invalid")


def test_research_plan_roundtrip():
    plan = ResearchPlan(
        title="LLM Scaling Laws",
        objective="Research scaling laws",
        sections=[SectionPlan(name="Intro", description="Overview", search_queries=["scaling laws"])],
        search_queries=["LLM scaling laws", "chinchilla scaling"],
        scope="Academic papers and blog posts",
    )
    data = plan.model_dump()
    restored = ResearchPlan.model_validate(data)
    assert restored.title == "LLM Scaling Laws"
    assert len(restored.sections) == 1


def test_report_section_confidence_bounds():
    with pytest.raises(ValidationError):
        ReportSection(name="Test", content="Content", confidence=1.5)


def test_report_structure():
    report = Report(
        title="Test Report",
        summary="Summary",
        sections=[
            ReportSection(
                name="Section 1",
                content="Content here",
                citations=[SourceCitation(url="https://example.com", title="Example", snippet="text")],
                confidence=0.85,
            )
        ],
        key_findings=["Finding 1"],
        sources=[SourceCitation(url="https://example.com", title="Example", snippet="text")],
    )
    assert len(report.sections) == 1
    assert report.sections[0].confidence == 0.85
