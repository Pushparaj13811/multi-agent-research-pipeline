from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

from app.config import settings


def setup_otel():
    """Set up OpenTelemetry tracing with OTLP exporter."""
    if not settings.enable_otel:
        return

    resource = Resource.create({
        "service.name": "multi-agent-research",
        "service.version": "0.1.0",
    })

    provider = TracerProvider(resource=resource)

    exporter = OTLPSpanExporter(endpoint=settings.otel_exporter_otlp_endpoint)
    processor = BatchSpanProcessor(exporter)
    provider.add_span_processor(processor)

    trace.set_tracer_provider(provider)


def get_tracer():
    return trace.get_tracer("multi-agent-research")
