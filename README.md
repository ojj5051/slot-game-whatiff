# Mahjong Slot Game

A web-based Mahjong-style slot game built with **Phaser 3** and **TypeScript**.

The game features a 5×5 slot grid, Mahjong-inspired symbols, left-to-right winning conditions, cascading wins, win multipliers, free symbols, and free spins.

## Features

* 5×5 slot grid
* Mahjong-inspired symbols

  * `1萬` – `9萬`
  * `1筒` – `9筒`
  * `中`
  * `發`
  * `白`
* Left-to-right win detection
* Minimum 3 consecutive columns required for a win
* Multiple matching symbols in the same column can contribute to a win
* Winning tile highlighting
* Winning tile removal
* streak system
* New symbols generated after winning tiles are removed
* streak win multiplier

  * 1×
  * 2×
  * 3×
  * 4× maximum
* Free symbol
* 3 or more frees trigger 12 free spins
* Maximum 1 free per column
* Free symbols are disabled during free spins
* Free-spin counter
* Balance and betting system
* Win amount display
* Betting range: 1 ~ 10

## Tech Stack

* Phaser 3
* TypeScript
* JavaScript
* HTML5
* Web browser

## Game Layout

The game uses a 5×5 grid.

The grid is stored in **column-major order**:

```text
grid[col][row]
```

For example:

```text
Column 0
[
  "3萬",
  "8筒",
  "5萬",
  "中",
  "9筒"
]
```

represents:

```text
Row 0 → 3萬
Row 1 → 8筒
Row 2 → 5萬
Row 3 → 中
Row 4 → 9筒
```

## Winning System

A symbol wins when it appears in consecutive columns starting from the leftmost column.

The minimum number of columns required is **3**.

For example:

```text
Column 0   Column 1   Column 2

  3萬         3萬         3萬
```

is a win.

The matching symbols do **not** need to be on the same row.

For example:

```text
Column 0   Column 1   Column 2   Column 3

  3萬         8筒         5萬         中
  8筒         3萬         6萬         3萬
  5萬         7筒         3萬         1筒
  中          4萬         1筒         3萬
  9筒         白           中          7筒
```

`3萬` appears in columns 0–3, so it qualifies as a win.

## Win Calculation

The basic win calculation is:

```text
Win = Number of Winning Tiles × Bet × Streak Multiplier
```

The streak multiplier starts at:

```text
1×
```

After a successful streak it increases:

```text
1× → 2× → 3× → 4×
```

The maximum multiplier is 4×.

Example:

```text
Winning tiles = 5
Bet = 10
Multiplier = 2×

Win = 5 × 10 × 2
    = 100
```

## Streak System

After winning tiles are detected:

1. Winning tiles are removed.
2. Remaining symbols are moved down.
3. New symbols are generated at the top.
4. The board is checked again.
5. If another win is found, another streak occurs.
6. The multiplier increases up to 4×.
7. The process ends when there are no more wins.

Example:

```text
Spin
 ↓
Win
 ↓
Remove winning tiles
 ↓
Generate new tiles
 ↓
Check for another win
 ↓
Win?
 ├── Yes → streak
 └── No  → Finish
```

## Free Spins

The game contains a special `FREE` symbol.

Three or more FREE trigger:

```text
12 FREE SPINS
```

### Free Spin Rules

* FREE can appear during normal spins.
* A maximum of **one FREE is allowed per column**.
* Up to 5 FREE can therefore appear on a 5-column board.
* FREE do not need to form a normal winning combination.
* FREE are not generated during free spins.
* FREE detection is performed on normal spins.

Example:

```text
Column 0   Column 1   Column 2   Column 3   Column 4

FREE       5萬        7筒        FREE       3萬
  2萬      FREE       4萬          中       6筒
  8筒        1筒      FREE         5萬       2萬
```

This contains 4 FREE and therefore triggers free spins.

## Free Spin System

When 3 or more FREE are detected:

```text
freeSpins += 12
```

The game enters free-spin mode:

```ts
isFreeSpin = true;
```

During free spins:

* The bet is not deducted.
* The streak system continues to work.
* The streak multiplier continues to work.
* FREE symbols cannot be generated.
* The free-spin counter shows the remaining spins.

Example:

```text
FREE SPINS LEFT: 12

FREE SPINS LEFT: 11

FREE SPINS LEFT: 10

...

FREE SPINS LEFT: 1

FREE SPINS END
```

After all free spins are completed:

```ts
isFreeSpin = false;
```

The game returns to normal spin mode.

## Symbol Pools

Normal spins use:

```ts
const SYMBOLS = [
  ...NORMAL_SYMBOLS,
  FREE,
];
```

Free spins use:

```ts
const FREE_SPIN_SYMBOLS = NORMAL_SYMBOLS;
```

This prevents FREE from appearing during free spins.

The symbol generation also ensures that a normal-spin column cannot contain more than one FREE.

## Balance System

Normal spins deduct the bet:

Balance = Balance - Bet

Free spins do not deduct the bet.

Winning amounts are added back to the balance:

Balance = Balance + Win

The balance UI is updated after balance changes.

## Game Flow

1. The user clicks the **SPIN** button.
2. Bet is deducted.
3. All columns spin simultaneously.
4. Symbols land in final positions.
5. Check for wins.
   - If wins are found:
     - Highlight winning tiles.
     - Calculate win amount.
     - Add win to balance.
     - Keep multiplier if already active.
     - Trigger streak:
       1. Remove winning tiles.
       2. Move remaining tiles down.
       3. Generate new symbols at the top.
     - Repeat win check.
   - If no wins are found:
     - Reset multiplier.
     - Enable **SPIN** button.
6. If 3 or more FREE symbols are present:
   - Award 12 free spins.
   - Start free-spin mode.
7. Free-spin mode:
   - Spin 12 times.
   - Bet is not deducted.
   - Wins use streak multiplier.
   - FREE symbols cannot be generated.
8. After free spins end:
   - Return to normal mode.

## Game States

The game has three main states:

1. Normal (initial state)
2. Free Spin (after free trigger)
3. Animation (during streak and win processing)

## Win Detection

Wins are detected left-to-right:

* Minimum 3 columns required.
* Consecutive columns only.
* Multiple symbols per column contribute.

Valid winning combinations (example):

Column 1 | Column 2 | Column 3 | Column 4 | Column 5
--------|--------|--------|--------|--------
7筒 | 7筒 | 7筒 | 7筒 | 7筒
2萬 | 2萬 | 2萬 | - | -
3筒 | 3筒 | 3筒 | - | -
6筒 | 6筒 | 6筒 | - | -
5萬 | 5萬 | 5萬 | - | -

These all count as a 5-column win.

## Payout System

Payouts are calculated using:

```ts
Win = Number of Winning Tiles × Bet × Streak Multiplier
```

Payout examples (assuming BET = 10):

| Winning Tiles | Streak Multiplier | Calculation      | Total Win |
| ------------- | ----------------- | ---------------- | --------- |
| 3             | 1×                | 3 × 10 × 1       | 30        |
| 4             | 1×                | 4 × 10 × 1       | 40        |
| 5             | 1×                | 5 × 10 × 1       | 50        |
| 3             | 2×                | 3 × 10 × 2       | 60        |
| 4             | 3×                | 4 × 10 × 3       | 120       |
| 5             | 4×                | 5 × 10 × 4       | 200       |

## Randomness

Random symbol generation uses the PRNG:

```ts
PRNG Seed → Random Numbers → Symbol Selection
```

For development:

```ts
// Use a fixed seed to ensure reproducible results
Math.seedrandom(SEED);
```

## UI Elements

The UI includes:

- **SPIN** button
- Bet amount display
- Win amount display
- Balance display
- Streak counter
- Free spins counter
- Game grid

## Technical Details

### Symbol Generation

The symbol generation uses a random selection algorithm that prevents more than one FREE per column.

### Grid Data Structure

The slot grid is stored as a 2D array:

```ts
type Grid = string[][];
```

Where `grid[column][row]` holds the symbol.

### Animation Sequence

1. Spin start
2. Symbol animation
3. Check wins
4. If win → show win tiles
5. If cascade → remove, shift, generate new
6. Repeat win check until no more wins
7. Award free spins if applicable
8. Enable **SPIN** button
