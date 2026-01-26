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

const game = new Phaser.Game(config);

let player, cursors, keys;
let burgers, skunks;
let door, girl, flag;
let score = 0;
let scoreText;

function preload() {
  this.load.image("bg", "assets/bangkok_bg.jpg");
  this.load.image("gordoso", "assets/gordoso.png");
  this.load.image("burger", "assets/burger.png");
  this.load.image("skunk", "assets/skunk.png");
  this.load.image("door", "assets/door.png");
  this.load.image("girl", "assets/girl.png");
  this.load.image("flag", "assets/thai_flag.png");
}

function create() {
  this.add.image(480, 270, "bg").setScale(0.5);

  // Suelo invisible
  const ground = this.physics.add.staticImage(480, 520)
    .setSize(960, 40)
    .setVisible(false)
    .refreshBody();

  // Gordoso
  player = this.physics.add.sprite(100, 450, "gordoso");
  player.setScale(0.25);
  player.setCollideWorldBounds(true);
  this.physics.add.collider(player, ground);

  // Controles
  cursors = this.input.keyboard.createCursorKeys();
  keys = this.input.keyboard.addKeys({
    A: Phaser.Input.Keyboard.KeyCodes.A,
    D: Phaser.Input.Keyboard.KeyCodes.D,
    W: Phaser.Input.Keyboard.KeyCodes.W
  });

  // Hamburguesas
  burgers = this.physics.add.group({
    key: "burger",
    repeat: 4,
    setXY: { x: 200, y: 0, stepX: 150 }
  });

  burgers.children.iterate(b => {
    b.setScale(0.15);
    b.setBounceY(Phaser.Math.FloatBetween(0.3, 0.6));
  });

  this.physics.add.collider(burgers, ground);
  this.physics.add.overlap(player, burgers, collectBurger, null, this);

  // Zorrillos
  skunks = this.physics.add.group();

  const skunk1 = skunks.create(500, 450, "skunk");
  skunk1.setScale(0.2).setVelocityX(-120).setBounce(1).setCollideWorldBounds(true);

  const skunk2 = skunks.create(750, 450, "skunk");
  skunk2.setScale(0.2).setVelocityX(120).setBounce(1).setCollideWorldBounds(true);

  this.physics.add.collider(skunks, ground);
  this.physics.add.collider(player, skunks, hitSkunk, null, this);

  // Puerta final
  door = this.physics.add.staticImage(900, 440, "door").setScale(0.25);
  this.physics.add.overlap(player, door, reachDoor, null, this);

  // UI
  scoreText = this.add.text(16, 16, "🍔 0", {
    fontSize: "20px",
    fill: "#fff"
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

  if ((cursors.space.isDown || keys.W.isDown) && player.body.blocked.down) {
    player.setVelocityY(-520);
  }
}

function collectBurger(player, burger) {
  burger.disableBody(true, true);
  score++;
  scoreText.setText("🍔 " + score);
}

function hitSkunk() {
  this.physics.pause();
  player.setTint(0xff0000);
}

function reachDoor() {
  this.physics.pause();

  this.add.image(480, 270, "girl").setScale(0.3);
  this.add.image(480, 380, "thai_flag").setScale(0.2);

  this.add.text(300, 100, "¡Rescate logrado!", {
    fontSize: "32px",
    fill: "#ffffff"
  });
}
