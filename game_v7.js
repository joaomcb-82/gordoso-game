// game_v7.js  (Nivel 1 + Subfinal 1 + Nivel 2 + Subfinal 2 con cortina animada)
// Assets esperados en /assets:
// bangkok_bg.jpg, gordoso.png, skunk.png, burger.png, girl.png, door.png, thai_flag.png

(() => {
  // ---------------------------
  // CONFIG BASE (responsive)
  // ---------------------------
  const BASE_W = 1280;
  const BASE_H = 720;

  const config = {
    type: Phaser.AUTO,
    parent: "game",
    width: BASE_W,
    height: BASE_H,
    backgroundColor: "#000000",
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 900 },
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: BASE_W,
      height: BASE_H,
    },
    scene: [],
  };

  // ---------------------------
  // HELPERS
  // ---------------------------
  function makeControls(scene) {
    const cursors = scene.input.keyboard.createCursorKeys();
    const keys = scene.input.keyboard.addKeys({
      A: Phaser.Input.Keyboard.KeyCodes.A,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      W: Phaser.Input.Keyboard.KeyCodes.W,
      R: Phaser.Input.Keyboard.KeyCodes.R,
    });
    return { cursors, keys };
  }

  function isLeftDown(ctrl) {
    return ctrl.keys.A.isDown || ctrl.cursors.left.isDown;
  }
  function isRightDown(ctrl) {
    return ctrl.keys.D.isDown || ctrl.cursors.right.isDown;
  }
  function isJumpDown(ctrl) {
    return ctrl.keys.W.isDown || ctrl.cursors.up.isDown || ctrl.cursors.space.isDown;
  }

  function addHint(scene, txt) {
    // Hint HTML ya lo tienes, pero por si acaso agregamos uno in-game (sutil)
    const t = scene.add
      .text(18, 54, txt, {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#eaeaea",
        backgroundColor: "rgba(0,0,0,0.35)",
        padding: { left: 10, right: 10, top: 6, bottom: 6 },
      })
      .setScrollFactor(0)
      .setDepth(9999);

    return t;
  }

  // ---------------------------
  // BOOT / PRELOAD
  // ---------------------------
  class Boot extends Phaser.Scene {
    constructor() {
      super("Boot");
    }
    preload() {
      this.load.image("bg", "assets/bangkok_bg.jpg");
      this.load.image("gordoso", "assets/gordoso.png");
      this.load.image("skunk", "assets/skunk.png");
      this.load.image("burger", "assets/burger.png");
      this.load.image("girl", "assets/girl.png");
      this.load.image("door", "assets/door.png");
      this.load.image("thai", "assets/thai_flag.png");
    }
    create() {
      this.scene.start("Level1");
      console.log("GAME_V7 FINAL CARGADO (L1+L2+SUBFINALES)");
    }
  }

  // ---------------------------
  // LEVEL 1
  // ---------------------------
  class Level1 extends Phaser.Scene {
    constructor() {
      super("Level1");
      this.score = 0;
    }

    create() {
      this.score = 0;

      // Fondo
      this.add.image(BASE_W / 2, BASE_H / 2, "bg").setDisplaySize(BASE_W, BASE_H);

      // Plataformas (estáticas)
      this.platforms = this.physics.add.staticGroup();

      // Piso
      this.platforms
        .create(BASE_W / 2, BASE_H - 40, null)
        .setDisplaySize(BASE_W - 120, 30)
        .refreshBody();

      // Plataformas principales (como las negras que ya usas)
      const p1 = this.platforms.create(360, 520, null).setDisplaySize(520, 30).refreshBody();
      const p2 = this.platforms.create(680, 380, null).setDisplaySize(520, 30).refreshBody();
      const p3 = this.platforms.create(980, 250, null).setDisplaySize(520, 30).refreshBody();

      // Dibujo visual para plataformas (rectángulos negros)
      const platGfx = this.add.graphics().setDepth(5);
      platGfx.fillStyle(0x111111, 0.85);
      [p1, p2, p3].forEach((p) => {
        platGfx.fillRoundedRect(p.x - p.displayWidth / 2, p.y - p.displayHeight / 2, p.displayWidth, p.displayHeight, 14);
      });
      // piso
      platGfx.fillRoundedRect(
        (BASE_W / 2) - ((BASE_W - 120) / 2),
        (BASE_H - 40) - (30 / 2),
        (BASE_W - 120),
        30,
        14
      );

      // Gordoso (AJUSTE tamaño: antes gigante -> ahora proporcional)
      this.player = this.physics.add.sprite(120, BASE_H - 120, "gordoso");
      this.player.setScale(0.35); // <-- AJUSTA AQUÍ si lo quieres un pelo más chico/grande
      this.player.setCollideWorldBounds(true);
      this.player.body.setSize(this.player.width * 0.55, this.player.height * 0.75, true);

      this.physics.add.collider(this.player, this.platforms);

      // Controles
      this.ctrl = makeControls(this);
      addHint(this, "A/D o ←/→ mover · W/↑/Espacio saltar · R reinicia");

      // Hamburguesas
      this.burgers = this.physics.add.group({ allowGravity: false, immovable: true });
      const burgerPositions = [
        [240, 470],
        [380, 470],
        [520, 470],
        [600, 330],
        [760, 330],
        [860, 200],
        [1040, 200],
      ];
      burgerPositions.forEach(([x, y]) => {
        const b = this.burgers.create(x, y, "burger");
        b.setScale(0.20);
      });

      this.physics.add.overlap(this.player, this.burgers, (player, burger) => {
        burger.destroy();
        this.score += 1;
      });

      // Zorrillos (AJUSTE tamaño: ahora más pequeño)
      this.skunk = this.physics.add.sprite(620, 340, "skunk");
      this.skunk.setScale(0.22); // <-- ZORRILLO más pequeño (punto 1)
      this.skunk.body.setSize(this.skunk.width * 0.55, this.skunk.height * 0.65, true);
      this.skunk.setCollideWorldBounds(true);
      this.skunk.setBounce(1, 0);
      this.skunk.setVelocityX(140);

      this.physics.add.collider(this.skunk, this.platforms);

      // Si toca a Gordoso -> game over
      this.physics.add.overlap(this.player, this.skunk, () => {
        this.scene.start("GameOver", { level: 1 });
      });

      // Puerta final (meta)
      this.door = this.physics.add.sprite(BASE_W - 90, 200, "door").setImmovable(true);
      this.door.body.allowGravity = false;
      this.door.setScale(0.35);

      this.physics.add.overlap(this.player, this.door, () => {
        // subfinal del nivel 1 (igual que lo querías)
        this.scene.start("SubFinal1", { burgers: this.score });
      });
    }

    update() {
      // Reiniciar
      if (Phaser.Input.Keyboard.JustDown(this.ctrl.keys.R)) {
        this.scene.restart();
      }

      const speed = 260;
      const body = this.player.body;

      if (isLeftDown(this.ctrl)) {
        body.setVelocityX(-speed);
      } else if (isRightDown(this.ctrl)) {
        body.setVelocityX(speed);
      } else {
        body.setVelocityX(0);
      }

      if (isJumpDown(this.ctrl) && body.blocked.down) {
        body.setVelocityY(-520);
      }
    }
  }

  // ---------------------------
  // SUBFINAL NIVEL 1 (como “sub final”)
  // ---------------------------
  class SubFinal1 extends Phaser.Scene {
    constructor() {
      super("SubFinal1");
    }
    create(data) {
      // Fondo oscuro sobre Bangkok
      this.add.image(BASE_W / 2, BASE_H / 2, "bg").setDisplaySize(BASE_W, BASE_H);
      this.add.rectangle(BASE_W / 2, BASE_H / 2, BASE_W, BASE_H, 0x000000, 0.55);

      this.add
        .text(BASE_W / 2, 120, "¡RESCATE LOGRADO!", {
          fontFamily: "monospace",
          fontSize: "64px",
          color: "#ffffff",
        })
        .setOrigin(0.5);

      this.add
        .text(BASE_W / 2, 210, `Hamburguesas: ${data?.burgers ?? 0}`, {
          fontFamily: "monospace",
          fontSize: "28px",
          color: "#ffffff",
        })
        .setOrigin(0.5);

      this.add
        .text(BASE_W / 2, 270, "Presiona ENTER para ir al Nivel 2", {
          fontFamily: "monospace",
          fontSize: "24px",
          color: "#ffffff",
        })
        .setOrigin(0.5);

      // Props (gordoso, chica, bandera)
      const gord = this.add.image(980, 270, "gordoso").setScale(0.38);
      const girl = this.add.image(320, 430, "girl").setScale(0.45);
      const thai = this.add.image(720, 480, "thai").setScale(0.35).setAngle(-12);

      // ENTER pasa a nivel 2
      this.input.keyboard.once("keydown-ENTER", () => {
        this.scene.start("Level2");
      });

      // R reinicia todo
      this.input.keyboard.once("keydown-R", () => {
        this.scene.start("Level1");
      });
    }
  }

  // ---------------------------
  // LEVEL 2 (Bangkok After Dark)  <-- PUNTO 2
  // ---------------------------
  class Level2 extends Phaser.Scene {
    constructor() {
      super("Level2");
      this.score2 = 0;
    }

    create() {
      this.score2 = 0;

      // Fondo Bangkok + tinte nocturno
      this.add.image(BASE_W / 2, BASE_H / 2, "bg").setDisplaySize(BASE_W, BASE_H);
      this.add.rectangle(BASE_W / 2, BASE_H / 2, BASE_W, BASE_H, 0x050824, 0.75);

      this.add
        .text(22, 14, "Nivel 2 - Bangkok After Dark", {
          fontFamily: "monospace",
          fontSize: "28px",
          color: "#ffffff",
        })
        .setScrollFactor(0)
        .setDepth(9999);

      addHint(this, "A/D o ←/→ mover · W/↑/Espacio saltar · R reinicia");

      // Plataformas
      this.platforms = this.physics.add.staticGroup();

      // Piso
      const floor = this.platforms
        .create(BASE_W / 2, BASE_H - 40, null)
        .setDisplaySize(BASE_W - 120, 30)
        .refreshBody();

      const plats = [
        this.platforms.create(280, 540, null).setDisplaySize(430, 28).refreshBody(),
        this.platforms.create(580, 420, null).setDisplaySize(460, 28).refreshBody(),
        this.platforms.create(900, 320, null).setDisplaySize(420, 28).refreshBody(),
        this.platforms.create(1080, 520, null).setDisplaySize(320, 28).refreshBody(),
      ];

      // Visual plataformas
      const g = this.add.graphics().setDepth(5);
      g.fillStyle(0x0f0f16, 0.9);
      // piso
      g.fillRoundedRect(
        (BASE_W / 2) - ((BASE_W - 120) / 2),
        (BASE_H - 40) - (30 / 2),
        (BASE_W - 120),
        30,
        14
      );
      plats.forEach((p) => {
        g.fillRoundedRect(p.x - p.displayWidth / 2, p.y - p.displayHeight / 2, p.displayWidth, p.displayHeight, 14);
      });

      // Gordoso
      this.player = this.physics.add.sprite(120, BASE_H - 120, "gordoso");
      this.player.setScale(0.35);
      this.player.setCollideWorldBounds(true);
      this.player.body.setSize(this.player.width * 0.55, this.player.height * 0.75, true);

      this.physics.add.collider(this.player, this.platforms);

      // Controles
      this.ctrl = makeControls(this);

      // Hamburguesas nivel 2 (más separadas)
      this.burgers = this.physics.add.group({ allowGravity: false, immovable: true });
      const burger2 = [
        [200, 490],
        [340, 490],
        [520, 370],
        [640, 370],
        [820, 270],
        [920, 270],
        [1080, 470],
      ];
      burger2.forEach(([x, y]) => {
        const b = this.burgers.create(x, y, "burger");
        b.setScale(0.20);
      });

      this.physics.add.overlap(this.player, this.burgers, (p, b) => {
        b.destroy();
        this.score2 += 1;
      });

      // Zorrillos patrullando (más de uno)
      this.skunkGroup = this.physics.add.group();
      const s1 = this.skunkGroup.create(520, 390, "skunk");
      const s2 = this.skunkGroup.create(900, 290, "skunk");
      const s3 = this.skunkGroup.create(1080, 490, "skunk");

      // Ajuste tamaño zorrillos nivel 2 (proporción)
      [s1, s2, s3].forEach((s) => {
        s.setScale(0.22);
        s.body.setSize(s.width * 0.55, s.height * 0.65, true);
        s.setCollideWorldBounds(true);
        s.setBounce(1, 0);
      });

      s1.setVelocityX(160);
      s2.setVelocityX(-180);
      s3.setVelocityX(140);

      this.physics.add.collider(this.skunkGroup, this.platforms);

      this.physics.add.overlap(this.player, this.skunkGroup, () => {
        this.scene.start("GameOver", { level: 2 });
      });

      // “Meta” de nivel 2: chica al final (derecha abajo) + zona de trigger
      this.girl = this.physics.add.sprite(BASE_W - 120, BASE_H - 110, "girl");
      this.girl.body.allowGravity = false;
      this.girl.setImmovable(true);
      this.girl.setScale(0.45);

      // Bandera
      this.thai = this.add.image(BASE_W - 260, BASE_H - 160, "thai").setScale(0.35).setAngle(-12);

      // Para que realmente haya “objetivo”: exige mínimo de hamburguesas para rescate
      this.needBurgers = 5;

      const info = this.add
        .text(22, 54, `Objetivo: ${this.needBurgers} hamburguesas para el rescate`, {
          fontFamily: "monospace",
          fontSize: "20px",
          color: "#ffffff",
          backgroundColor: "rgba(0,0,0,0.25)",
          padding: { left: 10, right: 10, top: 6, bottom: 6 },
        })
        .setDepth(9999);

      this.physics.add.overlap(this.player, this.girl, () => {
        if (this.score2 >= this.needBurgers) {
          this.scene.start("SubFinal2", { burgers2: this.score2 });
        } else {
          // mensaje rápido: faltan burgers
          info.setText(`Te faltan hamburguesas: ${this.needBurgers - this.score2}`);
          this.time.delayedCall(900, () => info.setText(`Objetivo: ${this.needBurgers} hamburguesas para el rescate`));
        }
      });
    }

    update() {
      if (Phaser.Input.Keyboard.JustDown(this.ctrl.keys.R)) {
        this.scene.restart();
      }

      const speed = 270;
      const body = this.player.body;

      if (isLeftDown(this.ctrl)) {
        body.setVelocityX(-speed);
      } else if (isRightDown(this.ctrl)) {
        body.setVelocityX(speed);
      } else {
        body.setVelocityX(0);
      }

      if (isJumpDown(this.ctrl) && body.blocked.down) {
        body.setVelocityY(-540);
      }
    }
  }

  // ---------------------------
  // SUBFINAL NIVEL 2: CORTINA ANIMADA (PUNTO 3)
  // ---------------------------
  class SubFinal2 extends Phaser.Scene {
    constructor() {
      super("SubFinal2");
    }

    create(data) {
      // Fondo oscuro “after dark”
      this.add.rectangle(BASE_W / 2, BASE_H / 2, BASE_W, BASE_H, 0x050824, 0.95);

      this.add
        .text(BASE_W / 2, 90, "SUBFINAL NIVEL 2", {
          fontFamily: "monospace",
          fontSize: "60px",
          color: "#ffffff",
        })
        .setOrigin(0.5);

      this.add
        .text(BASE_W / 2, 160, `Hamburguesas nivel 2: ${data?.burgers2 ?? 0}`, {
          fontFamily: "monospace",
          fontSize: "26px",
          color: "#ffffff",
        })
        .setOrigin(0.5);

      // Marco tipo escenario
      const frame = this.add.rectangle(BASE_W / 2, BASE_H / 2 + 80, 1040, 460, 0x0b0b18, 0.8);
      this.add.rectangle(BASE_W / 2, BASE_H / 2 + 80, 1040, 460).setStrokeStyle(4, 0x2e2e45, 1);

      // Props dentro del escenario
      const sceneX = BASE_W / 2;
      const sceneY = BASE_H / 2 + 80;

      this.add.image(sceneX - 300, sceneY + 110, "gordoso").setScale(0.40);
      this.add.image(sceneX + 300, sceneY + 110, "girl").setScale(0.50);
      this.add.image(sceneX + 430, sceneY + 40, "thai").setScale(0.35).setAngle(-10);

      // --- Cortina animada (2 paneles) ---
      // Creamos una textura simple de “cortina” con líneas (sin assets extra)
      const curtainW = 520;
      const curtainH = 320;

      const curtainTexKey = "curtainTex";
      if (!this.textures.exists(curtainTexKey)) {
        const gg = this.add.graphics();
        gg.fillStyle(0x7a0d1a, 1);
        gg.fillRect(0, 0, curtainW, curtainH);

        // pliegues
        for (let i = 0; i < 14; i++) {
          const x = i * (curtainW / 14);
          gg.fillStyle(i % 2 === 0 ? 0x5f0a14 : 0x8b1221, 0.65);
          gg.fillRect(x, 0, curtainW / 28, curtainH);
        }

        // borde superior
        gg.fillStyle(0x3a050c, 0.9);
        gg.fillRect(0, 0, curtainW, 18);

        gg.generateTexture(curtainTexKey, curtainW, curtainH);
        gg.destroy();
      }

      const censorContainer = this.add.container(sceneX, sceneY - 10).setDepth(50);

      const leftCurtain = this.add.image(-220, 0, curtainTexKey);
      const rightCurtain = this.add.image(220, 0, curtainTexKey);

      // Invertimos la derecha para que parezca simétrica
      rightCurtain.setFlipX(true);

      // Sombra sutil detrás
      const shadow = this.add.rectangle(0, 0, 760, 320, 0x000000, 0.35);

      censorContainer.add([shadow, leftCurtain, rightCurtain]);

      // Texto encima
      const censText = this.add
        .text(sceneX, sceneY - 10, "CENSURADO", {
          fontFamily: "monospace",
          fontSize: "64px",
          color: "#ffffff",
          stroke: "#000000",
          strokeThickness: 8,
        })
        .setOrigin(0.5)
        .setDepth(60);

      // Animación: cortina “respira” (abre/cierra leve) + pequeño temblor
      this.tweens.add({
        targets: leftCurtain,
        x: { from: -260, to: -190 },
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
      this.tweens.add({
        targets: rightCurtain,
        x: { from: 260, to: 190 },
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
      this.tweens.add({
        targets: censorContainer,
        y: { from: -6, to: 6 },
        duration: 420,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
      this.tweens.add({
        targets: censText,
        alpha: { from: 1, to: 0.85 },
        duration: 520,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });

      // UI final
      this.add
        .text(BASE_W / 2, BASE_H - 70, "ENTER: volver al Nivel 1 | R: reiniciar Nivel 2", {
          fontFamily: "monospace",
          fontSize: "22px",
          color: "#ffffff",
        })
        .setOrigin(0.5);

      this.input.keyboard.once("keydown-ENTER", () => {
        this.scene.start("Level1");
      });

      this.input.keyboard.once("keydown-R", () => {
        this.scene.start("Level2");
      });
    }
  }

  // ---------------------------
  // GAME OVER (L1 o L2)
  // ---------------------------
  class GameOver extends Phaser.Scene {
    constructor() {
      super("GameOver");
    }
    create(data) {
      this.add.image(BASE_W / 2, BASE_H / 2, "bg").setDisplaySize(BASE_W, BASE_H);
      this.add.rectangle(BASE_W / 2, BASE_H / 2, BASE_W, BASE_H, 0x000000, 0.55);

      this.add
        .text(BASE_W / 2, 170, "GAME OVER", {
          fontFamily: "monospace",
          fontSize: "80px",
          color: "#ffffff",
        })
        .setOrigin(0.5);

      const lvl = data?.level ?? "?";
      this.add
        .text(BASE_W / 2, 270, `Te atrapó el zorrillo 😵 (Nivel ${lvl})`, {
          fontFamily: "monospace",
          fontSize: "28px",
          color: "#ffffff",
        })
        .setOrigin(0.5);

      this.add
        .text(BASE_W / 2, 340, "Presiona R para reiniciar", {
          fontFamily: "monospace",
          fontSize: "26px",
          color: "#ffffff",
        })
        .setOrigin(0.5);

      this.input.keyboard.once("keydown-R", () => {
        if (lvl === 2) this.scene.start("Level2");
        else this.scene.start("Level1");
      });
    }
  }

  // Registrar escenas
  config.scene = [Boot, Level1, SubFinal1, Level2, SubFinal2, GameOver];

  // Lanzar juego
  new Phaser.Game(config);
})();
