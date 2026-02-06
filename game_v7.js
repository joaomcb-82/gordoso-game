/* game.js — VERSION RESIZE + FIXES (PC + móvil)
   - Canvas ocupa 100vw/100vh (con CSS en index.html)
   - Phaser Scale: RESIZE + autocenter
   - Mundo con bounds/cámara estables
   - Controles: A/D o Flechas, salto: W o Espacio, R reinicia
   - Botones táctiles (izq/der/saltar) opcionales y responsivos
*/

class MainScene extends Phaser.Scene {
  constructor() {
    super("MainScene");
  }

  preload() {
    // ==== AJUSTA RUTAS A TUS ASSETS ====
    // Cambia nombres si los tuyos son distintos
    this.load.image("bg", "assets/bangkok_bg.jpg");
    this.load.image("platform", "assets/platform.png"); // si no existe, usará una barra generada
    this.load.image("burger", "assets/burger.png");
    this.load.image("door", "assets/door.png");
    this.load.image("girl", "assets/girl.png"); // si no tienes, puedes comentar el spawn

    this.load.spritesheet("gordoso", "assets/gordoso.png", {
      frameWidth: 64,
      frameHeight: 64
    });
  }

  create() {
    // ====== PARÁMETROS DE NIVEL (ajusta a tu gusto) ======
    // Mundo más ancho que la pantalla para que haya scroll horizontal
    this.levelWidth = 2400;
    this.levelHeight = 720;

    // Fondo
    this.bg = this.add.image(0, 0, "bg").setOrigin(0.5, 0.5);
    this.bg.setScrollFactor(0); // fijo a la cámara

    // Physics bounds del mundo
    this.physics.world.setBounds(0, 0, this.levelWidth, this.levelHeight);

    // Grupo de plataformas estáticas
    this.platforms = this.physics.add.staticGroup();

    // Si tienes imagen de plataforma úsala; si no, creamos barras con graphics+texture
    this.platformTextureKey = this.textures.exists("platform") ? "platform" : null;
    if (!this.platformTextureKey) {
      this._makeFallbackPlatformTexture();
      this.platformTextureKey = "platform_fallback";
    }

    // ====== PLATAFORMAS (edita posiciones/anchos) ======
    // Suelo
    this._addPlatform(0, this.levelHeight - 40, this.levelWidth, 30);

    // Algunas plataformas tipo parkour (similar a tu screenshot)
    this._addPlatform(120, this.levelHeight - 170, 520, 22);
    this._addPlatform(520, this.levelHeight - 310, 520, 22);
    this._addPlatform(1020, this.levelHeight - 450, 780, 22);
    this._addPlatform(1540, this.levelHeight - 450, 680, 22);

    // ====== JUGADOR ======
    this.player = this.physics.add
      .sprite(140, this.levelHeight - 120, "gordoso", 0)
      .setCollideWorldBounds(true);

    this.player.body.setSize(42, 56, true); // hitbox más amigable (ajusta si quieres)
    this.player.setBounce(0);
    this.player.setDragX(1200);
    this.player.setMaxVelocity(320, 900);

    // Colisiones
    this.physics.add.collider(this.player, this.platforms);

    // ====== ANIMACIONES (ajusta frames según tu spritesheet) ======
    if (!this.anims.exists("idle")) {
      this.anims.create({
        key: "idle",
        frames: [{ key: "gordoso", frame: 0 }],
        frameRate: 1,
        repeat: -1
      });
    }
    if (!this.anims.exists("run")) {
      this.anims.create({
        key: "run",
        frames: this.anims.generateFrameNumbers("gordoso", { start: 1, end: 6 }),
        frameRate: 12,
        repeat: -1
      });
    }

    this.player.play("idle");

    // ====== COLECCIONABLES (hamburguesas) ======
    this.burgers = this.physics.add.group({ allowGravity: false, immovable: true });

    // Tamaño más pequeño (tu screenshot se ve grande)
    const burgerScale = 0.35;

    // Coloca burgers sobre plataformas
    this._spawnBurger(620, this.levelHeight - 360, burgerScale);
    this._spawnBurger(1340, this.levelHeight - 500, burgerScale);
    this._spawnBurger(1650, this.levelHeight - 500, burgerScale);

    this.physics.add.overlap(this.player, this.burgers, (player, burger) => {
      burger.destroy();
      this.score++;
      this.scoreText.setText(`🍔 ${this.score}/${this.totalBurgers}`);
      if (this.score >= this.totalBurgers) {
        this._openExit();
      }
    });

    // ====== META (puerta) ======
    this.door = this.physics.add.staticSprite(this.levelWidth - 160, this.levelHeight - 110, "door");
    this.door.setVisible(false);
    this.door.body.enable = false;

    this.physics.add.overlap(this.player, this.door, () => {
      if (this.exitOpen) this._win();
    });

    // ====== UI (texto) ======
    this.score = 0;
    this.totalBurgers = this.burgers.getLength();
    this.exitOpen = false;

    this.scoreText = this.add
      .text(16, 44, `🍔 0/${this.totalBurgers}`, {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#ffffff",
        backgroundColor: "rgba(0,0,0,0.35)",
        padding: { x: 10, y: 6 }
      })
      .setScrollFactor(0)
      .setDepth(999);

    // ====== CÁMARA ======
    this.cameras.main.setBounds(0, 0, this.levelWidth, this.levelHeight);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // ====== INPUT TECLADO ======
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    // ====== INPUT TÁCTIL (botones) ======
    this.touch = { left: false, right: false, jump: false };
    this._createTouchControls();

    // ====== RESIZE (clave para tu problema) ======
    this.scale.on("resize", (gameSize) => {
      const { width, height } = gameSize;

      // Ajusta fondo a la pantalla
      this.bg.setPosition(width / 2, height / 2);
      this._fitBackgroundToScreen(width, height);

      // Reubica UI fija
      this.scoreText.setPosition(16, 44);

      // Reubica controles táctiles
      this._layoutTouchControls(width, height);
    });

    // Llamada inicial para fit
    const w = this.scale.width;
    const h = this.scale.height;
    this.bg.setPosition(w / 2, h / 2);
    this._fitBackgroundToScreen(w, h);
    this._layoutTouchControls(w, h);
  }

  update() {
    // Reiniciar
    if (Phaser.Input.Keyboard.JustDown(this.keyR)) {
      this.scene.restart();
      return;
    }

    // Lectura de inputs (teclado + touch)
    const left =
      this.cursors.left.isDown || this.keyA.isDown || this.touch.left === true;

    const right =
      this.cursors.right.isDown || this.keyD.isDown || this.touch.right === true;

    const jump =
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.cursors.space) ||
      Phaser.Input.Keyboard.JustDown(this.keyW) ||
      this._consumeTouchJump();

    // Movimiento
    const speed = 240;

    if (left) {
      this.player.setAccelerationX(-1200);
      this.player.setFlipX(true);
      if (this.player.body.onFloor()) this.player.play("run", true);
    } else if (right) {
      this.player.setAccelerationX(1200);
      this.player.setFlipX(false);
      if (this.player.body.onFloor()) this.player.play("run", true);
    } else {
      this.player.setAccelerationX(0);
      if (this.player.body.onFloor()) this.player.play("idle", true);
    }

    // Salto
    if (jump && this.player.body.onFloor()) {
      this.player.setVelocityY(-520);
    }

    // “fall safety”
    if (this.player.y > this.levelHeight + 200) {
      this.player.setPosition(140, this.levelHeight - 120);
      this.player.setVelocity(0, 0);
    }
  }

  // =========================================================
  // Helpers
  // =========================================================

  _spawnBurger(x, y, scale) {
    const b = this.burgers.create(x, y, "burger");
    b.setScale(scale);
    b.body.setCircle(Math.max(10, (b.displayWidth * 0.35) | 0));
    return b;
  }

  _openExit() {
    this.exitOpen = true;
    this.door.setVisible(true);
    this.door.body.enable = true;

    // Mensaje
    if (!this.winHint) {
      this.winHint = this.add
        .text(16, 80, "✅ Puerta abierta → ve al final", {
          fontFamily: "Arial",
          fontSize: "18px",
          color: "#ffffff",
          backgroundColor: "rgba(0,0,0,0.35)",
          padding: { x: 10, y: 6 }
        })
        .setScrollFactor(0)
        .setDepth(999);
    }
  }

  _win() {
    // Bloquea controles
    this.player.setAccelerationX(0);
    this.player.setVelocityX(0);

    // “Final girl” opcional si tienes sprite
    if (this.textures.exists("girl")) {
      if (!this.girl) {
        this.girl = this.add.sprite(this.door.x + 90, this.door.y + 10, "girl");
        this.girl.setDepth(10);
      }
    }

    // Pantalla win
    const w = this.scale.width;
    const h = this.scale.height;

    const panel = this.add
      .rectangle(w / 2, h / 2, Math.min(520, w * 0.9), 220, 0x000000, 0.55)
      .setScrollFactor(0)
      .setDepth(2000);

    const txt = this.add
      .text(w / 2, h / 2, "🎉 ¡Ganaste!\nPresiona R para reiniciar", {
        fontFamily: "Arial",
        fontSize: "26px",
        color: "#ffffff",
        align: "center"
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2001);

    // Detiene overlaps repetidos
    this.door.body.enable = false;
  }

  _addPlatform(x, y, width, height) {
    // Construimos plataforma con imagen estirada o textura fallback
    const p = this.platforms.create(x + width / 2, y + height / 2, this.platformTextureKey);
    p.setDisplaySize(width, height);
    p.refreshBody();
    return p;
  }

  _makeFallbackPlatformTexture() {
    // Crea una textura tipo “barra” si no existe platform.png
    const g = this.add.graphics();
    g.fillStyle(0x1a1a1a, 1);
    g.fillRoundedRect(0, 0, 512, 48, 18);
    g.fillStyle(0x2ee66b, 1);
    g.fillRoundedRect(8, 40, 496, 6, 3);
    g.generateTexture("platform_fallback", 512, 48);
    g.destroy();
  }

  _fitBackgroundToScreen(screenW, screenH) {
    // Ajusta bg para cubrir toda la pantalla (cover)
    const tex = this.textures.get("bg");
    if (!tex || !tex.getSourceImage()) return;

    const imgW = tex.getSourceImage().width;
    const imgH = tex.getSourceImage().height;

    const scale = Math.max(screenW / imgW, screenH / imgH);
    this.bg.setScale(scale);
  }

  // ---------------- Touch controls ----------------

  _createTouchControls() {
    // Si no es táctil, igual los crea pero invisibles; puedes forzarlos visibles si quieres.
    this.btns = {};

    const makeBtn = (label) => {
      const c = this.add.container(0, 0).setScrollFactor(0).setDepth(3000);
      const bg = this.add.circle(0, 0, 34, 0x000000, 0.35);
      const tx = this.add.text(0, 0, label, {
        fontFamily: "Arial",
        fontSize: "22px",
        color: "#ffffff"
      }).setOrigin(0.5);

      c.add([bg, tx]);
      c.setSize(80, 80);
      c.setInteractive(new Phaser.Geom.Circle(0, 0, 40), Phaser.Geom.Circle.Contains);

      return c;
    };

    this.btns.left = makeBtn("◀");
    this.btns.right = makeBtn("▶");
    this.btns.jump = makeBtn("⤒");

    // Eventos
    this.btns.left.on("pointerdown", () => (this.touch.left = true));
    this.btns.left.on("pointerup", () => (this.touch.left = false));
    this.btns.left.on("pointerout", () => (this.touch.left = false));

    this.btns.right.on("pointerdown", () => (this.touch.right = true));
    this.btns.right.on("pointerup", () => (this.touch.right = false));
    this.btns.right.on("pointerout", () => (this.touch.right = false));

    this.btns.jump.on("pointerdown", () => (this.touch.jump = true));
    this.btns.jump.on("pointerup", () => (this.touch.jump = false));
    this.btns.jump.on("pointerout", () => (this.touch.jump = false));

    // Por defecto: visibles (si quieres solo móvil, coméntalo y haz la lógica por userAgent)
    this.btns.left.setVisible(true);
    this.btns.right.setVisible(true);
    this.btns.jump.setVisible(true);
  }

  _layoutTouchControls(w, h) {
    if (!this.btns) return;

    // Margen desde bordes
    const m = 60;

    // Izquierda: abajo-izq
    this.btns.left.setPosition(m, h - m);

    // Derecha: al lado
    this.btns.right.setPosition(m + 90, h - m);

    // Saltar: abajo-der
    this.btns.jump.setPosition(w - m, h - m);

    // En pantallas muy bajas, sube un poco
    if (h < 420) {
      this.btns.left.y = h - 50;
      this.btns.right.y = h - 50;
      this.btns.jump.y = h - 50;
    }
  }

  _consumeTouchJump() {
    if (this.touch.jump) {
      // “one-shot” para que no salte infinito si mantienes presionado
      this.touch.jump = false;
      return true;
    }
    return false;
  }
}

// ================== CONFIG RESIZE (CLAVE) ==================
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
  scene: [MainScene]
};

new Phaser.Game(config);
