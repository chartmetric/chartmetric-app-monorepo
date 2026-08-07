"""In-repo AI-development harness.

Package layout (one module per concern):

    context.py    repo paths, config access, shared constants
    state.py      phase JSON load/save, statuses, stage order
    docs_gate.py  precheck — substantive-content gate on required docs
    lint.py       pre-flight phase validation (no agents spawned)
    agents.py     agent command resolution + subprocess spawning
    runner.py     writer retry loop, verification, gates, smoke
    review.py     fresh-context blocking review stage
    retro.py      retro schema validation + agent drafting
    pipeline.py   the one-shot `run` pipeline + commit stage
    cli.py        argparse wiring and thin cmd_* handlers

`scripts/execute.py` is the CLI entry point and delegates to cli.main.
"""
