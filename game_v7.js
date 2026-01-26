// Gordoso - Bangkok Run (v7) - Mobile fixes + stomp enemies

// ====== CONFIG ======
const WIDTH = 960;
const HEIGHT = 540;
const WORLD_WIDTH = 2000;

const config = {
  type: Phaser.AUTO,
  width: WIDTH,
  height: HEIGHT,
  parent: "game",
  backgroundColor: "#000000",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 1200 },
      debug: false,
    },
  },
  // 🔥 clave para móvil (letterbox correcto, sin estirar)
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: WIDTH,
    height: HEIGHT,
  },
  scene: { preload, create, update },
};

new Phaser.Game(config);

// ====== GLOBALS ======
let player;
let platforms;
let burgers;
let enemies;
let door;
let score = 0;
let scoreText;

let cursors, keyW, keySpace;
let keyA, keyD;

// Estado de controles táctiles
let touchLeft = false;
let touchRight = false;
let touchJumpQueued = false;

function preload() {
  this.load.image("bg", "assets/bangkok_bg.jpg");
  this.load.image("gordoso", "assets/gordoso.png");
  this.load.image("burger", "assets/burger.png");
  this.load.image("skunk", "assets/skunk.png");
  this.load.image("door", "assets/door.png");
  // (si tienes girl/thai_flag para escena final, no afecta aquí)
}

function create() {
  // ✅ Permite multi-touch real (mover + saltar a la vez)
  this.input.addPointer(2);

  // --- Fondo ---
  const bg = this.add.image(0, 0, "bg")
    .setOrigin(0, 0)
    .setScrollFactor(0);

  bg.displayWidth = WORLD_WIDTH;
  bg.displayHeight = HEIGHT;

  // --- Mundo / cámara ---
  this.physics.world.setBounds(0, 0, WORLD_WIDTH, HEIGHT);
  this.cameras.main.setBounds(0, 0, WORLD_WIDTH, HEIGHT);

  // --- Teclado ---
  cursors = this.input.keyboard.createCursorKeys();
  keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
  keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
  keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

  // --- Texturas para plataformas ---
  const g = this.add.graphics();
  g.fillStyle(0x1ddc00, 1);
  g.fillRect(0, 0, 220, 20);
  g.generateTexture("plat220x20", 220, 20);
  g.clear();
  g.fillStyle(0x1ddc00, 1);
  g.fillRect(0, 0, WORLD_WIDTH, 40);
  g.generateTexture("ground", WORLD_WIDTH, 40);
  g.destroy();

  // --- Plataformas ---
  platforms = this.physics.add.staticGroup();

  // Suelo
  platforms.create(WORLD_WIDTH / 2, HEIGHT - 20, "ground").refreshBody();

  // Plataformas (x, y)
  platforms.create(420, 420, "plat220x20").refreshBody();
  platforms.create(750, 340, "plat220x20").refreshBody();
  platforms.create(1120, 420, "plat220x20").refreshBody();
  platforms.create(1450, 320, "plat220x20").refreshBody();
  platforms.create(1700, 420, "plat220x20").refreshBody();

  // --- Jugador ---
  player = this.physics.add.sprite(120, 380, "gordoso");
  player.setCollideWorldBounds(true);

  // ✅ Ajuste proporciones (más pequeño)
  player.setScale(0.16);

  // ✅ Hitbox más razonable
  player.body.setSize(player.width * 0.55, player.height * 0.80, true);

  this.physics.add.collider(player, platforms);

  // Cámara sigue al jugador
  this.cameras.main.startFollow(player, true, 0.08, 0.08);
  this.cameras.main.setDeadzone(160, 120);

  // --- Hamburguesas ---
  burgers = this.physics.add.group({
    bounceY: 0.2,
    collideWorldBounds: true,
  });

  const burgerPositions = [
    { x: 420, y: 0 },
    { x: 760, y: 0 },
    { x: 1120, y: 0 },
    { x: 1450, y: 0 },
    { x: 1700, y: 0 },
  ];

  burgerPositions.forEach(p => {
    const b = burgers.create(p.x, p.y, "burger");
    b.setScale(0.12);
    b.body.setSize(b.width * 0.7, b.height * 0.7, true);
  });

  this.physics.add.collider(burgers, platforms);
  this.physics.add.overlap(player, burgers, collectBurger, null, this);

  // --- Enemigos (zorrillos) ---
  enemies = this.physics.add.group();

  const s1 = enemies.create(1200, 380, "skunk");
  s1.setScale(0.28); // ✅ más grande
  s1.setCollideWorldBounds(true);
  s1.setVelocityX(-80);

  const s2 = enemies.create(1600, 380, "skunk");
  s2.setScale(0.28); // ✅ más grande
  s2.setCollideWorldBounds(true);
  s2.setVelocityX(80);

  this.physics.add.collider(enemies, platforms);

  // ✅ Overlap especial: stomp tipo Mario
  this.physics.add.overlap(player, enemies, stompOrHit, null, this);

  // --- Puerta final ---
  door = this.physics.add.staticSprite(WORLD_WIDTH - 120, 410, "door");
  door.setScale(0.35);
  door.refreshBody(); // ✅ IMPORTANTÍSIMO en cuerpos estáticos escalados
  this.physics.add.overlap(player, door, winLevel, null, this);

  // --- UI Score ---
  scoreText = this.add.text(16, 16, "Score: 0", {
    fontFamily: "Arial",
    fontSize: "20px",
    color: "#ffffff",
    backgroundColor: "rgba(0,0,0,0.45)",
    padding: { x: 10, y: 6 },
  }).setScrollFactor(0).setDepth(2000);

  // --- Controles táctiles (solo si hay touch) ---
  // Nota: NO son objetos de física => no bloquean al jugador
  createTouchControls.call(this);
}

function createTouchControls() {
  const isTouch = this.sys.game.device.input.touch;
  if (!isTouch) return;

  const ui = this.add.container(0, 0).setScrollFactor(0).setDepth(3000);

  // Botón base
  const makeBtn = (x, y, w, h, label) => {
    const rect = this.add.rectangle(x, y, w, h, 0xffffff, 0.18)
      .setStrokeStyle(2, 0xffffff, 0.25)
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: false });

    const txt = this.add.text(x + w / 2, y + h / 2, label, {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#ffffff",
    }).setOrigin(0.5);

    ui.add([rect, txt]);
    return rect;
  };

  // Layout: abajo a la izquierda 2 botones (◀ ▶), a la derecha JUMP
  const pad = 16;
  const btn = 70;
  const bottom = HEIGHT - btn - pad;

  const leftBtn  = makeBtn(pad, bottom, btn, btn, "◀");
  const rightBtn = makeBtn(pad + btn + 12, bottom, btn, btn, "▶");
  const jumpBtn  = makeBtn(WIDTH - btn - pad, bottom, btn + 25, btn, "JUMP");

  // Helper robusto para evitar botones “pegados”
  const bindHold = (obj, onDown, onUp) => {
    obj.on("pointerdown", (p) => {
      p.event?.preventDefault?.();
      onDown();
    });
    obj.on("pointerup", (p) => {
      p.event?.preventDefault?.();
      onUp();
    });
    obj.on("pointerout", () => onUp());
    obj.on("pointercancel", () => onUp());
    obj.on("pointerupoutside", () => onUp());
  };

  bindHold(leftBtn,
    () => { touchLeft = true; },
    () => { touchLeft = false; }
  );

  bindHold(rightBtn,
    () => { touchRight = true; },
    () => { touchRight = false; }
  );

  // Jump: se “encola” (para que funcione aunque justo no esté en el suelo)
  bindHold(jumpBtn,
    () => { touchJumpQueued = true; },
    () => { /* no hacer nada */ }
  );

  // Por si Safari “pierde” el touch al cambiar orientación:
  this.scale.on("resize", () => {
    touchLeft = false;
    touchRight = false;
    touchJumpQueued = false;
  });
}

function update() {
  // --- Movimiento ---
  const leftKey = cursors.left.isDown || keyA.isDown;
  const rightKey = cursors.right.isDown || keyD.isDown;

  const left = leftKey || touchLeft;
  const right = rightKey || touchRight;

  if (left && !right) {
    player.setVelocityX(-220);
    player.setFlipX(true);
  } else if (right && !left) {
    player.setVelocityX(220);
    player.setFlipX(false);
  } else {
    player.setVelocityX(0);
  }

  // --- Salto teclado ---
  const jumpPressed =
    Phaser.Input.Keyboard.JustDown(keySpace) ||
    Phaser.Input.Keyboard.JustDown(keyW) ||
    Phaser.Input.Keyboard.JustDown(cursors.up);

  // --- Salto táctil (encolado) ---
  if (touchJumpQueued && player.body.blocked.down) {
    player.setVelocityY(-520);
    touchJumpQueued = false;
  }

  if (jumpPressed && player.body.blocked.down) {
    player.setVelocityY(-520);
  }

  // IA simple enemigos: rebotan en bordes
  enemies.children.iterate(e => {
    if (!e) return;
    if (e.body.blocked.left) e.setVelocityX(80);
    if (e.body.blocked.right) e.setVelocityX(-80);
  });
}

function collectBurger(player, burger) {
  burger.disableBody(true, true);
  score += 10;
  scoreText.setText("Score: " + score);
}

// ✅ Mario stomp: si estás cayendo y vienes desde arriba => matas enemigo
function stompOrHit(player, enemy) {
  if (!enemy.active) return;

  const playerFalling = player.body.velocity.y > 50;
  const playerAboveEnemy = player.body.bottom <= enemy.body.top + 10;

  if (playerFalling && playerAboveEnemy) {
    enemy.disableBody(true, true);
    player.setVelocityY(-380); // rebote
    score += 50;
    scoreText.setText("Score: " + score);
  } else {
    hitEnemy.call(this, player, enemy);
  }
}

function hitEnemy(player, enemy) {
  player.setTint(0xff0000);
  this.time.delayedCall(150, () => {
    player.clearTint();
    player.setVelocity(0, 0);
    player.setPosition(120, 380);
  });
}

function winLevel(player, door) {
  player.setVelocity(0, 0);
  player.body.enable = false;

  const msg = this.add.text(WIDTH / 2, HEIGHT / 2, "¡Nivel completado!", {
    fontFamily: "Arial",
    fontSize: "40px",
    color: "#ffffff",
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: { x: 18, y: 10 },
  }).setOrigin(0.5).setScrollFactor(0).setDepth(4000);

  this.time.delayedCall(1500, () => msg.destroy());
}
