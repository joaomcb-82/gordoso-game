/* game.js — FINAL FIX (sin platform.png, gordoso más chico, zorrillos proporcionados sobre plataformas)
   ✅ NO intenta cargar assets/platform.png (evita 404)
   ✅ Plataformas con textura fallback (barra negra/verde) siempre
   ✅ Gordoso (imagen) más chico y con hitbox correcta
   ✅ Hamburguesas se “comen” siempre (hitbox = display size + disableBody)
   ✅ Zorrillos visibles, proporcionados y puestos ENCIMA de plataformas
   ✅ Cámara sigue a Gordoso + zoom dinámico para móvil/PC
   ✅ Teclado + botones táctiles
*/

class MainScene extends Phaser.Scene {
  constructor() {
    super("MainScene");
  }

  preload() {
    // Rutas confirmadas por ti
    this.load.image("bg", "assets/bangkok_bg.jpg");
    this.load.image("gordoso", "assets/gordoso.png");
    this.load.image("burger", "assets/burger.png");
    this.load.image("door", "assets/door.png");

    // Si existe en assets, perfecto. Si no existe, no spawnea.
    this.load.image("skunk", "assets/skunk.png");
  }

  create() {
    // ===== Mundo =====
    this.levelWidth = 2600;
    this.levelHeight = 720;

    this.physics.world.setBounds(0, 0, this.levelWidth, this.levelHeight);

    // ===== Fondo =====
    this.bg = this.add.image(0, 0, "bg").setOrigin(0.5);
    this.bg.setScrollFactor(0);
    this.bg.setDepth(0);

    // ===== Plataformas (SIN PNG externo) =====
    this._makeFallbackPlatformTexture();
    this.platformTextureKey = "platform_fallback";
    this.platforms = this.physics.add.staticGroup();

    // Layout plataformas
    // Suelo
    this._addPlatform(0, this.levelHeight - 40, this.levelWidth, 30);

    // Plataformas “parkour”
    // (y = top de la plataforma; height = grosor)
    this._addPlatform(120, this.levelHeight - 170, 520, 22);
    this._addPlatform(520, this.levelHeight - 310, 520, 22);
    this._addPlatform(1040, this.levelHeight - 450, 760, 22);
    this._addPlatform(1700, this.levelHeight - 450, 760, 22);

    // ===== Gordoso (imagen física) =====
    this.player = this.physics.add.image(140, this.levelHeight - 120, "gordoso");
    this.player.setDepth(100);
    this.player.setCollideWorldBounds(true);

    // 🔽 TAMAÑO MÁS CHICO (ajusta aquí si lo quieres aún más chico)
    this.player.setScale(0.28);

    // Hitbox: proporcional y estable (evita “fantasmas”)
    this.player.body.setSize(
      this.player.displayWidth * 0.55,
      this.player.displayHeight * 0.78,
      true
    );

    this.player.setDragX(1300);
    this.player.setMaxVelocity(360, 900);
    this.player.setBounce(0);

    this.physics.add.collider(this.player, this.platforms);

    // ===== Hamburguesas (coleccionables) =====
    this.burgers = this.physics.add.group({ allowGravity: false, immovable: true });

    // 🔽 Tamaño de hamburguesa (ajusta aquí)
    const burgerScale = 0.09;

    // Colocadas “encima” de plataformas (y = platformTop - offset)
    this._spawnBurger(620, this._platformTopY(520, 22) - 26, burgerScale);   // sobre plataforma 2
    this._spawnBurger(1340, this._platformTopY(1040, 22) - 26, burgerScale); // sobre plataforma 3
    this._spawnBurger(1650, this._platformTopY(1700, 22) - 26, burgerScale); // sobre plataforma 4

    this.score = 0;
    this.totalBurgers = this.burgers.getLength();
    this.exitOpen = false;

    // Overlap para recoger (robusto)
    this.physics.add.overlap(this.player, this.burgers, (_p, burger) => {
      burger.disableBody(true, true);
      this.score++;
      this.scoreText.setText(`🍔 ${this.score}/${this.totalBurgers}`);
      if (this.score >= this.totalBurgers) this._openExit();
    });

    // ===== Zorrillos (enemigos) =====
    this.skunkGroup = this.physics.add.group({ allowGravity: false, immovable: true });

    // 🔽 Tamaño zorrillo (ajusta aquí)
    this.skunkScale = 0.20;

    // Zorrillos posicionados ENCIMA de plataformas (con patrulla horizontal)
    // (x, platformXStart, platformWidth, platformTopY)
    this._spawnSkunkOnPlatform(360, 120, 520, this._platformTopY(120, 22));   // plataforma 1
    this._spawnSkunkOnPlatform(760, 520, 520, this._platformTopY(520, 22));   // plataforma 2
    this._spawnSkunkOnPlatform(2000, 1700, 760, this._platformTopY(1700, 22)); // plataforma 4

    // Si choca con zorrillo => reinicia
    this.physics.add.overlap(this.player, this.skunkGroup, () => {
      this.scene.restart();
    });

    // ===== Puerta final =====
    this.door = this.physics.add.staticImage(this.levelWidth - 160, this.levelHeight - 110, "door");
    this.door.setDepth(120);
    this.door.setScale(0.42);
    this.door.setVisible(false);
    this.door.body.enable = false;

    this.physics.add.overlap(this.player, this.door, () => {
      if (this.exitOpen) this._win();
    });

    // ===== UI =====
    this.scoreText = this.add
      .text(16, 44, `🍔 0/${this.totalBurgers}`, {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#ffffff",
        backgroundColor: "rgba(0,0,0,0.35)",
        padding: { x: 10, y: 6 }
      })
      .setScrollFactor(0)
      .setDepth(1000);

    // ===== Cámara =====
    this.cameras.main.setBounds(0, 0, this.levelWidth, this.levelHeight);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // ===== Input teclado =====
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    // ===== Touch =====
    this.touch = { left: false, right: false, jump: false };
    this._createTouchControls();

    // ===== Resize + zoom =====
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
    const left = this.cursors.left.isDown || this.keyA.isDown || this.touch.left;
    const right = this.cursors.right.isDown || this.keyD.isDown || this.touch.right;

    const jump =
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.cursors.space) ||
      Phaser.Input.Keyboard.JustDown(this.keyW) ||
      this._consumeTouchJump();

    // Movimiento
    if (left) {
      this.player.setAccelerationX(-1400);
      this.player.setFlipX(true);
    } else if (right) {
      this.player.setAccelerationX(1400);
      this.player.setFlipX(false);
    } else {
      this.player.setAccelerationX(0);
    }

    // Salto
    if (jump && this.player.body.onFloor()) {
      this.player.setVelocityY(-520);
    }

    // Safety fall
    if (this.player.y > this.levelHeight + 250) {
      this.player.setPosition(140, this.levelHeight - 120);
      this.player.setVelocity(0, 0);
    }

    // Patrulla zorrillos
    this._updateSkunks();
  }

  // =========================================================
  // Spawn helpers
  // =========================================================

  _spawnBurger(x, y, scale) {
    const b = this.burgers.create(x, y, "burger");
    b.setDepth(90);
    b.setScale(scale);

    // Hitbox = tamaño visible (clavo para que se puedan comer)
    b.body.setSize(b.displayWidth, b.displayHeight, true);

    return b;
  }

  _spawnSkunkOnPlatform(x, platformXStart, platformWidth, platformTopY) {
    if (!this.textures.exists("skunk")) return null;

    const y = platformTopY - 18; // “encima” de la plataforma (ajusta si lo quieres más arriba)

    const s = this.skunkGroup.create(x, y, "skunk");
    s.setDepth(95);
    s.setScale(this.skunkScale);

    // Hitbox
    s.body.setSize(s.displayWidth * 0.65, s.displayHeight * 0.65, true);

    // Patrulla limitada dentro de la plataforma
    const leftBound = platformXStart + 30;
    const rightBound = platformXStart + platformWidth - 30;

    s.patrol = {
      leftBound,
      rightBound,
      speed: 55 + Math.random() * 20,
      dir: Math.random() > 0.5 ? 1 : -1
    };

    // Start “mirando” a donde va
    s.setFlipX(s.patrol.dir < 0);

    return s;
  }

  _updateSkunks() {
    if (!this.skunkGroup) return;

    const dt = this.game.loop.delta / 1000;

    this.skunkGroup.children.iterate((s) => {
      if (!s || !s.active || !s.patrol) return;

      s.x += s.patrol.dir * s.patrol.speed * dt;

      if (s.x < s.patrol.leftBound) {
        s.x = s.patrol.leftBound;
        s.patrol.dir = 1;
      } else if (s.x > s.patrol.rightBound) {
        s.x = s.patrol.rightBound;
        s.patrol.dir = -1;
      }

      s.setFlipX(s.patrol.dir < 0);
    });
  }

  // =========================================================
  // Door / Win
  // =========================================================

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
        .setDepth(1000);
    }
  }

  _win() {
    this.door.body.enable = false;

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
  }

  // =========================================================
  // Platform helpers
  // =========================================================

  _addPlatform(x, yTop, width, height) {
    // yTop es la coordenada Y del BORDE SUPERIOR de la plataforma
    const p = this.platforms.create(x + width / 2, yTop + height / 2, this.platformTextureKey);
    p.setDisplaySize(width, height);
    p.refreshBody();
    return p;
  }

  _platformTopY(platformXStart, height) {
    // Esta función NO depende de X realmente; la dejo para mantener claridad.
    // En nuestro layout, calculamos yTop directamente cuando agregamos plataformas.
    // Aquí devolvemos valores “manuales” consistentes con create().

    // NOTA: como no guardamos objetos de plataforma por referencia, usamos las mismas fórmulas:
    // Plataforma 2 yTop = levelHeight - 310
    // Plataforma 3 yTop = levelHeight - 450
    // Plataforma 4 yTop = levelHeight - 450

    // Para los calls que hice:
    // _platformTopY(520,22)  -> levelHeight - 310
    // _platformTopY(1040,22) -> levelHeight - 450
    // _platformTopY(1700,22) -> levelHeight - 450
    // _platformTopY(120,22) -> levelHeight - 170

    if (platformXStart === 120) return this.levelHeight - 170;
    if (platformXStart === 520) return this.levelHeight - 310;
    if (platformXStart === 1040) return this.levelHeight - 450;
    if (platformXStart === 1700) return this.levelHeight - 450;

    // fallback razonable
    return this.levelHeight - 310;
  }

  _makeFallbackPlatformTexture() {
    // Barra negra con línea verde (como tus plataformas actuales)
    const g = this.add.graphics();
    g.fillStyle(0x101010, 1);
    g.fillRoundedRect(0, 0, 512, 48, 18);
    g.fillStyle(0x2ee66b, 1);
    g.fillRoundedRect(10, 40, 492, 6, 3);
    g.generateTexture("platform_fallback", 512, 48);
    g.destroy();
  }

  // =========================================================
  // Resize helpers
  // =========================================================

  _fitBackgroundToScreen(screenW, screenH) {
    const tex = this.textures.get("bg");
    if (!tex || !tex.getSourceImage()) return;

    const imgW = tex.getSourceImage().width;
    const imgH = tex.getSourceImage().height;

    // Cover
    const scale = Math.max(screenW / imgW, screenH / imgH);
    this.bg.setScale(scale);
  }

  _applyCameraAndUIScale(w, h) {
    // Base “diseño” para evitar gigantismo en móvil
    const baseW = 960;
    const baseH = 540;

    const zoom = Math.min(w / baseW, h / baseH);
    this.cameras.main.setZoom(zoom);

    if (this.scoreText) this.scoreText.setPosition(16, 44);
    this._layoutTouchControls(w, h);
  }

  // =========================================================
  // Touch controls
  // =========================================================

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

// ===== Config =====
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
