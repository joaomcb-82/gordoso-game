console.log("GAME_V7 CARGADO OK");

const config = {
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  parent: "game",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 1000 },
      debug: false
    }
  },
  scene: {
    preload,
    create,
    update
  }
};

new Phaser.Game(config);

let player, cursors, keys, ground;

function preload() {
  this.load.image("bg", "assets/bangkok_bg.jpg");
  this.load.image("gordoso", "assets/gordoso.png");
}

function create() {
  // Fondo
  const bg = this.add.image(480, 270, "bg");
  bg.setDisplaySize(960, 540);

  // Suelo invisible (NO imagen)
  ground = this.physics.add.staticGroup();
  ground.create(480, 520).setSize(960, 40).setVisible(false).refreshBody();

  // Gordoso
  player = this.physics.add.sprite(120, 450, "gordoso");
  player.setScale(0.18);
  player.setCollideWorldBounds(true);

  this.physics.add.collider(player, ground);

  // Controles PC
  cursors = this.input.keyboard.createCursorKeys();
  keys = this.input.keyboard.addKeys({
    A: Phaser.Input.Keyboard.KeyCodes.A,
    D: Phaser.Input.Keyboard.KeyCodes.D,
    W: Phaser.Input.Keyboard.KeyCodes.W
  });
}

function update() {
  if (keys.A.isDown) {
    player.setVelocityX(-220);
  } else if (keys.D.isDown) {
    player.setVelocityX(220);
  } else {
    player.setVelocityX(0);
  }

  if ((keys.W.isDown || cursors.space.isDown) && player.body.blocked.down) {
    player.setVelocityY(-520);
  }
}
