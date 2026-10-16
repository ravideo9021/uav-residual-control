# diagrams - index

Rendered figures are in `rendered/` (PNG for documents, SVG for scaling). Editable sources:

* `drawio/*.drawio` - open in diagrams.net (app.diagrams.net or the desktop app).
* `mermaid/*.mmd` - render with mermaid.live, VS Code or GitHub. For hand-laid diagrams the .mmd is generated from the same definition as the .drawio file (same content, automatic layout).

| ID | Diagram | Spec section | Files |
|---|---|---|---|
| D-01 | System context diagram | Section 11 | `D-01_system_context` |
| D-02 | High-level software architecture (layered) | Section 12 | `D-02_architecture` |
| D-03 | UML use-case diagram | Section 8 | `D-03_use_case` |
| D-04 | UML component diagram | Section 12 | `D-04_component` |
| D-05 | UML activity diagram - complete experiment | Section 14 | `D-05_activity_experiment` |
| D-06 | UML sequence diagram - simulation and control loop | Section 14 | `D-06_sequence_control_loop` |
| D-07a | UML class diagram - configuration | Section 13 | `D-07a_class_configuration` |
| D-07b | UML class diagram - simulation and experiments | Section 13 | `D-07b_class_simulation_experiments` |
| D-07c | UML class diagram - controllers, residual model and gate | Section 13 | `D-07c_class_controllers_residual_gate` |
| D-08 | Data-flow diagram (level 1) | Section 14 | `D-08_dataflow` |
| D-09 | Neural-network training and inference workflow | Section 16 | `D-09_nn_workflow` |
| D-10 | Experiment execution workflow (plans) | Section 14 | `D-10_experiment_workflow` |
| D-11 | Requirements traceability matrix diagram | Section 23 | `D-11_traceability_matrix` |
| D-12 | Gated residual control-loop block diagram | Section 15 | `D-12_control_block` |
| D-13 | Implementation schedule (Gantt) | Section 26 | `D-13_gantt` |

Notes:

* D-06, D-10, D-11 and D-13 have Mermaid sources only (no .drawio).
* `rendered/` holds two D-11 renders: `D-11_traceability_matrix` (the matrix figure used in the specification) and
  `D-11_traceability` (the network view rendered from `mermaid/D-11_traceability.mmd`).
* `python tools/build_all.py --diagrams` re-renders every .mmd into `rendered/mermaid/` (git-ignored) with
  mermaid-cli; it never overwrites the hand-laid renders in `rendered/`.
* The diagram list itself lives in `spec/spec_data.py` (DIAGRAMS).
