import Phaser from 'phaser';
import { Start } from '../scenes/Start.js';
import { Game } from '../scenes/Game.js';
import { GameOver } from '../scenes/GameOver.js';
// Prevent right click menu from showing because it is annoying
document.addEventListener('contextmenu', event => event.preventDefault());
const config = {
    type: Phaser.AUTO,
    title: 'LetHimCook',
    parent: 'game-container',
    width: 1280,
    height: 720,
    pixelArt: false,
    scene: [
        Start, Game, GameOver
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
    },
}
new Phaser.Game(config);
            