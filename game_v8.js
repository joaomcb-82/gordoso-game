console.log("GAME_V8 FINAL CARGADO OK");

const BASE_W = 960;
const BASE_H = 540;

const config = {
  type: Phaser.AUTO,
  width: BASE_W,
  height: BASE_H,
  parent: "game",
  backgroundColor: "#000000",
  scale: {
    mode: Phaser.Scale.FIT,          // se adapta a la ventana
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: "arcade",
    arcade: { gravity: { y: 1200 }, debug: false }
  },
  scene: { preload, create, update }
};

new Phaser.Game(config);

let player, cursors, keys;
let platforms, burgers, skunks, door;
let score = 0;
let scoreText;
let ended = false;

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
  // Fondo tipo cover sin deformar
  const bg = this.add.image(BASE_W / 2, BASE_H / 2, "bg");
  const cover = Math.max(BASE_W / bg.width, BASE_H / bg.height);
  bg.setScale(cover);

  // Plataforma visible (sin archivo)
  const g = this.add.graphics();
  g.fillStyle(0x111111, 0.85);
  g.fillRoundedRect(0, 0, 260, 30, 10);
  g.lineStyle(3, 0xffffff, 0.35);
  g.strokeRoundedRect(0, 0, 260, 30, 10);
  g.generateTexture("plat", 260, 30);
  g.destroy();

  platforms = this.physics.add.staticGroup();
  platforms.create(BASE_W / 2, 520, "plat").setScale(4.2, 1.5).refreshBody(); // suelo
  platforms.create(250, 410, "plat").refreshBody();
  platforms.create(520, 330, "plat").refreshBody();
  platforms.create(780, 250, "plat").refreshBody();
  platforms.create(900, 180, "plat").setScale(1.2, 1).refreshBody();          // plataforma final

  // Gordoso proporcionado
  player = this.physics.add.sprite(90, 420, "gordoso");
  player.setScale(0.12);
  player.setCollideWorldBounds(true);
  player.body.setSize(player.width * 0.55, player.height * 0.82, true);

  this.physics.add.collider(player, platforms);

  // Controles PC
  cursors = this.input.keyboard.createCursorKeys();
  keys = this.input.keyboard.addKeys({
    A: Phaser.Input.Keyboard.KeyCodes.A,
    D: Phaser.Input.Keyboard.KeyCodes.D,
    W: Phaser.Input.Keyboard.KeyCodes.W,
    R: Phaser.Input.Keyboard.KeyCodes.R
  });

  // Hamburguesas
  burgers = this.physics.add.group({
    key: "burger",
    repeat: 6,
    setXY: { x: 160, y: 0, stepX: 120 }
  });

  burgers.children.iterate(b => {
    b.setScale(0.11);
    b.setBounce(0.25);
    b.setCollideWorldBounds(true);
  });

  this.physics.add.collider(burgers, platforms);
  this.physics.add.overlap(player, burgers, onBurger, null, this);

  // Zorrillos (patrullan sobre suelo)
  skunks = this.physics.add.group();
  makeSkunk(this, 520, 470, 180);
  makeSkunk(this, 720, 470, -180);

  this.physics.add.collider(skunks, platforms);
  this.physics.add.collider(player, skunks, () => endGame.call(this, false), null, this);

  // Puerta final
  door = this.physics.add.staticImage(930, 120, "door").setScale(0.16).refreshBody();
  this.physics.add.overlap(player, door, () => endGame.call(this, true), null, this);

  // UI
  scoreText = this.add.text(14, 14, "🍔 0", {
    fontSize: "18px",
    fill: "#111",
    backgroundColor: "rgba(255,255,255,0.85)",
    padding: { x: 10, y: 6 }
  });

  this.add.text(14, 48, "A/D mover • W o Espacio saltar • R reinicia", {
    fontSize: "14px",
    fill: "#fff",
    backgroundColor: "rgba(0,0,0,0.35)",
    padding: { x: 10, y: 6 }
  });
}

function update() {
  if (ended) {
    if (keys.R.isDown) window.location.reload();
    return;
  }

  // Movimiento
  if (keys.A.isDown) player.setVelocityX(-260);
  else if (keys.D.isDown) player.setVelocityX(260);
  else player.setVelocityX(0);

  // Salto
  const onGround = player.body.blocked.down || player.body.touching.down;
  if ((keys.W.isDown || cursors.space.isDown) && onGround) {
    player.setVelocityY(-580);
  }

  // Mantener a los zorrillos patrullando siempre (por si se quedan en 0)
  skunks.children.iterate(s => {
    if (!s || !s.body) return;
    if (Math.abs(s.body.velocity.x) < 10) {
      s.setVelocityX(s.getData("dir") * 180);
    }
  });
}

function onBurger(player, burger) {
  burger.disableBody(true, true);
  score++;
  scoreText.setText("🍔 " + score);
}

function makeSkunk(scene, x, y, vx) {
  const s = scene.physics.add.sprite(x, y, "skunk");
  s.setScale(0.14);
  s.setBounce(1);
  s.setCollideWorldBounds(true);
  s.setVelocityX(vx);
  s.setData("dir", vx >= 0 ? 1 : -1);
  s.body.setSize(s.width * 0.7, s.height * 0.7, true);
  skunks.add(s);
}

function endGame(win) {
  if (ended) return;
  ended = true;

  this.physics.pause();
  player.setVelocity(0, 0);

  // Overlay
  this.add.rectangle(BASE_W / 2, BASE_H / 2, BASE_W, BASE_H, 0x000000, 0.55);

  if (!win) {
    player.setTint(0xff0000);
    this.add.text(BASE_W / 2, 115, "GAME OVER", { fontSize: "44px", fill: "#fff" }).setOrigin(0.5);
    this.add.text(BASE_W / 2, 165, "Te atrapó el zorrillo 😵", { fontSize: "20px", fill: "#fff" }).setOrigin(0.5);
    this.add.text(BASE_W / 2, 210, "Presiona R para reiniciar", { fontSize: "18px", fill: "#fff" }).setOrigin(0.5);
    return;
  }

  // ESCENA FINAL (mujer + bandera)
  this.add.text(BASE_W / 2, 90, "¡RESCATE LOGRADO! 🇹🇭", { fontSize: "38px", fill: "#fff" }).setOrigin(0.5);
  this.add.text(BASE_W / 2, 140, `Hamburguesas: ${score}`, { fontSize: "22px", fill: "#fff" }).setOrigin(0.5);

  this.add.image(BASE_W / 2 - 140, BASE_H / 2 + 60, "girl").setScale(0.22);
  this.add.image(BASE_W / 2 + 160, BASE_H / 2 + 60, "flag").setScale(0.16);

  this.add.text(BASE_W / 2, 220, "Presiona R para reiniciar", { fontSize: "18px", fill: "#fff" }).setOrigin(0.5);
}
