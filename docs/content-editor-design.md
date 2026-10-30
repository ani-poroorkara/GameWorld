# MyWorld content editor

Approved direction: JSON game metadata managed through a separate editor available on development computers initially. Private online access can be added later. This first increment delivers a local content authoring workspace for cards, levels, enemies, and drop rules, not the still-undecided Act 1 mechanics.

The catalogue lives in `content/act1.json`, outside the public prototype. A dependency-free Node server binds only to loopback and serves the editor on port 4180. The editor provides searchable forms, card previews, level rows, reward references, validation, JSON export, and explicit disk saving. Reload/revert restores the disk copy. Writes require a same-origin request, a server token, and a matching content revision. Saves are validated, backed up locally, and replaced atomically. The server never accepts a client-supplied filesystem path.

Import the 14 named Act 1 cards, known enemies, confirmed acquisition rules, and undecided thief drops. Unknown card stats and drop probabilities are null and labelled undecided. A structurally valid draft may be saved; it is not thereby approved for gameplay. Quantities are player inventory state, not catalogue defaults. Levels are supported as metadata without inventing upgrade recipes, caps, or benefits.

The playable prototype and its saves remain unchanged in this increment. The UI explicitly identifies the workspace as a draft catalogue; gameplay integration and publishing are later steps. No editor files, backups, or write service enter the public Pages build. No cloud deployment or authentication scheme is introduced.

The same validation module runs in browser and server. It checks IDs, references, types, ranges, duplicate levels, finite stats, per-fight limits, probability and quantity ranges, and missing values in confirmed drops. JSON data is rendered as text rather than executable markup. The server rejects off-origin writes and stale saves; the UI preserves the unsaved draft after validation, conflict, or network failure.
