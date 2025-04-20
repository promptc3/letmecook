export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: "UIScene" });
  }

  create() {
    const fontConfig = {
      fontSize: "22px",
      fontFamily: "pixelFont",
      fill: "#fefefe",
      align: "left"
    }
    const leftText =
      this.cameras.main.worldView.x + 30;
    const rightText =
      this.cameras.main.worldView.x + this.cameras.main.width - 100;
    const centerTextX =
      this.cameras.main.worldView.x + this.cameras.main.width / 2;
    const topText =
      this.cameras.main.worldView.y + 30;
    const bottomText =
      this.cameras.main.worldView.y + this.cameras.main.height - 30;
    console.info("Camera width: ", this.cameras.main.width);
    console.info("Camera height: ", this.cameras.main.height);
    this.powerUpSprite = this.add.image(leftText, topText, "dash-pickup").setScale(2).setAngle(-15);
    this.powerUpText = this.add.text(leftText + 30, topText, "0", fontConfig);
    this.powerUpText.setOrigin(0.5);
    this.powerUpText.setScrollFactor(0); // Fix to camera
    // Create interaction message
    this.messageText = this.add.text(rightText, bottomText, "", fontConfig)
    .setOrigin(0.5)
    .setScrollFactor(0);
    this.connectionText = this.add.text(rightText, topText, "Connecting...", fontConfig)
    .setDepth(1)
    .setOrigin(0.5)
    .setScrollFactor(0);
    this.registry.events.on("changedata", this.updateData, this);
    const myGame = this.scene.get("Game");
    myGame.events.on("connected", () => {
      this.connectionText.setText("Connected").setTint("0x11ffaa");
    }, this)
    myGame.events.on("connectionFailed", () => {
      this.connectionText.setText("Connection failure").setTint("0xee1150");
    }, this)
    this.inventory = [];
    this.invUi = new Map();
    this.crntIndex = 0;
    const tileSize = 26;
    const padding = 3;
    for (let i=0; i < 9; i++) {
      const x = leftText + 10 + i * (tileSize*padding);
      const y = bottomText - (tileSize + padding);
      const tile = this.add.image(x, y, "inventory", 4).setScale(2);
      this.inventory.push({
        tile,
        item: null,
        text: null
      })
    }
  }

  addItemToInventory(name, texture, quantity) {
    const fontConfig = {
      fontSize: "16px",
      fontFamily: "pixelFont",
      color: "#fefefe"
    }
    const item = this.invUi.get(name);
    if (item !== undefined) {
      // item is already add in inventory
      // just update the quantity
      const invItem = this.inventory[item.index];
      invItem.text.setText(`${quantity}`);
    } else {
      this.invUi.set(name, {index: this.crntIndex})
      const tile = this.inventory[this.crntIndex].tile
      const itemImg = this.add.image(tile.x, tile.y + 2, texture).setScale(2);
      const qtyText = this.add.text(tile.x + tile.width/4, tile.y + tile.height/4 - 5, `${quantity}`, fontConfig).setDepth(1);
      this.inventory[this.crntIndex].item = itemImg;
      this.inventory[this.crntIndex].text = qtyText;
      this.crntIndex += 1;
    }
  }
  updateData(parent, key, data) {
    if (key === "powerups") {
      this.powerUpText.setText(`${data}`);
    } else if (key === "displayMessage") {
      this.messageText.setText(data);
      this.tweens.add({
        targets: this.messageText,
        delay: 3500,
        alpha: {from: 1, to: 0},
        duration: 500,
        ease: "Linear",
        onComplete: () => {
          this.messageText.setText("").setAlpha(1);
        }
      })
    } else if (key === "inventory") {
      const ingr = this.registry.get("recipe").ingredients;
      // for each item in inv hash get texture and add image
      ingr.forEach(i => {
        const qty = data.get(i.name);
        if (qty > 0) {
          this.addItemToInventory(i.name, i.texture, qty);
        }
      })
    }
  }
}
