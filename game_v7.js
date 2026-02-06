/* game.js — COMPLETO (RESIZE + ZOOM + TAMAÑOS OK + ENEMIGOS “ZORRILLOS” + PUERTA + HAMBURGUESAS)
   ✅ Pantalla sigue a Gordoso
   ✅ Todo se auto-ajusta en móvil/PC (sin verse gigante)
   ✅ Gordoso/puerta/burgers/zorrillos SIEMPRE visibles (depths)
   ✅ Controles: A/D o Flechas, salto: W o Espacio, R reinicia
   ✅ Botones táctiles (izq/der/saltar) responsivos

   IMPORTANTE:
   - Ajusta rutas/nombres de assets en preload si difieren.
   - Ajusta frameWidth/frameHeight del spritesheet gordoso si tu PNG no es 64x64 por frame.
*/

class MainScene extends Phaser.Scene {
  constructor() {
    super("MainScene");
  }

  preload() {
    // ==== AJUSTA RUTAS / NOMBRES SI ES NECESARIO ====
    this.load.image("bg", "assets/bangkok_bg.jpg");

    // platform.png es opcional: si no existe, se crea una barra fallback
    this.load.image("platform", "assets/platform.png");

    this.load.image("burger", "assets/burger.png");
    this.load.image("door", "assets/door.png");

    // Zorrillo: pon el nombre REAL de tu asset si no se llama así
    this.load.image("skunk", "assets/skunk.png");

    // Final girl opcional
    this.load.image("girl", "assets/girl.png");

    // Gordoso spritesheet: AJUSTA frameWidth/frameHeight si tu sheet es distinto
    this.load.spritesheet("gordoso", "assets/gordoso.png", {
      frameWidth: 64,
      frameHeight: 64
    });
  }

  create() {
    // ====== NIVEL ======
    this.levelWidth = 2600;
    this.levelHeight = 720;

    // Fondo (siempre atrás)
    this.bg = this.add.image(0, 0, "bg").setOrigin(0.5, 0.5);
    this.bg.setScrollFactor(0);
    this.bg.setDepth(0);

    // Mundo
    this.physics.world.setBounds(0, 0, this.levelWidth, this.levelHeight);

    // Plataformas
    this.platforms = this.physics.add.staticGroup();

    this.platformTextureKey = this.textures.exists("platform") ? "platform" : null;
    if (!this.platformTextureKey) {
      this._makeFallbackPlatformTexture();
      this.platformTextureKey = "platform_fallback";
    }

    // Suelo
    this._addPlatform(0, this.levelHeight - 40, this.levelWidth, 30);

    // Plataformas (parecido a tu layout)
    this._addPlatform(120, this.levelHeight - 170, 520, 22);
    this._addPlatform(520, this.levelHeight - 310, 520, 22);
    this._addPlatform(1040, this.levelHeight - 450, 760, 22);
    this._addPlatform(1700, this.levelHeight - 450, 760, 22);

    // ====== JUGADOR ======
    this.player = this.physics.add
      .sprite(140, this.levelHeight - 120, "gordoso", 0)
      .setCollideWorldBounds(true);

    // Tamaños “seguros” (si lo ves grande, baja scale a 0.7)
    this.player.setScale(0.85);
    this.player.setDepth(80);

    // Hitbox más amigable
    this.player.body.setSize(42, 56, true);

    this.player.setBounce(0);
    this.player.setDragX(1200);
    this.player.setMaxVelocity(340, 900);

    this.physics.add.collider(this.player, this.platforms);

    // ====== ANIMACIONES ======
    // Ajusta rangos si tus frames son distintos
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

    // ====== HAMBURGUESAS (coleccionables) ======
    this.burgers = this.physics.add.group({ allowGravity: false, immovable: true });

    // CLAVE: scale pequeño para que no se vean gigantes
    const burgerScale = 0.12;

    this._spawnBurger(620, this.levelHeight - 360, burgerScale);
    this._spawnBurger(1340, this.levelHeight - 500, burgerScale);
    this._spawnBurger(1650, this.levelHeight - 500, burgerScale);

    this.score = 0;
    this.totalBurgers = this.burgers.getLength();
    this.exitOpen = false;

    this.physics.add.overlap(this.player, this.burgers, (player, burger) => {
      burger.destroy();
      this.score++;
      this.scoreText.setText(`🍔 ${this.score}/${this.totalBurgers}`);
      if (this.score >= this.totalBurgers) this._openExit();
    });

    // ====== ZORRILLOS (enemigos simples) ======
    // Si no tienes skunk.png, comenta este bloque o cambia el asset.
    this.skunkGroup = this.physics.add.group({ allowGravity: false, immovable: true });

    // Spawns
    this._spawnSkunk(380, this.levelHeight - 195);
    this._spawnSkunk(820, this.levelHeight - 335);
    this._spawnSkunk(1880, this.levelHeight - 475);

    // Colisión con plataformas (para no atravesar si decides darles gravedad luego)
    // (Ahora allowGravity=false, así que esto es opcional.)
    // this.physics.add.collider(this.skunkGroup, this.platforms);

    // Hit con jugador => reinicia
    this.physics.add.overlap(this.player, this.skunkGroup, () => {
      this._die();
    });

    // ====== PUERTA FINAL ======
    this.door = this.physics.add.staticSprite(this.levelWidth - 160, this.levelHeight - 110, "door");
    this.door.setVisible(false);
    this.door.body.enable = false;
    this.door.setDepth(90);
    this.door.setScale(0.6);

    this.physics.add.overlap(this.player, this.door, () => {
      if (this.exitOpen) this._win();
    });

    // ====== UI ======
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

    // ====== INPUT TÁCTIL ======
    this.touch = { left: false, right: false, jump: false };
    this._createTouchControls();

    // ====== RESIZE + ZOOM (CLAVE) ======
    this.scale.on("resize", (gameSize) => {
      const { width, height } = gameSize;

      this.bg.setPosition(width / 2, height / 2);
      this._fitBackgroundToScreen(width, height);

      this._applyCameraAndUIScale(width, height);
    });

    // Inicial
    const w = this.scale.width;
    const h = this.scale.height;

    this.bg.setPosition(w / 2, h / 2);
    this._fitBackgroundToScreen(w, h);
    this._applyCameraAndUIScale(w, h);
  }

  update() {
    // Reiniciar
    if (Phaser.Input.Keyboard.JustDown(this.keyR)) {
      this.scene.restart();
      return;
    }

    // Inputs
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

    // Zorrillos: movimiento simple “patrulla” horizontal
    this._updateSkunks();
  }

  // =========================================================
  // Helpers
  // =========================================================

  _spawnBurger(x, y, scale) {
    const b = this.burgers.create(x, y, "burger");
    b.setScale(scale);
    b.setDepth(70);

    // Hitbox circular razonable según tamaño render
    const r = Math.max(8, (b.displayWidth * 0.25) | 0);
    b.body.setCircle(r);
    return b;
  }

  _spawnSkunk(x, y) {
    // Si el asset no existe, no revientes
    if (!this.textures.exists("skunk")) return null;

    const s = this.skunkGroup.create(x, y, "skunk");
    s.setDepth(75);
    s.setScale(0.35); // si se ve grande, baja a 0.25
    s.body.setSize(s.width * 0.6, s.height * 0.7, true);

    // Config de patrulla
    s.patrol = {
      originX: x,
      range: 140,
      speed: 50 + Math.random() * 25,
      dir: Math.random() > 0.5 ? 1 : -1
    };

    return s;
  }

  _updateSkunks() {
    if (!this.skunkGroup) return;

    this.skunkGroup.children.iterate((s) => {
      if (!s || !s.active || !s.patrol) return;

      const minX = s.patrol.originX - s.patrol.range;
      const maxX = s.patrol.originX + s.patrol.range;

      s.x += s.patrol.dir * (s.patrol.speed * (this.game.loop.delta / 1000));

      if (s.x < minX) s.patrol.dir = 1;
      if (s.x > maxX) s.patrol.dir = -1;

      s.setFlipX(s.patrol.dir < 0);
    });
  }

  _openExit() {
    this.exitOpen = true;

    this.door.setVisible(true);
    this.door.body.enable = true;

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

  _die() {
    // Reinicio simple (puedes poner animación luego)
    this.scene.restart();
  }

  _win() {
    // Bloquea overlaps repetidos
    this.door.body.enable = false;

    // UI de win
    const w = this.scale.width;
    const h = this.scale.height;

    this.add
      .rectangle(w / 2, h / 2, Math.min(520, w * 0.9), 220, 0x000000, 0.55)
      .setScrollFactor(0)
      .setDepth(2000);

    this.add
      .text(w / 2, h / 2, "🎉 ¡Ganaste!\nPresiona R para reiniciar", {
        fontFamily: "Arial",
        fontSize: "26px",
        color: "#ffffff",
        align: "center"
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2001);

    // “Final girl” opcional si existe el asset
    if (this.textures.exists("girl") && !this.girl) {
      this.girl = this.add.sprite(this.door.x + 90, this.door.y + 10, "girl");
      this.girl.setDepth(95);
      this.girl.setScale(0.6);
    }
  }

  _addPlatform(x, y, width, height) {
    const p = this.platforms.create(x + width / 2, y + height / 2, this.platformTextureKey);
    p.setDisplaySize(width, height);
    p.refreshBody();
    return p;
  }

  _makeFallbackPlatformTexture() {
    const g = this.add.graphics();
    g.fillStyle(0x1a1a1a, 1);
    g.fillRoundedRect(0, 0, 512, 48, 18);
    g.fillStyle(0x2ee66b, 1);
    g.fillRoundedRect(8, 40, 496, 6, 3);
    g.generateTexture("platform_fallback", 512, 48);
    g.destroy();
  }

  _fitBackgroundToScreen(screenW, screenH) {
    const tex = this.textures.get("bg");
    if (!tex || !tex.getSourceImage()) return;

    const imgW = tex.getSourceImage().width;
    const imgH = tex.getSourceImage().height;

    // cover
    const scale = Math.max(screenW / imgW, screenH / imgH);
    this.bg.setScale(scale);
  }

  _applyCameraAndUIScale(w, h) {
    // Base “diseño”
    const baseW = 960;
    const baseH = 540;

    // En pantallas pequeñas, zoom < 1 para que NO se vea gigante
    const zoom = Math.min(w / baseW, h / baseH);

    this.cameras.main.setZoom(zoom);

    // UI fija
    if (this.scoreText) this.scoreText.setPosition(16, 44);

    // Controles táctiles
    this._layoutTouchControls(w, h);
  }

  // ---------------- Touch controls ----------------

  _createTouchControls() {
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

    this.btns.left.on("pointerdown", () => (this.touch.left = true));
    this.btns.left.on("pointerup", () => (this.touch.left = false));
    this.btns.left.on("pointerout", () => (this.touch.left = false));

    this.btns.right.on("pointerdown", () => (this.touch.right = true));
    this.btns.right.on("pointerup", () => (this.touch.right = false));
    this.btns.right.on("pointerout", () => (this.touch.right = false));

    this.btns.jump.on("pointerdown", () => (this.touch.jump = true));
    this.btns.jump.on("pointerup", () => (this.touch.jump = false));
    this.btns.jump.on("pointerout", () => (this.touch.jump = false));

    // Si quieres que solo se vean en móvil, aquí podrías ocultarlos en desktop.
    this.btns.left.setVisible(true);
    this.btns.right.setVisible(true);
    this.btns.jump.setVisible(true);
  }

  _layoutTouchControls(w, h) {
    if (!this.btns) return;

    const m = 60;

    this.btns.left.setPosition(m, h - m);
    this.btns.right.setPosition(m + 90, h - m);
    this.btns.jump.setPosition(w - m, h - m);

    if (h < 420) {
      this.btns.left.y = h - 50;
      this.btns.right.y = h - 50;
      this.btns.jump.y = h - 50;
    }
  }

  _consumeTouchJump() {
    if (this.touch.jump) {
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
