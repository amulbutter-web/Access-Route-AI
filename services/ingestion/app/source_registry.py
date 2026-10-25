"""Allowlisted public sources. Add a source only after permission and entity mapping review."""
from .models import SourceDefinition

# This is intentionally a *candidate* metro scenario, not evidence about any current lift state.
# It remains separate from the IIIT Delhi campus pilot until a demo scope change is approved.
SOURCES = {
    "dmrc_govindpuri_candidate": SourceDefinition(
        id="dmrc_govindpuri_candidate",
        publisher="Delhi Metro Rail Corporation",
        url="https://delhimetrorail.com/",
        allowed_hosts=("delhimetrorail.com", "www.delhimetrorail.com"),
        entity_id="govindpuri_metro_lift_1",
        edge_id="metro:govindpuri:lift:1",
    )
}
