export class Start extends Phaser.Scene
{
    constructor()
    {
        super({key: 'Start'});
    }
    
    create() {
        
        const textStart = this.cameras.main.width / 2;
        // Add start button
        const startButton = this.add.image(textStart, 320, 'start-button')
            .setScale(0.03)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => startButton.setScale(0.04))
            .on('pointerout', () => startButton.setScale(0.03))
            .on('pointerdown', () => this.startGame());
            
        // Add game title
        this.add.text(textStart, 100, 'LET ME COOK', {
            fontFamily: 'Arial',
            fontSize: 48,
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Add instructions
        this.add.text(textStart, 500, 'Use MOUSE CLICK to move, X to dash, SPACE to drop items', {
            fontFamily: 'Arial',
            fontSize: 16,
            color: '#ffffff'
        }).setOrigin(0.5);

    }

    startGame() {
        
        // Transition to the main game scene
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.start('Game');
            this.scene.start('UIScene');
        });
    }

}

