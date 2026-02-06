/* game.js — BASE GAMEPLAY (Level 1 ONLY)
   - gordoso.png y skunk.png son IMÁGENES (no spritesheet)
   - sin puerta / sin chica / sin nivel 2 (solo base estable)
*/

class Level1 extends Phaser.Scene {
  constructor() {
    super("Level1");
  }

  preload() {
    // Assets confirmados en /assets
    this.load.image("bg", "assets/bangkok_bg.jpg");
    this.load.image("gordoso", "assets/gordoso.png");
    this.load.image("skunk", "assets/skunk.png");
    this.load.image("burger", "assets/burger.png");
  }

  create() {
    // ===== CONFIG NIVEL =====
    this.levelWidth = 2600;
    this.levelHeight = 720;

    // Bounds del mundo
    this.physics.world.setBounds(0, 0, this.levelWidth, this.levelHeight);

    // Fondo (visual)
    this.bg = this.add.image(0, 0, "bg").setOrigin(0.5);
    this.bg.setScrollFactor(0);
    this.bg.setDepth(0);

    // Plataformas: textura fallback (no depende de PNG)
    this._makePlatformTexture();
    this.platforms = this.physics.add.staticGroup();
    this.platformRects = []; // guardo datos para spawns “encima”

    // Suelo
    this._addPlatform(0, this.levelHeight - 40, this.levelWidth, 30);

    // Plataformas (x, yTop, width, height)
    this._addPlatform(120, this.levelHeight - 170, 520, 22);
    this._addPlatform(520, this.levelHeight - 310, 520, 22);
    this._addPlatform(1040, this.levelHeight - 450, 760, 22);
    this._addPlatform(1700, this.levelHeight - 450, 760, 22);

    // ===== PLAYER (GORDOSO) =====
    this.player = this.physics.add.image(140, this.levelHeight - 120, "gordoso");
    this.player.setDepth(100);
    this.player.setCollideWorldBounds(true);

    // 🔥 TAMAÑO GORDOSO (baja/sube aquí)
    this.PLAYER_SCALE = 0.18;
    this.player.setScale(this.PLAYER_SCALE);

    // Hitbox proporcional (no uses size “auto” del PNG)
    this._setBodyToDisplay(this.player, 0.55, 0.78);

    // Movimiento
    this.player.setDragX(1600);
    this.player.setMaxVelocity(360, 900);
    this.player.setBounce(0);

    // Colisión con plataformas
    this.physics.add.collider(this.player, this.platforms);

    // ===== HAMBURGUESAS (coleccionables) =====
    this.burgers = this.physics.add.group({ allowGravity: false, immovable: true });

    // Tamaño burger
    this.BURGER_SCALE = 0.075;

    // Spawns encima de plataformas (index 1..4 según creación)
    this._spawnBurgerOnPlatform(2, 0.55); // plataforma 2
    this._spawnBurgerOnPlatform(3, 0.45); // plataforma 3
    this._spawnBurgerOnPlatform(4, 0.70); // plataforma 4

    this.score = 0;
    this.totalBurgers = this.burgers.getLength();

    // Overlap robusto: tocar = recoger
    this.physics.add.overlap(this.player, this.burgers, (_p, burger) => {
      burger.disableBody(true, true);
      this.score++;
      this.scoreText.setText(`🍔 ${this.score}/${this.totalBurgers}`);
    });

    // ===== ZORRILLOS (enemigos) =====
    this.enemies = this.physics.add.group({
      allowGravity: true
    });

    // Escala enemigos proporcional a Gordoso
    this.SKUNK_SCALE = 0.14; // ajusta si los quieres un poco más grandes/pequeños

    // Spawn sobre plataformas
    this._spawnSkunkWalkerOnPlatform(1, 0.55); // plat 1
    this._spawnSkunkWalkerOnPlatform(2, 0.25); // plat 2
    this._spawnSkunkWalkerOnPlatform(4, 0.35); // plat 4

    // Para que CAMINEN sobre las plataformas (no floten)
    this.physics.add.collider(this.enemies, this.platforms);

    // Tocar enemigo = restart
    this.physics.add.overlap(this.player, this.enemies, () => {
      this.scene.restart();
    });

    // ===== UI =====
    this.scoreText = this.add
      .text(16, 44, `🍔 0/${this.totalBurgers}`, {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#fff",
        backgroundColor: "rgba(0,0,0,0.35)",
        padding: { x: 10, y: 6 }
      })
      .setScrollFactor(0)
      .setDepth(999);

    // ===== CÁMARA =====
    this.cameras.main.setBounds(0, 0, this.levelWidth, this.levelHeight);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // ===== INPUT =====
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    // ===== RESIZE SIMPLE (sin zoom raro) =====
    this.scale.on("resize", (gameSize) => {
      const { width, height } = gameSize;
      this.bg.setPosition(width / 2, height / 2);
      this._fitBackgroundToScreen(width, height);
    });

    const w = this.scale.width;
    const h = this.scale.height;
    this.bg.setPosition(w / 2, h / 2);
    this._fitBackgroundToScreen(w, h);
  }

  update() {
    // Restart
    if (Phaser.Input.Keyboard.JustDown(this.keyR)) {
      this.scene.restart();
      return;
    }

    // Movimiento
    const left = this.cursors.left.isDown || this.keyA.isDown;
    const right = this.cursors.right.isDown || this.keyD.isDown;

    const jump =
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.cursors.space) ||
      Phaser.Input.Keyboard.JustDown(this.keyW);

    if (left) {
      this.player.setAccelerationX(-1500);
      this.player.setFlipX(true);
    } else if (right) {
      this.player.setAccelerationX(1500);
      this.player.setFlipX(false);
    } else {
      this.player.setAccelerationX(0);
    }

    if (jump && this.player.body.onFloor()) {
      this.player.setVelocityY(-520);
    }

    // Patrol enemigos
    this._updateSkunks();

    // Safety fall
    if (this.player.y > this.levelHeight + 250) {
      this.player.setPosition(140, this.levelHeight - 120);
      this.player.setVelocity(0, 0);
    }
  }

  // ==============================
  // HELPERS
  // ==============================

  _makePlatformTexture() {
    const g = this.add.graphics();
    g.fillStyle(0x101010, 1);
    g.fillRoundedRect(0, 0, 512, 48, 18);
    g.fillStyle(0x2ee66b, 1);
    g.fillRoundedRect(10, 40, 492, 6, 3);
    g.generateTexture("platform_fallback", 512, 48);
    g.destroy();
  }

  _addPlatform(x, yTop, width, height) {
    const p = this.platforms.create(x + width / 2, yTop + height / 2, "platform_fallback");
    p.setDisplaySize(width, height);
    p.refreshBody();

    // Guarda rect para spawns encima
    this.platformRects.push({
      x,
      yTop,
      width,
      height,
      left: x,
      right: x + width,
      top: yTop
    });

    return p;
  }

  _spawnBurgerOnPlatform(platformIndex1Based, xRatio = 0.5) {
    const plat = this.platformRects[platformIndex1Based - 1];
    if (!plat) return;

    const x = plat.left + plat.width * xRatio;
    const y = plat.top - 26; // encima

    const b = this.burgers.create(x, y, "burger");
    b.setDepth(90);
    b.setScale(this.BURGER_SCALE);

    // Hitbox = lo que se ve
    b.body.setSize(b.displayWidth, b.displayHeight, true);

    return b;
  }

  _spawnSkunkWalkerOnPlatform(platformIndex1Based, xRatio = 0.5) {
    const plat = this.platformRects[platformIndex1Based - 1];
    if (!plat) return;

    const x = plat.left + plat.width * xRatio;

    // Y de spawn: un poco arriba; la gravedad lo hace caer y el collider lo “asienta”
    const y = plat.top - 120;

    const s = this.enemies.create(x, y, "skunk");
    s.setDepth(95);
    s.setScale(this.SKUNK_SCALE);

    // hitbox
    this._setBodyToDisplay(s, 0.65, 0.70);

    // patrol bounds dentro de la plataforma
    s.patrol = {
      left: plat.left + 25,
      right: plat.right - 25,
      speed: 70,   // velocidad caminar
      dir: Math.random() > 0.5 ? 1 : -1
    };

    // Para que no se “patine” raro
    s.setDragX(0);
    s.setMaxVelocity(120, 900);

    return s;
  }

  _updateSkunks() {
    const dt = this.game.loop.delta / 1000;

    this.enemies.children.iterate((s) => {
      if (!s || !s.active || !s.patrol) return;

      // Solo mueve si ya está apoyado (evita “volar” en caída)
      if (!s.body.onFloor()) return;

      s.setVelocityX(s.patrol.dir * s.patrol.speed);

      if (s.x < s.patrol.left) {
        s.x = s.patrol.left;
        s.patrol.dir = 1;
      } else if (s.x > s.patrol.right) {
        s.x = s.patrol.right;
        s.patrol.dir = -1;
      }

      s.setFlipX(s.patrol.dir < 0);
    });
  }

  _setBodyToDisplay(obj, wFactor = 1, hFactor = 1) {
    obj.body.setSize(obj.displayWidth * wFactor, obj.displayHeight * hFactor, true);
  }

  _fitBackgroundToScreen(screenW, screenH) {
    const tex = this.textures.get("bg");
    if (!tex || !tex.getSourceImage()) return;

    const imgW = tex.getSourceImage().width;
    const imgH = tex.getSourceImage().height;

    const scale = Math.max(screenW / imgW, screenH / imgH);
    this.bg.setScale(scale);
  }
}

// ===== CONFIG =====
const config = {
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#000",
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: "arcade",
    arcade: { gravity: { y: 900 }, debug: false }
  },
  scene: [Level1]
};

new Phaser.Game(config);
