from pydantic import BaseModel, Field


class SectionPlan(BaseModel):
    name: str
    description: str
    search_queries: list[str] = Field(default_factory=list)


class ResearchPlan(BaseModel):
    title: str
    objective: str
    sections: list[SectionPlan]
    search_queries: list[str]
    scope: str


class SourceCitation(BaseModel):
    url: str
    title: str
    snippet: str


class ReportSection(BaseModel):
    name: str
    content: str
    citations: list[SourceCitation] = Field(default_factory=list)
    confidence: float = Field(ge=0.0, le=1.0)


class Report(BaseModel):
    title: str
    summary: str
    sections: list[ReportSection]
    key_findings: list[str]
    sources: list[SourceCitation]


class SearchResultSchema(BaseModel):
    url: str
    title: str
    snippet: str
    source: str
    relevance_score: float = 0.0

    model_config = {"from_attributes": True}


class ExtractedContentSchema(BaseModel):
    url: str
    extraction_method: str
    summary: str
    key_findings: list[str] = Field(default_factory=list)

    model_config = {"from_attributes": True}
