# MyWorld — Act 1

Design notes for review · October 28, 2026

This document captures the current discussion. It is a working design, not a record of implemented changes. Names marked as placeholders and unresolved details remain open for review.

## Direction

Act 1 is the first stage of MyWorld. Expand the world map substantially and add encounters, exploration rewards, puzzles, and events that advance the story. The following story outline was added during the review; dialogue and detailed staging remain to be written.

Every item in the game is represented by a card. For now, food has only two options: Apple and Steak.

### Food in combat

Apple and Steak cards can be used during combat; food is not restricted to exploration. Apple restores **5 HP** and Steak restores **15 HP**, using the current **60 HP maximum** as the initial balance baseline. Each use consumes one food card and decreases its quantity by one. These are starting values that may be tuned after playtesting. Exact healing resolution behavior still needs definition. Preserve the established simultaneous card commitment and resolution rules unless explicitly changed.

## Event types

| Event | Purpose |
| --- | --- |
| Combat | Encounters with villains and other opponents. |
| Puzzle | Challenges in the world; individual puzzles and rewards are still to be designed. |
| Chest | Hidden chests in the forest that give additional cards. |
| Story | Events that progress the story described below. |

## Chest hints and exploratory ideas

The player may receive optional hints about hidden chests by speaking with NPCs. This direction is approved; the exact hints and chest locations are still to be written.

Chests could also contain tips about game systems. The user proposed combining five cards to create a leveled-up card as an idea to explore, explicitly not a fully considered mechanic. Do not implement or treat card combining as confirmed yet. Card eligibility, costs, results, and whether combining belongs in Act 1 remain unresolved.

Confirmed reward progression: the Stone Staff is awarded after defeating the cave monster. Stone Throw is acquired separately from a chest; obtaining the Staff does not automatically unlock it. Stone Block remains a special chest reward after the cave fight. Stone Throw's chest location and whether it shares a chest with another reward remain unspecified. Other chests can contain existing cards, supplies, or tips. The five-card upgrade idea remains deferred. “Stone Wall” was mentioned during discussion, but is not confirmed as a separate card or a replacement name for Stone Block.

Detailed card-drop design is parked for a later discussion. The Bow is a chance-based thief drop, not a guaranteed reward from the first defeated thief. Do not assume a drop probability, first-drop guarantee, or protection against unlucky runs until those rules are discussed.

## Animal encounters

After defeating an animal, the player chooses whether to spare it or kill it. Choosing to kill it provides **exactly one Steak card**, regardless of animal size or species. A spared animal leaves peacefully, provides no Steak, and stays cleared from that location.

## Act 1 card list and acquisition

| Category | Card | How the player obtains it |
| --- | --- | --- |
| Attack | Punch | Basic card the player already has at the start. |
| Attack | Pickaxe | Found in the player's house. |
| Attack | Stone Staff | Awarded after defeating the cave monster in the forbidden area. Does not automatically unlock Stone Throw. |
| Attack | Bow | A chance-based drop from defeated thieves, not guaranteed from the first thief. Detailed drop rules are deferred. Each Bow attack consumes one Arrow. |
| Attack | Stone Throw — placeholder name | Acquired separately from a chest, not automatically with the Stone Staff. Chest placement and a better card name remain undecided. |
| Defense | Shield | Found in the player's house. |
| Defense | Hand Block | Basic card the player already has at the start. |
| Defense | Stone Block | Found in a chest while searching the area after defeating the cave villain. |
| Utility | Apple | Picked up from the farm. Restores 5 HP; usable during combat; consumes one card per use. |
| Utility | Steak | Killing a defeated animal gives exactly one card, regardless of species or size. Restores 15 HP; usable during combat; consumes one card per use. |
| Utility | Pet Distraction | Unlocked when the player takes on a pet. Usable once per fight, whether it succeeds or fails; the use resets for the next fight. Has a 50% chance to distract the enemy and make one enemy attack miss that round; otherwise it has no effect. |
| Utility | Arrows | Random drops from thieves, in quantities between 5 and 10. Each Bow attack consumes one Arrow. The chance of a drop is not yet specified. |
| Utility | Map Card | Given by the village's map-giver. Reveals only that village's local map, not other settlements or the whole world. Each settlement has its own map-giver and Map Card; obtaining another settlement's card unlocks its additional map. Exact boundaries remain to be defined. |

The starting cards are **Punch and Hand Block**. The spoken reference to starting with Shield was immediately corrected to Hand Block. **Pickaxe and Shield** are in the house.

### Quantities and presentation

Repeated copies of a card are represented by a quantity number on top of the card, rather than a visual stack. Arrow drops increase the displayed quantity, and Bow attacks decrease it by one. Card artwork and detailed visual design will be addressed later. This quantity rule does not by itself change the existing restriction against playing the same card type twice in a round.

Duplicate equipment drops also increase the card quantity. Cards will have levels, tracked separately from quantity. The leveling method, benefits, Act 1 level cap, and ownership of different-level copies remain undecided; combining five matching cards is not yet an approved recipe.

### Content management

Manage game definitions as JSON metadata through a separate editor. Local computer access is acceptable initially; private online access may be added later. The first local authoring workspace is documented in `content-editor-design.md` and `../editor/README.md`. It edits the Act 1 draft catalogue, with explicit saving, validation, previews and backups, without changing the current playable prototype. Quests, NPC authoring, map editing and gameplay integration follow in later increments.

## Confirmed Act 1 card scope

Act 1 includes **all 13 named cards**: 5 attack, 3 defense, and 5 utility, **plus the Quest Card** described below. This supersedes the earlier proposed limit of 10. Additional card types will be introduced in later acts.

The **Quest Card** appears automatically when the player accepts a quest; it is not given by an NPC and is not solely a completion reward. Its details update as the quest progresses, including what the player should do next. For the main search, its working title is **Save the Kid**; the final name is undecided. There are **14 named entries in the Act 1 scope**, including this quest. Stone Staff and Stone Throw are both included; their equipment and ability interaction still needs definition. Smaller quests may introduce further quest cards; their exact list remains to be designed. Keeping completed Quest Cards as keepsakes was suggested but is not yet confirmed; completion rewards also remain undecided.

## Village people

- Every NPC should have a distinct personality. Develop their names, personalities, and dialogue as the story grows rather than finalizing the entire cast now.
- Every settlement has a **map-giver**, who provides that settlement's local Map Card.
- Every village has a **card guide**, whom the player can ask what a card is and how to use it. The card guide and map-giver are separate roles and people.
- Create a broader cast of villagers for the player to interact with, including conversations about the main search and other topics.
- Familiar service roles can recur across settlements while the people filling them have individual personalities.

## Story outline

1. **A peaceful home.** The opening presents a happy village, its farm, and residents living well.
2. **A child disappears.** A neighbor's son is kidnapped. This reminds the player of their own son, who was lost long before the player came to the village. The fate and whereabouts of the player's son are not yet established.
3. **Choose whether to help.** The player can agree or decline to search for the neighbor's child. Accepting unlocks the Quest Card. Declining leaves the player free to explore and return to accept the quest later.
4. **Speak with the village.** Villagers express sadness and offer tips through conversations. Dialogue offers a choice between discussing the quest and other topics. The player returns home and retrieves the Pickaxe and Shield from the house or garage, unlocking those cards. The exact storage location is undecided.
5. **A thief's lead.** Thieves appear only on roads. Defeated thieves may drop the Bow; it is not a guaranteed first-thief reward. A road encounter with a thief supplies the lead about strange things and a child seen near an old cave in the forbidden area. Whether that thief also drops the Bow remains undecided; detailed card-drop design is deferred.
6. **The cave is alive.** The player reaches the old cave and discovers that the cave itself is a monster. Defeating it awards the Stone Staff, without automatically unlocking Stone Throw.
7. **Search the area.** After defeating the cave villain, continued exploration leads to a chest containing Stone Block. Stone Throw is also acquired from a chest, whose exact location remains undecided.
8. **The northern passage.** Act 1 culminates near the beginning of a northern mountain passage, with an air monster as the final opponent. The monster presents the choice: save the player's own missing child or save the neighbor's child. **Act 1 ends when the dilemma is presented; the player's decision belongs to Act 2.** How the revelation works remains open.

This is the agreed outline, not finished dialogue. Do not invent the children's locations, the kidnapper's identity, or the outcome of the final choice.

## World layout draft

The intended structure has three nested regions enclosed by mountains:

- **Center — village and farm:** the safe, happy settlement, homes, and villagers. The spoken working village name was “Hedonville”; spelling and any additional words await the user's written confirmation.
- **Middle — forest:** animals and hidden chests. Thieves appear **only on roads**, not in forest clearings or other off-road areas. The spoken working forest name sounded like “Brick on Trees”; its spelling is unconfirmed.
- **Outer — forbidden area:** visibly cracked ground, later known as **Cracked Lands**, subject to spelling confirmation. The old cave monster is here.
- **Boundary — mountains:** surrounding the whole area, with **nine passages** leading to further places. Although informally called portals, they are extensions of the map: crossing one unlocks another map rather than acting as a magical teleport. The Act 1 ending occurs at a northern passage.

This is a conceptual layout. Exact shape, scale, routes, passage placement, and a visual map draft remain to be designed. Place the thief lead on a road; its precise location is still to be chosen. Thieves must not spawn off-road, including in Cracked Lands.

## Details still to define

### Smaller quests and world density

Confirmed requirement: expand the map considerably and add smaller quests between the main story events. The larger world should offer more activity and discovery, rather than merely longer travel. Quest objectives are represented by cards.

The following are suggestions for review, not confirmed story requirements:

- **A runaway farm animal:** follow clues, find it, and guide it home. Introduces animal interaction before dangerous encounters.
- **Trouble with irrigation:** solve a small water-channel puzzle at the farm as a low-stakes introduction to puzzles.
- **The blocked footpath:** use the Pickaxe to reopen a useful route and shorten the return journey.
- **A hidden forest cache:** follow environmental clues to a chest, with an optional puzzle guarding it. Rewards come from the agreed card pool.

Suggested placement: branching routes between the village, forest, and Cracked Lands, supporting the main search. Exact locations, rewards, duration, and acceptance remain undecided.

### Puzzle design — parked for a later session

The user likes all five proposed puzzle concepts: Farmer's Channels, Three Witnesses, Changing Forest, Stone Mechanism, and Northern Passage. Retain them as the proposed Act 1 puzzle set. Detailed layouts, rules, layered solutions, rewards, and whether the basic irrigation puzzle has unlimited retries are deferred at the user's request. Their proposed placement is village farm, village conversations, forest, Cracked Lands, and northern passage respectively. These are concepts, not finished or implemented puzzles.

### Remaining non-puzzle decisions

- Final spellings of village, forest, and forbidden-area names.
- Full dialogue, village Map Card giver, exact road location of the thief lead, and the final revelation. Declining allows later acceptance, and the ending choice is deferred to Act 2.
- Larger map dimensions and layout.
- Hidden chest locations and contents, including the Stone Throw chest; Stone Block is in a chest after the cave fight.
- Detailed card-drop rules — parked for later discussion, including Bow probability and Arrow drop behavior.
- Card power, use limits, consumption, and ability effects.

## Scope of this note

These are newly captured Act 1 requirements. They do not silently change previously agreed combat rules. Any changes to those rules should be discussed separately.
