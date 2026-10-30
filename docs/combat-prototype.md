# Combat on the world map — review prototype

Combat now uses the existing world canvas. No battle scene, illustrated backdrop,
or result dialog is mounted. The camera frames the player and opponent, and the
card tray is overlaid at the bottom. Both remain at their map coordinates while
sword, spell and enemy attack effects travel between them.

## Controls and presentation

- Zoom with the + / − buttons, mouse wheel, touch pinch, or + / − keys.
- Reset/fit with the percentage button or 0. Zoom ranges from 75% to 500%.
- Encounters automatically frame both actors; the previous exploration zoom is
  restored afterwards. Mobile and landscape layouts reserve room for cards.
- Player, villagers, enemies and animals use original coarse pixel-grid sprites
  with bold outlines and limited palettes. Sprite colors keep hair, skin and
  clothing separate for future customization. There is no customization page yet.
- Character movement and the day/night clock pause while cards are committed.

## Rules retained

The shared combat-engine.js resolver is unchanged: secretly committed hands,
simultaneous resolution, no hand-size cap, one use of each card per round,
individual per-fight use limits, three hidden dice per fighter per fight, and no
more than one die per selected card. Player Defense has five uses; bear Dodge
has two and avoids at most one attack when successful. Permanent consumables
are still demonstrated by the practice Ember Seal.

## Outcomes

Real victories keep the player at the encounter location, clear the opponent,
and award the existing gold/XP/relic rewards. Defeat consumes a Vault when
available, or applies the existing XP loss, and returns the player to Hearthstead.
Escape returns to the village while the opponent remains. Results appear as a
map banner, and exploration resumes without a separate screen.

Guided encounter and the practice menu now use actual map locations too.
Practice keeps an exact checkpoint, suppresses autosaving while active, pauses
time, and restores position, exploration, health, inventory and progress on exit.
Practice temporarily uses daylight for visibility and restores the original time.

## Validation

Combat staging recovers overlapping positions by finding a nearby open tile at
least three tiles from the opponent. Exploration cannot step onto a living enemy.
Each fighter has a compact overhead health bar; the header only shows the round,
phase, mana and dice. Sword waves, spell projectiles and tusk crescents travel
across the gap while the actors remain in position. Health changes, hit flashes
and short damage labels coincide with impact. Reduced motion skips the playback.

Run node prototype/combat-check.cjs, node prototype/smoke-check.cjs and
node prototype/access-check.cjs. The smoke check covers real victory rewards,
persistent defeated enemies, Vault return home, map zoom, practice save isolation,
all five outcomes without dialogs, movement pause and the existing regressions.
Build with node prototype/build-pages.cjs and node prototype/bundle.cjs.
This revision remains local pending review.
