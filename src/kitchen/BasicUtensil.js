import * as recipeBookJson from "./recipes.json";
export default class BasicUtensil extends Phaser.GameObjects.Container {
  constructor(scene, x, y, utensilTexture, name) {
    super(scene, x, y);
    // this.add.existing(this);
    const { recipeBook } = recipeBookJson;
    this.name = name;
    this.readyToCook = false;
    this.utensil = scene.physics.add.staticSprite(x, y, utensilTexture);
    this.switch = scene.physics.add.sprite(x+70, y+30, "switch", 1);
    this.switch.setScale(0.5);
    this.recipes = recipeBook.find((r) => r.utensil === name);
    this.playerOnSwitch = false;
  }

  setupCollisions(scene) {
    scene.physics.add.overlap(
      scene.player,
      this.switch,
      this.onSwitchActivated,
      null,
      this
    );
    scene.physics.add.overlap(
      scene.foodItems,
      this.utensil,
      this.tryCook,
      null,
      this
    );
  }
  onSwitchActivated() {
    if (!this.ready) {
      console.info("Utensil is ready!");
      this.readyToCook = true;
      this.switch.setFrame(0);
      this.playerOnSwitch = true;
    }
  }

  tryCook(foodItems, utensil) {
    if (this.readyToCook && this.foodItems) {
        this.cook(foodItems);
    }
  }

  cook(rawIngrs) {
    if (rawIngrs === undefined) return;
    const keyStr = rawIngrs.map((r) => `${i.name}-${i.quantity}`).join("|");
    const cookedItem = this.recipes.find((r) => r.ingredientKey === keyStr);
    return cookedItem;
  }

  update() {
    const player = this.scene.player;
    const isPlayerOnSwitch = Phaser.Geom.Intersects.RectangleToRectangle(
      player.getBounds(),
      this.switch.getBounds()
    );

    if (!isPlayerOnSwitch && this.playerOnSwitch) {
      this.playerOnSwitch = false;
      this.readyToCook = false;
      this.switch.setFrame(1);
      console.info("Utensil is no longer ready.");
    }
  }
}
