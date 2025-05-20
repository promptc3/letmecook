import Phaser from 'phaser';
import { Bootloader } from '../scenes/Bootloader.js';
import { Start } from '../scenes/Start.js';
import { Game } from '../scenes/Game.js';
import { GameOver } from '../scenes/GameOver.js';
import { UIScene } from  '../scenes/UIScene.js';
import { CookingOptions } from '../scenes/CookingOptions.js';
// Prevent right click menu from showing because it is annoying
document.addEventListener('contextmenu', event => event.preventDefault());
const config = {
    type: Phaser.AUTO,
    title: 'LetHimCook',
    parent: 'game-container',
    width: window.innerWidth * window.devicePixelRatio,
    height: window.innerHeight * window.devicePixelRatio,
    pixelArt: true,
    scene: [
        Bootloader, Start, Game, UIScene, CookingOptions, GameOver
    ],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: true  // Set to true to see collision boxes
        }
    }
}
new Phaser.Game(config);
            