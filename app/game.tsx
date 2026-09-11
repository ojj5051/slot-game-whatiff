import Phaser from "phaser";

const FREE = "FREE";

const NORMAL_SYMBOLS = [
  "1萬",
  "2萬",
  "3萬",
  "4萬",
  "5萬",
  "6萬",
  "7萬",
  "8萬",
  "9萬",

  // "1筒",
  // "2筒",
  // "3筒",
  // "4筒",
  // "5筒",
  // "6筒",
  // "7筒",
  // "8筒",
  // "9筒",

  // "中",
  // "發",
  // "白",
];

const SYMBOLS = [...NORMAL_SYMBOLS, FREE];

const FREE_SPIN_SYMBOLS = [...NORMAL_SYMBOLS];

const COLS = 5;
const ROWS = 5;

const TILE_SIZE = 90;

const START_X = 270;
const START_Y = 150;

class SlotScene extends Phaser.Scene {
  private grid: Phaser.GameObjects.Text[][] = [];

  private spinning = false;

  private balance = 1000;
  private bet = 10;

  private streakMultiplier = 1;

  private freeSpins = 0;
  private isFreeSpin = false;

  private balanceText!: Phaser.GameObjects.Text;
  private winText!: Phaser.GameObjects.Text;
  private freeSpinText!: Phaser.GameObjects.Text;

  constructor() {
    super("SlotScene");
  }

  private getRandomSymbolForColumn(hasScatter: boolean): {
    symbol: string;
    hasScatter: boolean;
  } {
    // Free spins: never generate scatter
    if (this.isFreeSpin) {
      return {
        symbol: Phaser.Utils.Array.GetRandom(FREE_SPIN_SYMBOLS),
        hasScatter,
      };
    }

    // Normal spin: maximum 1 scatter per column
    if (!hasScatter && Math.random() < 0.15) {
      return {
        symbol: FREE,
        hasScatter: true,
      };
    }

    return {
      symbol: Phaser.Utils.Array.GetRandom(NORMAL_SYMBOLS),
      hasScatter,
    };
  }

  create() {
    this.createBackground();
    this.createTitle();
    this.createBalance();
    this.createGrid();
    this.createSpinButton();
    this.createTestButton();
  }

  // -----------------------------
  // Background
  // -----------------------------

  createBackground() {
    this.cameras.main.setBackgroundColor("#171426");

    this.add.rectangle(450, 330, 520, 500, 0x261f3d);

    this.add.rectangle(450, 330, 470, 450, 0x15111f);
  }

  // -----------------------------
  // Title
  // -----------------------------

  createTitle() {
    this.add
      .text(450, 35, "🀄 MAHJONG FORTUNE 🀄", {
        fontSize: "36px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
  }

  // -----------------------------
  // Balance
  // -----------------------------

  createBalance() {
    this.balanceText = this.add
      .text(450, 80, `Balance: ${this.balance}    Bet: ${this.bet}`, {
        fontSize: "22px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.winText = this.add
      .text(450, 570, "", {
        fontSize: "28px",
        color: "#ffd700",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.freeSpinText = this.add.text(150, 680, "", {
      fontSize: "24px",
      color: "#ffffff",
      fontStyle: "bold",
    });

    this.freeSpinText.setOrigin(0.5);
  }

  checkScatter(grid: string[][]) {
    const scatters: {
      col: number;
      row: number;
    }[] = [];

    for (let col = 0; col < COLS; col++) {
      for (let row = 0; row < ROWS; row++) {
        if (grid[col][row] === FREE) {
          scatters.push({ col, row });
        }
      }
    }

    return scatters;
  }

  // -----------------------------
  // Create 5x5 grid
  // -----------------------------

  createGrid() {
    for (let col = 0; col < COLS; col++) {
      this.grid[col] = [];

      for (let row = 0; row < ROWS; row++) {
        const x = START_X + col * TILE_SIZE;

        const y = START_Y + row * TILE_SIZE;

        // Tile background
        this.add.rectangle(x, y, 75, 75, 0xf5ead0).setStrokeStyle(2, 0xc8a96b);

        const symbol = Phaser.Utils.Array.GetRandom(FREE_SPIN_SYMBOLS);

        const text = this.add
          .text(x, y, symbol, {
            fontSize: "32px",
            color: "#b22222",
          })
          .setOrigin(0.5);

        this.grid[col].push(text);
      }
    }
  }

  // -----------------------------
  // Spin button
  // -----------------------------

  createSpinButton() {
    const button = this.add
      .rectangle(450, 630, 180, 60, 0xb22222)
      .setInteractive({
        useHandCursor: true,
      });

    this.add
      .text(450, 630, "SPIN", {
        fontSize: "30px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    button.on("pointerover", () => {
      button.setFillStyle(0xd32f2f);
    });

    button.on("pointerout", () => {
      button.setFillStyle(0xb22222);
    });

    button.on("pointerdown", () => {
      if (!this.isFreeSpin) {
        this.spin();
      }
    });
  }

  createTestButton() {
    const button = this.add
      .rectangle(700, 630, 140, 50, 0x555555)
      .setInteractive({
        useHandCursor: true,
      });

    this.add
      .text(700, 630, "TEST WIN", {
        fontSize: "20px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    button.on("pointerdown", () => {
      this.testWinningCondition();
    });
  }

  // -----------------------------
  // Spin
  // -----------------------------

  spin() {
    if (this.spinning) return;

    if (this.balance < this.bet) {
      this.winText.setText("Not enough balance");
      return;
    }

    if (!this.isFreeSpin) {
      this.streakMultiplier = 1;
    }

    this.spinning = true;

    if (!this.isFreeSpin) {
      this.balance -= this.bet;
    }

    this.updateBalance();
    this.clearHighlights();
    this.winText.setText("");

    let finished = 0;

    for (let col = 0; col < COLS; col++) {
      this.spinColumn(col, 800 + col * 300, () => {
        finished++;

        // ALL 5 COLUMNS FINISHED
        if (finished === COLS) {
          this.checkWin(); // <-- CALL IT HERE
        }
      });
    }
  }

  startFreeSpins() {
    if (this.freeSpins <= 0) {
      this.isFreeSpin = false;
      this.spinning = false;

      this.freeSpinText.setVisible(false);

      this.winText.setText("FREE SPINS END");

      return;
    }

    this.isFreeSpin = true;

    this.freeSpins--;

    this.updateFreeSpinText();

    console.log(`Free spins remaining: ${this.freeSpins}`);

    this.spinning = false;

    this.time.delayedCall(500, () => {
      this.spin();
    });
  }

  // -----------------------------
  // Spin individual column
  // -----------------------------

  spinColumn(col: number, duration: number, onComplete: () => void) {
    const interval = 70;

    const timer = this.time.addEvent({
      delay: interval,
      repeat: Math.floor(duration / interval),

      callback: () => {
        let hasScatter = false;

        for (let row = 0; row < ROWS; row++) {
          const result = this.getRandomSymbolForColumn(hasScatter);

          this.grid[col][row].setText(result.symbol);

          hasScatter = result.hasScatter;
        }
      },

      callbackScope: this,
    });

    this.time.delayedCall(duration, () => {
      timer.remove();

      // Final symbols
      let hasScatter = false;

      for (let row = 0; row < ROWS; row++) {
        const result = this.getRandomSymbolForColumn(hasScatter);

        this.grid[col][row].setText(result.symbol);

        hasScatter = result.hasScatter;
      }

      onComplete();
    });
  }

  // -----------------------------
  // Finish spin
  // -----------------------------

  finishSpin() {
    const result = this.getResult();
    const wins = this.findWins(result);

    console.log("Winning tiles:", wins);

    if (wins.length === 0) {
      this.winText.setText("NO WIN");
      this.spinning = false;
      return;
    }

    const win = wins.length * this.bet;

    this.balance += win;

    this.winText.setText(`WIN ${win}!`);

    this.removeWinningTiles(wins);
  }

  // -----------------------------
  // Get current grid
  // -----------------------------

  getResult(): string[][] {
    const result: string[][] = [];

    for (let col = 0; col < COLS; col++) {
      result[col] = [];

      for (let row = 0; row < ROWS; row++) {
        result[col][row] = this.grid[col][row].text;
      }
    }

    return result;
  }

  // -----------------------------
  // Find winning clusters
  // -----------------------------

  findWins(grid: string[][]) {
    const wins: {
      col: number;
      row: number;
    }[] = [];

    const minColumns = 3;

    for (const symbol of SYMBOLS) {
      let consecutiveColumns = 0;
      const symbolTiles: {
        col: number;
        row: number;
      }[] = [];

      for (let col = 0; col < COLS; col++) {
        const columnMatches: {
          col: number;
          row: number;
        }[] = [];

        for (let row = 0; row < ROWS; row++) {
          if (grid[col][row] === symbol) {
            columnMatches.push({
              col,
              row,
            });
          }
        }

        if (columnMatches.length > 0) {
          consecutiveColumns++;
          symbolTiles.push(...columnMatches);
        } else {
          break;
        }
      }

      if (consecutiveColumns >= minColumns) {
        wins.push(...symbolTiles);
      }
    }

    return wins;
  }

  checkWin() {
    const result = this.getResult();

    // =================================
    // Check SCATTER
    // =================================

    if (!this.isFreeSpin) {
      const scatters = this.checkScatter(result);

      console.log("Scatters:", scatters);

      if (scatters.length >= 3) {
        this.freeSpins += 12;

        this.winText.setText(`12 FREE SPINS!`);

        this.highlightWins(scatters);

        this.spinning = false;

        this.time.delayedCall(1500, () => {
          this.startFreeSpins();
        });

        return;
      }
    }

    // =================================
    // Normal win
    // =================================

    const wins = this.findWins(result);

    console.log("Winning tiles:", wins);

    if (wins.length === 0) {
      this.winText.setText("NO WIN");

      this.streakMultiplier = 1;
      this.spinning = false;

      // Continue free spins
      if (this.isFreeSpin && this.freeSpins > 0) {
        this.time.delayedCall(1000, () => {
          this.startFreeSpins();
        });
      } else if (this.isFreeSpin && this.freeSpins <= 0) {
        this.isFreeSpin = false;
        this.winText.setText("FREE SPINS END");
      }

      return;
    }

    const win = wins.length * this.bet * this.streakMultiplier;

    this.balance += win;

    this.winText.setText(`${this.streakMultiplier}X WIN ${win}!`);

    this.updateBalance();

    this.highlightWins(wins);

    this.playWinAnimation(wins);

    this.time.delayedCall(2000, () => {
      this.removeWinningTiles(wins);

      this.streakMultiplier = Math.min(this.streakMultiplier + 1, 4);
    });
  }

  removeWinningTiles(
    wins: {
      col: number;
      row: number;
    }[],
  ) {
    const winSet = new Set(wins.map((tile) => `${tile.col}-${tile.row}`));

    for (let col = 0; col < COLS; col++) {
      const remaining: string[] = [];

      // Get non-winning symbols
      for (let row = 0; row < ROWS; row++) {
        if (!winSet.has(`${col}-${row}`)) {
          remaining.push(this.grid[col][row].text);
        }
      }

      const emptyCount = ROWS - remaining.length;

      // Generate new symbols
      const symbolPool = this.isFreeSpin ? FREE_SPIN_SYMBOLS : SYMBOLS;
      const newSymbols: string[] = [];

      for (let i = 0; i < emptyCount; i++) {
        newSymbols.push(Phaser.Utils.Array.GetRandom(symbolPool));
      }

      // Combine new symbols + existing symbols
      const finalSymbols = [...newSymbols, ...remaining];

      // Update words only
      for (let row = 0; row < ROWS; row++) {
        const tile = this.grid[col][row];

        const oldText = tile.text;
        const newText = finalSymbols[row];

        // Only animate the NEW symbols
        if (row < emptyCount) {
          const originalY = tile.y;

          tile.setText(newText);

          tile.y = originalY - 95;

          this.tweens.add({
            targets: tile,
            y: originalY,
            duration: 400,
            ease: "Cubic.easeOut",
          });
        } else {
          // Existing symbols: just change the text
          tile.setText(newText);
          tile.setAlpha(1);
        }
      }
    }

    // Check again after streak
    this.time.delayedCall(1000, () => {
      this.checkWin();
    });
  }

  checkstreak() {
    const result = this.getResult();
    const wins = this.findWins(result);

    if (wins.length === 0) {
      console.log("streak finished");

      this.updateBalance();

      this.spinning = false;
      return;
    }

    console.log("streak win:", wins);

    const win = wins.length * this.bet * this.streakMultiplier;

    this.balance += win;

    this.winText.setText(`WIN ${win} (${this.streakMultiplier}x)!`);

    this.highlightWins(wins);

    this.playWinAnimation(wins);

    this.time.delayedCall(2000, () => {
      this.removeWinningTiles(wins);

      this.streakMultiplier = Math.min(this.streakMultiplier + 1, 4);
    });
  }

  testWinningCondition() {
    const testGrid = [
      ["2萬", "2筒", "2萬", "4筒", "5萬"],
      ["2萬", "中", "2萬", "中", "7萬"],
      ["2萬", "發", "2萬", "9筒", "1筒"],
      ["6萬", "中", "2萬", "中", "4萬"],
      ["6萬", "6萬", "2萬", "8萬", "白"],
    ];

    // Put test result onto the actual game
    for (let col = 0; col < COLS; col++) {
      for (let row = 0; row < ROWS; row++) {
        this.grid[col][row].setText(testGrid[col][row]);
      }
    }

    const wins = this.findWins(testGrid);

    if (wins.length > 0) {
      const winAmount = wins.length * this.bet * 5;

      this.balance += winAmount;

      this.winText.setText(`🎉 WIN ${winAmount}! 🎉`);

      this.highlightWins(wins);

      this.playWinAnimation(wins);
    } else {
      this.winText.setText("No win");
    }

    this.updateBalance();
  }

  // -----------------------------
  // Highlight winning tiles
  // -----------------------------

  highlightWins(
    wins: {
      col: number;
      row: number;
    }[],
  ) {
    for (const win of wins) {
      const tile = this.grid[win.col][win.row];

      tile.setTint(0xffff00);
    }
  }

  // -----------------------------
  // Win animation
  // -----------------------------

  playWinAnimation(
    wins: {
      col: number;
      row: number;
    }[],
  ) {
    for (const win of wins) {
      const tile = this.grid[win.col][win.row];

      this.tweens.add({
        targets: tile,
        scale: 1.3,
        duration: 250,
        yoyo: true,
        repeat: 3,
      });
    }
  }

  // -----------------------------
  // Clear highlights
  // -----------------------------

  clearHighlights() {
    for (let col = 0; col < COLS; col++) {
      for (let row = 0; row < ROWS; row++) {
        this.grid[col][row].clearTint();
        this.grid[col][row].setScale(1);
      }
    }
  }

  // -----------------------------
  // Update balance
  // -----------------------------

  updateBalance() {
    this.balanceText.setText(`Balance: ${this.balance}    Bet: ${this.bet}`);
  }

  updateFreeSpinText() {
    if (this.isFreeSpin && this.freeSpins > 0) {
      this.freeSpinText.setText(`FREE SPINS LEFT: ${this.freeSpins}`);
      this.freeSpinText.setVisible(true);
    } else {
      this.freeSpinText.setVisible(false);
    }
  }
}

// -----------------------------
// Phaser configuration
// -----------------------------

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,

  width: 900,
  height: 700,

  parent: "slot-game",

  scene: SlotScene,

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },

  render: {
    antialias: true,
  },
};

export function createSlotGame() {
  return new Phaser.Game(config);
}
