import * as recipeBookJson from "./../kitchen/recipes.json";
export class CookingOptions extends Phaser.Scene {
  constructor() {
    super({ key: "CookingOptions" });
    this.popupContainer = null;
    this.selectedRecipe = null;
    this.recipeTexts = [];
  }

  create() {
    // display
    const width = 900;
    const height = 700;
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    this.popupContainer = this.add.container(centerX, centerY);

    const bg = this.add
      .rectangle(0, 0, width, height, 0x333333, 0.95)
      .setStrokeStyle(2, 0xffffff)
      .setOrigin(0.5);
    this.popupContainer.add(bg);

    const title = this.add.text(
      -width / 2 + 10,
      -height / 2 + 10,
      "Possible Recipes",
      {
        fontSize: "22px",
        fontFamily: "pixelFont",
        fill: "#ffffaa",
      }
    );
    this.popupContainer.add(title);
    this.popupContainer.setVisible(false);
    const myGame = this.scene.get("Game");
    myGame.events.on("switchOn", (args) => this.switchOnHandler(args), this);
    myGame.events.on("switchOff", (args) => this.switchOffHandler(args), this);
  }

  switchOnHandler(args) {
    // open dialog box
    const prepItems = args.prepItems;
    if (prepItems === null) return;
    const utensil = args.utensil;
    // get probable recipes
    let probableRecipes = [];
    const { recipeBook } = recipeBookJson;
    recipeBook.forEach((r) => {
      if (r.utensil === utensil) {
        probableRecipes = r.recipes;
      }
    });
    if (probableRecipes.length === 0) return;

    this.popupContainer.setVisible(true);
    const width = 900;
    const height = 700;
    const recipeYStart = -height / 2 + 60;
    this.recipeTexts = [];

    probableRecipes.forEach((recipe, index) => {
      const recipeText = this.add
        .text(-width / 2 + 20, recipeYStart + index * 25, recipe.recipeName, {
          fontSize: "18px",
          fontFamily: "pixelFont",
          fill: "#ffffff",
          backgroundColor: "#000000",
        })
        .setInteractive();

      recipeText.on("pointerdown", () => {
        this.selectRecipe(index, probableRecipes);
      });

      this.popupContainer.add(recipeText);
      this.recipeTexts.push(recipeText);
    });

    // Craft Button
    const craftBtn = this.add
      .text(0, height / 2 - 30, "Craft", {
        fontSize: "20px",
        fontFamily: "pixelFont",
        fill: "#ffffff",
        backgroundColor: "#007700",
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5)
      .setInteractive();

    craftBtn.on("pointerdown", () => this.craftSelectedRecipe(prepItems));
    this.popupContainer.add(craftBtn);
  }

  selectRecipe(index, recipes) {
    this.selectedRecipe = recipes[index];

    // Highlight selected
    this.recipeTexts.forEach((text, i) => {
      text.setStyle({ fill: i === index ? "#ffff00" : "#ffffff" });
    });
  }

  craftSelectedRecipe(prepItems) {
    if (!this.selectedRecipe) return;

    const myGame = this.scene.get("Game");
    myGame.events.emit("cookRecipe", {
      recipeKey: this.selectedRecipe.recipeKey,
      recipeName: this.selectedRecipe.recipeName,
      usedItems: prepItems
    });

    this.switchOffHandler();
  }

  switchOffHandler() {
    // close dialog box
    if (this.popupContainer) {
      this.popupContainer.setVisible(false);
      this.selectedRecipe = null;
      this.recipeTexts = [];
    }
  }
}
