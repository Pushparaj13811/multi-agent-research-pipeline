from app.agents.graph import build_research_graph


def test_graph_compiles():
    graph = build_research_graph()
    assert graph is not None
    node_names = list(graph.nodes.keys())
    assert "planner" in node_names
    assert "searcher" in node_names
    assert "reader" in node_names
    assert "writer" in node_names
