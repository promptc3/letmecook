import * as recipeBookJson from "./recipes.json";
export default class BasicUtensil extends Phaser.GameObjects.Container {
  constructor(scene, x, y, utensilTexture, name) {
    super(scene, x, y);
    // this.add.existing(this);
    const { recipeBook } = recipeBookJson;
    this.name = name;
    this.readyToCook = false;
    this.utensil = scene.add.sprite(x, y, utensilTexture);
    this.utensil.setDepth(2);
    this.switch = scene.add.sprite(x+70, y+30, "switch", 1);
    this.switch.setScale(0.5);
    this.switch.setDepth(0);
    this.recipes = recipeBook.find((r) => r.utensil === name);
    this.playerOnSwitch = false;
    this.prepItems = [];
    const switchBody = Phaser.Physics.Matter.Matter.Bodies.rectangle(
      x + 69, y + 29, // position
      44, 44,         // width, height (adjust as needed)
      {
        isStatic: true,
        isSensor: true,
        label: "utensil-switch"
      }
    );
    scene.matter.world.add(switchBody);
    this.switchPhysics = switchBody;
    this.switchPhysics.collisionFilter.category = scene.utensilSwitchCategory;
    this.switchPhysics.collisionFilter.mask = scene.playerCategory;
    this.switchPhysics.gameObject = this; // Reference to this utensil if needed
    const circle = Phaser.Physics.Matter.Matter.Bodies.circle(
      x, y - 64, // x, y position of the circle's center
      57,
      {
        isStatic: true,
        label: "utensil-body",
      }
    );
    scene.matter.world.add(circle);
    this.utensilPhysics = circle;
    this.utensilPhysics.collisionFilter.category = scene.utensilCategory;
    this.utensilPhysics.collisionFilter.mask = scene.playerCategory;
    this.utensilPhysics.gameObject = this; // Reference to this utensil if needed
    scene.events.on('cookRecipe', args => this.handleCookRecipe(args), this);
    this.setupCollisions(scene)
  }

  handleCookRecipe(args) {
    this.prepItems = [];
  }

  setupCollisions(scene) {
    // Listen for Matter.js collision events
    scene.matter.world.on("collisionstart", (event) => {
      // console.info("[basic utensil] Collision event started:", event);
      event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;

        // Player steps on switch
        // console.info("[basic utensil] Collision detected between bodies:", bodyA, bodyB);
        // // console.info("[basic utensil] condition:", bodyA.gameObject === scene.player.body, bodyB.label === "utensil-switch");
        // console.info("[basic utensil] condition:", bodyB.gameObject === scene.player, bodyA.label === "utensil-switch");
        if (
          (bodyA.gameObject === scene.player && bodyB.label === "utensil-switch") ||
          (bodyB.gameObject === scene.player && bodyA.label === "utensil-switch")
        ) {
          this.onSwitchActivated();
        }

        // Food item overlaps utensil
        // Assuming food items are Phaser.Physics.Matter.Sprite with label "foodItem"
        if (
          (bodyA.label === "foodItem" && bodyB.label === "utensil-body") ||
          (bodyB.label === "foodItem" && bodyA.label === "utensil-body")
        ) {
          const foodBody = bodyA.label === "foodItem" ? bodyA : bodyB;
          const foodItem = foodBody.gameObject;
          this.prepItems.push(foodItem);
        }
      });
    });
  }

  onSwitchActivated() {
    if (!this.ready) {
      console.info("Utensil is ready!");
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

