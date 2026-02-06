/* game.js — ROBUSTO (RESIZE + ZOOM + gordoso como IMAGEN + burgers coleccionables OK)
   - Evita el “cuadro blanco” cuando gordoso.png NO es spritesheet
   - Burgers se comen (hitbox = display size)
   - Cámara sigue a Gordoso
   - Touch controls + teclado
*/

class MainScene extends Phaser.Scene {
  constructor() {
    super("MainScene");
  }

  preload() {
    // Ajusta rutas si tus archivos se llaman distinto
    this.load.image("bg", "assets/bangkok_bg.jpg");

    // IMPORTANTE: gordoso como IMAGEN (NO spritesheet)
    this.load.image("gordoso", "assets/gordoso.png");

    this.load.image("burger", "assets/burger.png");
    this.load.image("door", "assets/door.png");

    // Si no tienes skunk.png, déjalo igual y simplemente no spawnea
    this.load.image("skunk", "assets/skunk.png");
  }

  create() {
    // Nivel
    this.levelWidth = 2600;
    this.levelHeight = 720;

    // Fondo
    this.bg = this.add.image(0, 0, "bg").setOrigin(0.5);
    this.bg.setScrollFactor(0);
    this.bg.setDepth(0);

    // Mundo bounds
    this.physics.world.setBounds(0, 0, this.levelWidth, this.levelHeight);

    // Plataformas
    this.platforms = this.physics.add.staticGroup();

    this._makeFallbackPlatformTexture();
this.platformTextureKey = "platform_fallback";
    }

    // Suelo + plataformas
    this._addPlatform(0, this.levelHeight - 40, this.levelWidth, 30);
    this._addPlatform(120, this.levelHeight - 170, 520, 22);
    this._addPlatform(520, this.levelHeight - 310, 520, 22);
    this._addPlatform(1040, this.levelHeight - 450, 760, 22);
    this._addPlatform(1700, this.levelHeight - 450, 760, 22);

    // Gordoso (como imagen física)
    this.player = this.physics.add.image(140, this.levelHeight - 120, "gordoso");
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(80);

    // Escala y hitbox (ajusta si lo quieres más chico: 0.6, 0.5, etc.)
    this.player.setScale(0.45);

    // Hitbox consistente con lo que se ve
    this.player.body.setSize(this.player.displayWidth * 0.55, this.player.displayHeight * 0.75, true);

    this.player.setBounce(0);
    this.player.setDragX(1200);
    this.player.setMaxVelocity(340, 900);

    this.physics.add.collider(this.player, this.platforms);

    // Burgers (coleccionables) — hitbox = display size (NO círculo)
    this.burgers = this.physics.add.group({ allowGravity: false, immovable: true });

    const burgerScale = 0.10; // pequeño
    this._spawnBurger(620, this.levelHeight - 360, burgerScale);
    this._spawnBurger(1340, this.levelHeight - 500, burgerScale);
    this._spawnBurger(1650, this.levelHeight - 500, burgerScale);

    this.score = 0;
    this.totalBurgers = this.burgers.getLength();
    this.exitOpen = false;

    // Overlap para recoger
    this.physics.add.overlap(this.player, this.burgers, (_p, burger) => {
  burger.disableBody(true, true);
  this.score++;
  this.scoreText.setText(`🍔 ${this.score}/${this.totalBurgers}`);
  if (this.score >= this.totalBurgers) this._openExit();
});

    // Zorrillos (opcionales)
    this.skunkGroup = this.physics.add.group({ allowGravity: false, immovable: true });
    this._spawnSkunk(380, this.levelHeight - 195);
    this._spawnSkunk(820, this.levelHeight - 335);
    this._spawnSkunk(1880, this.levelHeight - 475);

    this.physics.add.overlap(this.player, this.skunkGroup, () => {
      this.scene.restart();
    });

    // Puerta
    this.door = this.physics.add.staticImage(this.levelWidth - 160, this.levelHeight - 110, "door");
    this.door.setVisible(false);
    this.door.body.enable = false;
    this.door.setDepth(90);
    this.door.setScale(0.45);

    this.physics.add.overlap(this.player, this.door, () => {
      if (this.exitOpen) this._win();
    });

    // UI
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

    // Cámara
    this.cameras.main.setBounds(0, 0, this.levelWidth, this.levelHeight);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    this.touch = { left: false, right: false, jump: false };
    this._createTouchControls();

    // RESIZE + ZOOM
    this.scale.on("resize", (gameSize) => {
      const { width, height } = gameSize;

      this.bg.setPosition(width / 2, height / 2);
      this._fitBackgroundToScreen(width, height);
      this._applyCameraAndUIScale(width, height);
    });

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

    const left = this.cursors.left.isDown || this.keyA.isDown || this.touch.left === true;
    const right = this.cursors.right.isDown || this.keyD.isDown || this.touch.right === true;

    const jump =
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.cursors.space) ||
      Phaser.Input.Keyboard.JustDown(this.keyW) ||
      this._consumeTouchJump();

    // Movimiento
    if (left) {
      this.player.setAccelerationX(-1200);
      this.player.setFlipX(true);
    } else if (right) {
      this.player.setAccelerationX(1200);
      this.player.setFlipX(false);
    } else {
      this.player.setAccelerationX(0);
    }

    // Salto
    if (jump && this.player.body.onFloor()) {
      this.player.setVelocityY(-520);
    }

    // Safety fall
    if (this.player.y > this.levelHeight + 200) {
      this.player.setPosition(140, this.levelHeight - 120);
      this.player.setVelocity(0, 0);
    }

    this._updateSkunks();
  }

  // ===== Helpers =====

  _spawnBurger(x, y, scale) {
    const b = this.burgers.create(x, y, "burger");
    b.setScale(scale);
    b.setDepth(70);

    // Hitbox = lo que se ve (display size)
    b.body.setSize(b.displayWidth, b.displayHeight, true);

    return b;
  }

  _spawnSkunk(x, y) {
    if (!this.textures.exists("skunk")) return null;

    const s = this.skunkGroup.create(x, y, "skunk");
    s.setDepth(75);
    s.setScale(0.25);

    s.body.setSize(s.displayWidth * 0.7, s.displayHeight * 0.7, true);

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

    const scale = Math.max(screenW / imgW, screenH / imgH);
    this.bg.setScale(scale);
  }

  _applyCameraAndUIScale(w, h) {
    const baseW = 960;
    const baseH = 540;

    const zoom = Math.min(w / baseW, h / baseH);
    this.cameras.main.setZoom(zoom);

    if (this.scoreText) this.scoreText.setPosition(16, 44);
    this._layoutTouchControls(w, h);
  }

  // Touch controls
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

// CONFIG
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
