import * as recipeBookJson from "./recipes.json";
export default class BasicUtensil extends Phaser.GameObjects.Container {
  constructor(scene, x, y, utensilTexture, name) {
    super(scene, x, y);
    // this.add.existing(this);
    const { recipeBook } = recipeBookJson;
    this.name = name;
    this.readyToCook = false;
    this.utensil = scene.matter.add.sprite(x, y, utensilTexture);
    this.switch = scene.matter.add.sprite(x+70, y+30, "switch", 1);
    this.switch.setScale(0.5);
    this.recipes = recipeBook.find((r) => r.utensil === name);
    this.playerOnSwitch = false;
    this.prepItems = [];
    scene.events.on('cookRecipe', args => this.handleCookRecipe(args), this);
  }


  handleCookRecipe(args) {
    this.prepItems = [];
  }

  // setupCollisions(scene) {
  //   scene.matter.add.overlap(
  //     scene.player,
  //     this.switch,
  //     this.onSwitchActivated,
  //     null,
  //     this
  //   );
  //   scene.matter.add.overlap(
  //     scene.foodItems,
  //     this.utensil,
  //     this.tryCook,
  //     null,
  //     this
  //   );
  // }

  onSwitchActivated() {
    if (!this.ready) {
      // console.info("Utensil is ready!");
      this.readyToCook = true;
      this.switch.setFrame(0);
      this.playerOnSwitch = true;
      this.scene.events.emit('switchOn', {"utensil": this.name, "prepItems": this.prepItems});
    }
  }

  tryCook(foodItem, utensil) {
    if (this.readyToCook && foodItem) {
      const existingItem = this.prepItems.find(i => i.getId() === foodItem.getId())
      if (existingItem) return;
      this.prepItems.push(foodItem);
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
      this.scene.events.emit('switchOff', {"utensil": this.name});
      // console.info("Utensil is no longer ready.");
    }
  }
}

