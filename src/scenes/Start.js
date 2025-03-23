export class Start extends Phaser.Scene
{
    constructor()
    {
        super({key: 'Start'});
    }
    
    create() {
        
        // Add start button
        const startButton = this.add.image(640, 320, 'start-button')
            .setScale(0.01)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => startButton.setScale(0.02))
            .on('pointerout', () => startButton.setScale(0.01))
            .on('pointerdown', () => this.startGame());
            
        // Add game title
        this.add.text(610, 100, 'LET ME COOK', {
            fontFamily: 'Arial',
            fontSize: 48,
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Add instructions
        this.add.text(620, 500, 'Use MOUSE to move and SPACE to drop items', {
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
        });
    }

}

