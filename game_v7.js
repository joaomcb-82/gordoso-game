// Gordoso - Bangkok Run (v7 estable PC + móvil)

// ====== CONFIG ======
const BASE_W = 960;
const BASE_H = 540;
const WORLD_W = 2000;

const config = {
  type: Phaser.AUTO,
  parent: "game",
  width: BASE_W,
  height: BASE_H,
  backgroundColor: "#000000",
  physics: {
    default: "arcade",
    arcade: { gravity: { y: 1200 }, debug: false }
  },
  input: {
    activePointers: 3 // multi-touch real (mover + saltar)
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: BASE_W,
    height: BASE_H
  },
  scene: { preload, create, update }
};

new Phaser.Game(config);

// ====== GLOBALS ======
let player, platforms, burgers, enemies, door;
let cursors, keyW, keySpace;
let score = 0, scoreText;

let touch = {
  left: false,
  right: false,
  jump: false
};

function preload() {
  // Assets (en /assets)
  this.load.image("bg", "assets/bangkok_bg.jpg");
  this.load.image("gordoso", "assets/gordoso.png");
  this.load.image("burger", "assets/burger.png");
  this.load.image("skunk", "assets/skunk.png");
  this.load.image("door", "assets/door.png");

  // Final
  this.load.image("girl", "assets/girl.png");
  this.load.image("thai", "assets/thai_flag.png");
}

function create() {
  // ===== Fondo =====
  const bg = this.add.image(0, 0, "bg").setOrigin(0, 0).setScrollFactor(0);
  bg.displayWidth = WORLD_W;
  bg.displayHeight = BASE_H;

  // ===== Mundo / cámara =====
  this.physics.world.setBounds(0, 0, WORLD_W, BASE_H);
  this.cameras.main.setBounds(0, 0, WORLD_W, BASE_H);

  // ===== Teclas =====
  cursors = this.input.keyboard.createCursorKeys();
  keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
  keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

  // ===== Texturas plataformas (siempre visibles) =====
  const g = this.add.graphics();
  g.fillStyle(0x1ddc00, 1);
  g.fillRect(0, 0, 220, 20);
  g.generateTexture("plat", 220, 20);
  g.clear();
  g.fillStyle(0x1ddc00, 1);
  g.fillRect(0, 0, WORLD_W, 40);
  g.generateTexture("ground", WORLD_W, 40);
  g.destroy();

  // ===== Plataformas =====
  platforms = this.physics.add.staticGroup();
  platforms.create(WORLD_W / 2, BASE_H - 20, "ground").refreshBody();

  platforms.create(420, 420, "plat").refreshBody();
  platforms.create(750, 340, "plat").refreshBody();
  platforms.create(1120, 420, "plat").refreshBody();
  platforms.create(1450, 320, "plat").refreshBody();
  platforms.create(1700, 420, "plat").refreshBody();

  // ===== Jugador =====
  player = this.physics.add.sprite(120, 380, "gordoso");
  player.setCollideWorldBounds(true);

  // Ajuste proporción (más pequeño)
  player.setScale(0.16);

  // Hitbox más razonable (evita “barreras invisibles”)
  player.body.setSize(player.width * 0.45, player.height * 0.70, true);
  player.body.setOffset(player.width * 0.275, player.height * 0.22);

  this.physics.add.collider(player, platforms);

  // Cámara
  this.cameras.main.startFollow(player, true, 0.10, 0.10);
  this.cameras.main.setDeadzone(180, 120);

  // ===== Hamburguesas =====
  burgers = this.physics.add.group({ bounceY: 0.2, collideWorldBounds: true });

  const burgerPositions = [
    { x: 420, y: 0 },
    { x: 760, y: 0 },
    { x: 1120, y: 0 },
    { x: 1450, y: 0 },
    { x: 1700, y: 0 }
  ];

  burgerPositions.forEach(p => {
    const b = burgers.create(p.x, p.y, "burger");
    b.setScale(0.12);
    b.body.setSize(b.width * 0.7, b.height * 0.7, true);
  });

  this.physics.add.collider(burgers, platforms);
  this.physics.add.overlap(player, burgers, collectBurger, null, this);

  // ===== Enemigos =====
  enemies = this.physics.add.group();

  const s1 = enemies.create(1200, 380, "skunk");
  s1.setScale(0.32); // más grande
  s1.setCollideWorldBounds(true);
  s1.setVelocityX(-90);

  const s2 = enemies.create(1600, 380, "skunk");
  s2.setScale(0.32); // más grande
  s2.setCollideWorldBounds(true);
  s2.setVelocityX(90);

  // Ajuste hitbox enemigo (para que el “stomp” sea consistente)
  enemies.children.iterate(e => {
    if (!e) return;
    e.body.setSize(e.width * 0.65, e.height * 0.70, true);
    e.body.setOffset(e.width * 0.175, e.height * 0.25);
  });

  this.physics.add.collider(enemies, platforms);

  // Overlap: ahora decide si lo matas o te pega
  this.physics.add.overlap(player, enemies, playerVsEnemy, null, this);

  // ===== Puerta final =====
  door = this.physics.add.staticSprite(WORLD_W - 120, 410, "door");
  door.setScale(0.35);
  this.physics.add.overlap(player, door, winLevel, null, this);

  // ===== Score UI =====
  scoreText = this.add.text(16, 16, "Score: 0", {
    fontFamily: "Arial",
    fontSize: "20px",
    color: "#ffffff",
    backgroundColor: "rgba(0,0,0,0.45)",
    padding: { x: 10, y: 6 }
  }).setScrollFactor(0);

  // ===== Controles táctiles =====
  createTouchControls.call(this);

  // Recalcular posiciones de botones cuando cambie tamaño/orientación
  this.scale.on("resize", () => {
    positionTouchControls.call(this);
  });
}

function update() {
  // ===== Input teclado =====
  const leftKey = cursors.left.isDown || this.input.keyboard.checkDown(this.input.keyboard.addKey("A"), 0);
  const rightKey = cursors.right.isDown || this.input.keyboard.checkDown(this.input.keyboard.addKey("D"), 0);

  // ===== Input táctil =====
  const left = leftKey || touch.left;
  const right = rightKey || touch.right;

  if (left && !right) {
    player.setVelocityX(-220);
    player.setFlipX(true);
  } else if (right && !left) {
    player.setVelocityX(220);
    player.setFlipX(false);
  } else {
    player.setVelocityX(0);
  }

  // Salto (teclado)
  const jumpKeyPressed =
    Phaser.Input.Keyboard.JustDown(keySpace) ||
    Phaser.Input.Keyboard.JustDown(keyW) ||
    Phaser.Input.Keyboard.JustDown(cursors.up);

  // Salto (táctil): si mantiene presionado, solo dispara 1 vez cuando está en suelo
  if ((jumpKeyPressed || touch.jump) && player.body.blocked.down) {
    player.setVelocityY(-520);
    touch.jump = false; // importantísimo para evitar salto infinito
  }

  // IA: rebotan en bordes
  enemies.children.iterate(e => {
    if (!e || !e.body) return;
    if (e.body.blocked.left) e.setVelocityX(90);
    if (e.body.blocked.right) e.setVelocityX(-90);
  });
}

// ====== LÓGICA ======
function collectBurger(player, burger) {
  burger.disableBody(true, true);
  score += 10;
  scoreText.setText("Score: " + score);
}

// Mario-like stomp
function playerVsEnemy(player, enemy) {
  if (!enemy.active) return;

  const playerFalling = player.body.velocity.y > 120;
  const playerAbove = player.body.bottom <= enemy.body.top + 12;

  // Si cae sobre el enemigo => lo mata
  if (playerFalling && playerAbove) {
    enemy.disableBody(true, true);
    player.setVelocityY(-380); // rebote
    score += 25;
    scoreText.setText("Score: " + score);
    return;
  }

  // Si no, te pega => reset
  hitEnemy.call(this, player);
}

function hitEnemy(player) {
  player.setTint(0xff0000);
  this.time.delayedCall(160, () => {
    player.clearTint();
    player.setVelocity(0, 0);
    player.setPosition(120, 380);
  });
}

function winLevel(player, door) {
  // Congela jugador
  player.setVelocity(0, 0);
  player.body.enable = false;

  // Limpia controles táctiles para evitar “stick”
  touch.left = touch.right = touch.jump = false;

  // Overlay final
  const overlay = this.add.rectangle(0, 0, BASE_W, BASE_H, 0x000000, 0.55)
    .setOrigin(0, 0)
    .setScrollFactor(0);

  const title = this.add.text(BASE_W / 2, 90, "¡Nivel completado!", {
    fontFamily: "Arial",
    fontSize: "44px",
    color: "#ffffff"
  }).setOrigin(0.5).setScrollFactor(0);

  // Chica (una sola)
  const girl = this.add.image(BASE_W / 2, 290, "girl")
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setScale(0.45);

  // Bandera tailandia (una sola)
  const flag = this.add.image(BASE_W / 2, 420, "thai")
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setScale(0.28);

  const subtitle = this.add.text(BASE_W / 2, 485, "Gordoso rescató a la chica en Bangkok 🇹🇭", {
    fontFamily: "Arial",
    fontSize: "20px",
    color: "#ffffff"
  }).setOrigin(0.5).setScrollFactor(0);

  // Opcional: reiniciar tocando pantalla
  this.input.once("pointerdown", () => {
    this.scene.restart();
    score = 0;
  });
}

// ====== CONTROLES TÁCTILES (Multi-touch real) ======
function createTouchControls() {
  // Zonas transparentes (sin depender de imágenes)
  const ui = this.add.container(0, 0).setScrollFactor(0);
  this._ui = ui;

  // Crea rectángulos “botón”
  const mkBtn = (w, h, label) => {
    const btnBg = this.add.rectangle(0, 0, w, h, 0x000000, 0.25)
      .setStrokeStyle(2, 0xffffff, 0.35);

    const txt = this.add.text(0, 0, label, {
      fontFamily: "Arial",
      fontSize: "24px",
      color: "#ffffff"
    }).setOrigin(0.5);

    const c = this.add.container(0, 0, [btnBg, txt]);
    c.setSize(w, h);
    c.setInteractive(new Phaser.Geom.Rectangle(-w/2, -h/2, w, h), Phaser.Geom.Rectangle.Contains);
    ui.add(c);

    return c;
  };

  this._btnLeft = mkBtn(86, 86, "◀");
  this._btnRight = mkBtn(86, 86, "▶");
  this._btnJump = mkBtn(140, 86, "JUMP");

  // IMPORTANTÍSIMO para multi-touch: no “pisarse” entre botones
  this.input.addPointer(2);

  // Handlers (no usar pointerover; solo down/up/out)
  this._btnLeft.on("pointerdown", () => { touch.left = true; });
  this._btnLeft.on("pointerup", () => { touch.left = false; });
  this._btnLeft.on("pointerout", () => { touch.left = false; });

  this._btnRight.on("pointerdown", () => { touch.right = true; });
  this._btnRight.on("pointerup", () => { touch.right = false; });
  this._btnRight.on("pointerout", () => { touch.right = false; });

  this._btnJump.on("pointerdown", () => { touch.jump = true; });
  this._btnJump.on("pointerup", () => { /* no apagar aquí: lo apago al saltar */ });
  this._btnJump.on("pointerout", () => { /* evita “pegado” */ touch.jump = false; });

  positionTouchControls.call(this);
}

function positionTouchControls() {
  // Medidas base UI (siempre en coords del canvas base)
  const margin = 22;
  const y = BASE_H - 70;

  if (!this._btnLeft) return;

  this._btnLeft.setPosition(70, y);
  this._btnRight.setPosition(170, y);
  this._btnJump.setPosition(BASE_W - 120, y);
}
