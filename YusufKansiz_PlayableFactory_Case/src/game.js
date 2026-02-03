import { Container, Sprite, Text } from "pixi.js";
import { GAME_HEIGHT, GAME_WIDTH } from "."; 
import Wheel from "./Wheel"; 
import Board from "./Board";
import gsap from "gsap";

export default class Game extends Container {
  constructor() {
    super();
    this.init();
  }

  init() {
    //  Arka Plan
    const bg = Sprite.from("background"); 
    bg.anchor.set(0.5);
    bg.x = GAME_WIDTH * 0.5;
    bg.y = GAME_HEIGHT * 0.5;
    bg.width = GAME_WIDTH;
    bg.height = GAME_HEIGHT; 
    this.addChild(bg);

    const levelLetters = "G,O,D,L";
    this.allWords = ["GOLD", "GOD", "DOG", "LOG"];
    this.solvedWords = []; 

    const levelWordsData = "0,0,GOLD,H|0,0,GOD,V|2,0,DOG,H|0,2,LOG,V";

    //BOARD
    this.board = new Board(levelWordsData);
    this.board.x = GAME_WIDTH * 0.5; 
    this.board.y = GAME_HEIGHT * 0.18; 
    this.addChild(this.board);

    //  WHEEL
    this.wheel = new Wheel(levelLetters);
    this.wheel.x = GAME_WIDTH * 0.5;
    this.wheel.y = GAME_HEIGHT * 0.7; 
    this.addChild(this.wheel);

    // IDLE TIMER
    this.startIdleTimer();

    // --- EVENTLER ---

    this.wheel.on("userInteraction", () => {
        this.resetIdleTimer();
    });
    this.eventMode = 'static';
    this.on('pointerdown', () => this.resetIdleTimer());

    this.wheel.on("wordCreated", (word) => {
        const startPoint = this.wheel.toGlobal(this.wheel.previewContainer.position);
        const isCorrect = this.board.checkAndReveal(word, startPoint);
        
        if (isCorrect) {
            // ---  Zaten bulunduysa TİTRET ---
            if (this.solvedWords.includes(word)) {
                console.log("Zaten bulundu, titre!");
                this.wheel.handleWrong(); // Yanlışmış gibi salla
            } 
            else {
                // Yeni bulunduysa
                console.log("Doğru ve Yeni!");
                this.wheel.handleCorrect();
                this.solvedWords.push(word);

                if (this.solvedWords.length === this.allWords.length) {
                    console.log("OYUN BİTTİ!");
                    this.stopIdleTimer(); 
                }
            }
        } else {
            console.log("Yanlış!");
            this.wheel.handleWrong();
        }

        this.resetIdleTimer();
    });

    // PLAY NOW BUTONU
    this.createPlayButton();
  }

  // --- ZAMANLAYICI MANTIĞI ---

  startIdleTimer() {
      if (this.timer) clearTimeout(this.timer);
      this.timer = setTimeout(() => {
          this.triggerAutoPlay();
      }, 4000); 
  }

  resetIdleTimer() {
      if (this.timer) clearTimeout(this.timer);
      if (this.solvedWords.length < this.allWords.length) {
          this.timer = setTimeout(() => {
              this.triggerAutoPlay();
          }, 4000); 
      }
  }

  stopIdleTimer() {
      if (this.timer) clearTimeout(this.timer);
  }

  triggerAutoPlay() {
      const remaining = this.allWords.filter(w => !this.solvedWords.includes(w));
      if (remaining.length > 0) {
          const randomWord = remaining[Math.floor(Math.random() * remaining.length)];
          this.wheel.playTutorialWord(randomWord);
      }
  }

  createPlayButton() {
    const btnContainer = new Container();
    btnContainer.x = GAME_WIDTH * 0.5;
    btnContainer.y = GAME_HEIGHT - 60;
    this.addChild(btnContainer);

    const bg = Sprite.from("button_bg");
    bg.anchor.set(0.5); bg.tint = 0x333333; 
    bg.width = 250; bg.height = 70;
    btnContainer.addChild(bg);

    const text = new Text("PLAY NOW!", {
        fontFamily: "Sniglet-Regular", fontSize: 36, fill: "#ffffff", fontWeight: "bold"
    });
    text.anchor.set(0.5);
    btnContainer.addChild(text);

    btnContainer.eventMode = 'static';
    btnContainer.cursor = 'pointer';
    btnContainer.on('pointerdown', () => {
        console.log("Play Store...");
    });

    gsap.to(btnContainer.scale, { x: 1.1, y: 1.1, duration: 0.8, repeat: -1, yoyo: true, ease: "sine.inOut" });
  }
}