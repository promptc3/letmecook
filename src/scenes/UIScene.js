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
    this.powerUpSprite = this.add.image(leftText, topText, "dash-pickup").setScale(0.7).setAngle(-15);
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
      const tile = this.add.image(x, y, "inventory", 7)
        .setScale(1.5)
        .setInteractive()
        .on("pointerdown", (pointer, localX, localY, event) => {
          this.handleSelection(pointer)
          event.stopPropagation();
      });
      const selectedTile = this.add.image(x, y, "selected", 0).setScale(1.5).setVisible(false);
      this.inventory.push({
        tile,
        item: null,
        text: null,
        itemName: "",
        selected: false,
        selectedTile: selectedTile 
      })
    }
  }

  updateSelection(name) {
    for (let i=0; i < 9; i++) {
      const crntItemName = this.inventory[i].itemName;
      if (crntItemName === name) {
        this.inventory[i].selected = true;
        this.inventory[i].selectedTile.setVisible(true);
        this.events.emit('itemSelected', {name: this.inventory[i].itemName});
      } else {
        if (this.inventory[i].selected) {
          this.inventory[i].selected = false;
          this.inventory[i].selectedTile.setVisible(false);
        }
      }
    }
  }
  handleSelection(pointer) {
    for (let i=0; i < 9; i++) {
      const bounds = this.inventory[i].tile.getBounds();
      if (Phaser.Geom.Rectangle.Contains(bounds, pointer.x, pointer.y)) {
        this.inventory[i].selected = true;
        this.inventory[i].selectedTile.setVisible(true);
        this.events.emit('itemSelected', {name: this.inventory[i].itemName});
      } else {
        if (this.inventory[i].selected) {
          this.inventory[i].selected = false;
          this.inventory[i].selectedTile.setVisible(false);
        }
      }
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
      this.inventory[this.crntIndex].itemName = name;
      this.updateSelection(name);
      this.crntIndex += 1;
    }
  }
  removeItemFromIventory(name) {
    for (let i=0; i < 9; i++) {
      const crntItemName = this.inventory[i].itemName;
      if (crntItemName === name) {
        console.info("Removing inv item from UI", name);
        this.inventory[i].itemName = "";
        this.inventory[i].item.destroy();
        this.inventory[i].item = null;
        this.inventory[i].text.destroy();
        this.inventory[i].text = null;
        this.inventory[i].selected = false;
        this.inventory[i].selectedTile.setVisible(false);
      }
    }
  }
  updateData(parent, key, data) {
    console.info("[UIScene] Current Index: ", this.crntIndex);
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
      const ingr = this.registry.get("ingredients");
      // for each item in inv hash get texture and add image
      // console.log("triggerd on drop of item", data)
      console.info("[UIScene] Inventory data: ", data, " Ingredients: ", ingr);
      ingr.forEach(i => {
        const qty = data.get(i.name);
        if (qty && qty > 0) {
          this.addItemToInventory(i.name, i.texture, qty);
        } else if (qty === 0) {
          this.invUi.delete(i.name);
          this.crntIndex = (this.crntIndex - 1 < 0) ? 0 : (this.crntIndex - 1);
          this.removeItemFromIventory(i.name);
        }
      })
    }
  }
}
