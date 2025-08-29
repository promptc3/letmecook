export class Bootloader extends Phaser.Scene {
  constructor() {
    super({ key: "Bootloader" });
  }

  preload() {
    this.createProgressBar();
    this.setLoadEvents();
    this.loadImages();
    this.loadSounds();
    this.loadFont();
  }

  setLoadEvents() {
    this.load.on("progress", (value) => {
        this.progressBar.clear();
        this.progressBar.fillStyle(0x0088fa, 1);
        this.progressBar.fillRect(
            this.cameras.main.width/4,
            this.cameras.main.height/2 - 16, 
            (this.cameras.main.width/2) * value, 20);
    }, this);
    this.load.on("complete", () => {
        this.scene.start("Start");
    });
  }

  loadImages() {
    this.load.image('start-button', './../assets/start-button.png');
    this.load.image('dash-pickup', './../assets/food/PinkPotion.png');
    this.load.tilemapTiledJSON('map', './../assets/map/first_map.tmj');
    this.load.image('bgtiles', './../assets/tilesets/background.png');
    this.load.image('grasstiles', './../assets/tilesets/Grass.png');
    this.load.image('stonetiles', './../assets/tilesets/Stones.png');
    this.load.image('retry-button', '../assets/retry-button.png');
    this.load.image('starParticle', '../assets/elements/star.png');
    this.load.image('bubbleParticle', '../assets/elements/bubble.png');
    this.load.image('pan', './../assets/objects/Pan.png');
    this.load.image('cave', './../assets/objects/Cave.png');
    this.load.json('pan-shape', './../assets/objects/pan-shape.json');
    const vegetables = ["brinjal", "capsicum", "carrot", "corn", "mushroom", "onion", "potato", "tomato"];
    vegetables.forEach(item => {
        this.load.image(`vegetable_${item}`, `./../assets/food/vegetable_${item}.png`);
    });
    const fruits = ["apple", "banana", "grape", "orange"];
    fruits.forEach(item => {
        this.load.image(`fruit_${item}`, `./../assets/food/fruit_${item}.png`);
    });
    this.load.spritesheet('orange_player_idle', './../assets/characters/Orange/orange_8direction_standing-Sheet.png', {
      frameWidth: 32,
      frameHeight: 48
    });
    this.load.spritesheet('orange_walk_e', './../assets/characters/Orange/orange_walk_EAST-Sheet.png', {
      frameWidth: 32,
      frameHeight: 48
    });
    this.load.spritesheet('orange_walk_ne', './../assets/characters/Orange/orange_walk_NORTH-EAST-Sheet.png', {
      frameWidth: 32,
      frameHeight: 48
    });
    this.load.spritesheet('orange_walk_n', './../assets/characters/Orange/orange_walk_NORTH-Sheet.png', {
      frameWidth: 32,
      frameHeight: 48
    });
    this.load.spritesheet('orange_walk_nw', './../assets/characters/Orange/orange_walk_NORTH-WEST-Sheet.png', {
      frameWidth: 32,
      frameHeight: 48
    });
    this.load.spritesheet('orange_walk_se', './../assets/characters/Orange/orange_walk_SOUTH-EAST-Sheet.png', {
      frameWidth: 32,
      frameHeight: 48
    });
    this.load.spritesheet('orange_walk_s', './../assets/characters/Orange/orange_walk_SOUTH-Sheet.png', {
      frameWidth: 32,
      frameHeight: 48
    });
    this.load.spritesheet('orange_walk_sw', './../assets/characters/Orange/orange_walk_SOUTH-WEST-Sheet.png', {
      frameWidth: 32,
      frameHeight: 48
    });
    this.load.spritesheet('orange_walk_w', './../assets/characters/Orange/orange_walk_WEST-Sheet.png', {
      frameWidth: 32,
      frameHeight: 48
    });
    this.load.spritesheet('chicken', './../assets/characters/chicken_sprite.png', {
      frameWidth: 16,
      frameHeight: 16
    });
    this.load.spritesheet('play-button', './../assets/UI/spriteSheets/BigPlayButton.png', {
      frameWidth: 96,
      frameHeight: 32
    });
    this.load.spritesheet('inventory', './../assets/UI/spriteSheets/Inventory_Blocks_Spritesheet.png', {
      frameWidth: 48,
      frameHeight: 48,
    });
    this.load.spritesheet('selected', './../assets/UI/spriteSheets/Selection_Spritesheet.png', {
      frameWidth: 48,
      frameHeight: 48,
    });
    this.load.spritesheet('switch','./../assets/objects/Switch.png', {
      frameWidth: 128,
      frameHeight: 128
    })
  }

  loadFont() {
    this.load.font('pixelFont', './../assets/UI/fonts/sproutLands.ttf', 'opentype');
  }

  loadSounds() {
    this.load.audio('pick', './../assets/sounds/pick.ogg');
    this.load.audio('drop', './../assets/sounds/drop.ogg');
    this.load.audio('footstep1', './../assets/sounds/footstep_1.ogg');
    this.load.audio('footstep2', './../assets/sounds/footstep_2.ogg');
  }
  createProgressBar() {
    this.loadBar = this.add.graphics();
    this.loadBar.fillStyle(0x808080, 1);
    this.loadBar.fillRect(
        this.cameras.main.width/4 - 2,
        this.cameras.main.height/2 - 20,
        this.cameras.main.width/2 + 4,
        24);
    this.progressBar = this.add.graphics();
  }
}