"use strict";

(() => {
  const errorBox = document.getElementById("app-error");
  function reportError(message, error) {
    console.error(message, error);
    errorBox.textContent = message;
    errorBox.hidden = false;
  }

  const config = window.SURPRISE;
  const requiredText = ["name", "nickname", "birthDate", "sender", "secretCode", "occasion", "heroIntro", "heroMessage", "signoff", "closingMessage"];
  function isPhotoCollection(collection) {
    return Array.isArray(collection) && collection.length > 0 &&
      collection.every(memory => memory && ["src", "caption", "detail", "alt"].every(key => typeof memory[key] === "string"));
  }
  if (!config || requiredText.some(key => typeof config[key] !== "string" || !config[key].trim()) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(config.birthDate) ||
      !Number.isFinite(Date.parse(`${config.birthDate}T00:00:00Z`)) ||
      new Date(`${config.birthDate}T00:00:00Z`).toISOString().slice(0, 10) !== config.birthDate ||
      !/^[0-9]{4}$/.test(config.secretCode) || !Array.isArray(config.letter) || !config.letter.length ||
      config.letter.some(text => typeof text !== "string") ||
      !isPhotoCollection(config.memories) || !isPhotoCollection(config.gallery) ||
      !Array.isArray(config.wishes) || !config.wishes.length ||
      config.wishes.some(wish => !wish || ["symbol", "title", "text"].some(key => typeof wish[key] !== "string")) ||
      ["audioFile", "songUrl", "songTitle", "songDescription"].some(key => typeof config[key] !== "string")) {
    reportError("Please check the birthday, four-digit code, text and photo lists in config.js.", new Error("Invalid surprise configuration"));
    document.querySelectorAll("#gate button, #gate input").forEach(control => { control.disabled = true; });
    return;
  }

  const gate = document.getElementById("gate");
  const experience = document.getElementById("experience");
  const codeInput = document.getElementById("secret-code");
  const codeError = document.getElementById("code-error");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const effectsControls = document.querySelectorAll("[data-effects-toggle]");
  let effectsPaused = false;
  let effectsEnabled = !reducedMotion.matches;
  function syncEffects() {
    effectsEnabled = !effectsPaused && !reducedMotion.matches;
    document.body.classList.toggle("effects-paused", !effectsEnabled);
    for (const control of effectsControls) {
      control.disabled = reducedMotion.matches;
      control.setAttribute("aria-pressed", String(effectsEnabled));
      control.querySelector(".effects-label").textContent = reducedMotion.matches ? "Reduced motion" : effectsEnabled ? "Pause effects" : "Resume effects";
    }
    if (!effectsEnabled) document.querySelectorAll(".confetti").forEach(container => container.replaceChildren());
  }
  effectsControls.forEach(control => control.addEventListener("click", () => {
    effectsPaused = !effectsPaused;
    syncEffects();
  }));
  reducedMotion.addEventListener("change", syncEffects);
  syncEffects();
  const soundToggle = document.getElementById("sound-toggle");
  const songButton = document.getElementById("song-button");
  const spotifyPlayer = document.getElementById("spotify-player");
  let spotifyEmbedUrl = "";
  document.querySelectorAll("[data-name]").forEach(element => { element.textContent = config.name; });
  document.querySelectorAll("[data-nickname]").forEach(element => { element.textContent = config.nickname; });
  document.title = `Happy birthday, ${config.nickname}`;
  document.querySelector('meta[name="description"]').content = `For my RJ. Happy birthday, ${config.nickname}.`;
  const birthday = document.getElementById("birthday-date");
  birthday.dateTime = config.birthDate;
  birthday.textContent = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(`${config.birthDate}T00:00:00Z`)).toUpperCase();
  const textFields = {
    occasion: config.occasion, "hero-intro": config.heroIntro,
    "hero-message": config.heroMessage, signoff: config.signoff, sender: config.sender,
    "closing-message": config.closingMessage
  };
  for (const [id, text] of Object.entries(textFields)) document.getElementById(id).textContent = text;
  for (const paragraph of config.letter) {
    const element = document.createElement("p");
    element.textContent = paragraph;
    document.getElementById("letter-body").append(element);
  }
  if (config.songDescription) document.getElementById("song-description").textContent = config.songDescription;
  if (config.songUrl) {
    try {
      const url = new URL(config.songUrl);
      if (!["https:", "http:"].includes(url.protocol)) throw new Error("Song URL must use HTTP or HTTPS");
      const link = document.getElementById("song-link");
      link.href = url.href;
      link.textContent = `Listen to ${config.songTitle || "our song"} on Spotify \u2197`;
      link.hidden = false;
      const spotifyPath = url.pathname.match(/^\/(track|album)\/([a-zA-Z0-9]{22})\/?$/);
      if (url.hostname === "open.spotify.com" && spotifyPath && !config.audioFile) {
        spotifyEmbedUrl = `https://open.spotify.com/embed/${spotifyPath[1]}/${spotifyPath[2]}`;
        document.getElementById("sound-label").textContent = "our song";
        soundToggle.setAttribute("aria-label", `Jump to ${config.songTitle || "our song"} player`);
        soundToggle.removeAttribute("aria-pressed");
        soundToggle.setAttribute("aria-controls", "spotify-player");
        songButton.hidden = true;
        document.getElementById("music-notice").hidden = false;
      }
    } catch (error) {
      reportError("The song link is invalid. Please use a complete https:// link in config.js.", error);
    }
  }

  let celebrationIndex = 0;
  function celebrate(count = 88, origin) {
    if (!effectsEnabled) return;
    const container = document.getElementById(photoDialog.open ? "dialog-confetti" : "confetti");
    const x = Math.max(16, Math.min(window.innerWidth - 16, origin?.x ?? window.innerWidth / 2));
    const y = Math.max(24, Math.min(window.innerHeight - 24, origin?.y ?? window.innerHeight * 0.4));
    const colours = ["#9b37d1", "#ee4b99", "#ffbf2f", "#7d4be6", "#40b8a4", "#ff7b5c"];
    celebrationIndex++;
    while (container.childElementCount + count > 160 && container.firstElementChild) container.firstElementChild.remove();
    for (let index = 0; index < count; index++) {
      const shape = (index + celebrationIndex) % 7;
      let piece;
      if (shape === 0) {
        piece = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        piece.setAttribute("viewBox", "0 0 100 80");
        piece.setAttribute("class", "particle particle-butterfly");
        const art = document.createElementNS("http://www.w3.org/2000/svg", "use");
        art.setAttribute("href", "#butterfly-art");
        piece.append(art);
      } else {
        piece = document.createElement("span");
        piece.className = shape > 3 ? "particle particle-ribbon" : "particle";
        piece.textContent = shape > 3 ? "" : shape === 3 ? "\u2665" : "\u2726";
      }
      const angle = Math.PI + Math.random() * Math.PI;
      const distance = 55 + Math.random() * (count > 50 ? 240 : 130);
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;
      piece.style.setProperty("--x", `${x}px`);
      piece.style.setProperty("--y", `${y}px`);
      piece.style.setProperty("--mid-x", `${dx * 0.7}px`);
      piece.style.setProperty("--mid-y", `${dy}px`);
      piece.style.setProperty("--end-x", `${dx * 1.3}px`);
      piece.style.setProperty("--end-y", `${dy + 150 + Math.random() * 100}px`);
      piece.style.setProperty("--duration", `${1.3 + Math.random()}s`);
      piece.style.setProperty("--size", `${shape === 0 ? 20 + Math.random() * 12 : 9 + Math.random() * 12}px`);
      piece.style.setProperty("--spin", `${Math.random() * 180 - 90}deg`);
      piece.style.setProperty("--end-spin", `${Math.random() * 400 - 200}deg`);
      piece.style.setProperty("--color", colours[(index + celebrationIndex) % colours.length]);
      piece.style.animationDelay = `${index % 5 * 20}ms`;
      piece.addEventListener("animationend", () => piece.remove(), { once: true });
      piece.addEventListener("animationcancel", () => piece.remove(), { once: true });
      container.append(piece);
    }
  }

  function clearCodeError() {
    codeError.textContent = "";
    codeInput.removeAttribute("aria-invalid");
  }
  codeInput.addEventListener("input", () => {
    codeInput.value = codeInput.value.replace(/[^0-9]/g, "").slice(0, 4);
    clearCodeError();
  });
  document.querySelectorAll("[data-digit]").forEach(button => {
    button.addEventListener("click", () => {
      if (codeInput.value.length < 4) codeInput.value += button.dataset.digit;
      clearCodeError();
    });
  });
  document.getElementById("delete-digit").addEventListener("click", () => {
    codeInput.value = codeInput.value.slice(0, -1);
    clearCodeError();
  });
  document.getElementById("unlock-form").addEventListener("submit", event => {
    event.preventDefault();
    if (codeInput.value !== config.secretCode) {
      codeError.textContent = "Not that one. Try again.";
      codeInput.setAttribute("aria-invalid", "true");
      codeInput.value = "";
      const card = document.querySelector(".gate-card");
      card.classList.remove("shake");
      void card.offsetWidth;
      card.classList.add("shake");
      codeInput.focus();
      return;
    }
    gate.hidden = true;
    experience.hidden = false;
    if (spotifyEmbedUrl) showSpotifyPlayer();
    window.scrollTo({ top: 0, behavior: "instant" });
    const heading = document.getElementById("hero-title");
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
    celebrate();
  });

  let memoryIndex = 0;
  const photo = document.getElementById("memory-photo");
  const art = document.getElementById("memory-art");
  const caption = document.getElementById("memory-caption");
  const detail = document.getElementById("memory-detail");
  const memoryCount = document.getElementById("memory-count");
  const palettes = [["#d6b9f1", "#f7d8ec"], ["#e6c6fb", "#f4dbbb"], ["#c9b8ec", "#f1c0de"], ["#d6c1f3", "#f8dbbd"]];
  memoryCount.textContent = `${config.memories.length} photos. All favourites.`;
  photo.addEventListener("error", () => {
    photo.hidden = true;
    art.hidden = false;
    reportError("This photo couldn't load. Check its filename in config.js and include the photos folder when sharing.", new Error(`Missing memory image: ${photo.getAttribute("src")}`));
  });
  document.getElementById("camera").addEventListener("click", () => {
    const index = memoryIndex % config.memories.length;
    const memory = config.memories[index];
    caption.textContent = memory.caption;
    detail.textContent = memory.detail;
    photo.hidden = !memory.src;
    art.hidden = Boolean(memory.src);
    if (memory.src) {
      photo.alt = memory.alt;
      photo.src = memory.src;
    } else {
      photo.removeAttribute("src");
      const palette = palettes[index % palettes.length];
      art.style.background = `linear-gradient(${palette[0]}, ${palette[1]})`;
    }
    const display = document.getElementById("memory-display");
    display.classList.remove("developing");
    void display.offsetWidth;
    display.classList.add("developing");
    memoryIndex++;
    memoryCount.textContent = `${index + 1} / ${config.memories.length}`;
  });

  function createMemoryArt(index) {
    const artwork = art.cloneNode(true);
    artwork.removeAttribute("id");
    artwork.hidden = false;
    const palette = palettes[index % palettes.length];
    artwork.style.background = `linear-gradient(${palette[0]}, ${palette[1]})`;
    return artwork;
  }
  function createMemoryVisual(memory, index) {
    if (!memory.src) return createMemoryArt(index);
    const image = document.createElement("img");
    image.alt = memory.alt;
    image.addEventListener("error", () => {
      image.replaceWith(createMemoryArt(index));
      reportError("This gallery photo couldn't load. Check its filename in config.js and include the photos folder when sharing.", new Error(`Missing gallery image: ${memory.src}`));
    }, { once: true });
    image.src = memory.src;
    return image;
  }
  const photoDialog = document.getElementById("photo-dialog");
  let galleryIndex = 0;
  function showGalleryMemory(index) {
    galleryIndex = (index + config.gallery.length) % config.gallery.length;
    const memory = config.gallery[galleryIndex];
    document.getElementById("dialog-visual").replaceChildren(createMemoryVisual(memory, galleryIndex));
    document.getElementById("dialog-caption").textContent = memory.caption;
    document.getElementById("dialog-detail").textContent = memory.detail;
    document.getElementById("dialog-count").textContent = `${galleryIndex + 1} / ${config.gallery.length}`;
  }
  config.gallery.forEach((memory, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "gallery-photo";
    button.setAttribute("aria-label", `Open photo ${index + 1}: ${memory.caption}`);
    const label = document.createElement("span");
    label.className = "gallery-caption";
    label.textContent = memory.caption;
    button.append(createMemoryVisual(memory, index), label);
    button.addEventListener("click", () => {
      showGalleryMemory(index);
      photoDialog.showModal();
    });
    document.getElementById("photo-gallery").append(button);
  });
  document.getElementById("close-photo").addEventListener("click", () => photoDialog.close());
  document.getElementById("previous-photo").addEventListener("click", () => showGalleryMemory(galleryIndex - 1));
  document.getElementById("next-photo").addEventListener("click", () => showGalleryMemory(galleryIndex + 1));
  photoDialog.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.preventDefault();
      photoDialog.close();
    } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      showGalleryMemory(galleryIndex + (event.key === "ArrowRight" ? 1 : -1));
      celebrate(24);
    }
  });
  photoDialog.addEventListener("click", event => {
    const bounds = photoDialog.getBoundingClientRect();
    if (event.target === photoDialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) photoDialog.close();
  });

  const wishButton = document.getElementById("wish-button");
  const sliceButton = document.getElementById("slice-button");
  const cakeScene = document.getElementById("cake-scene");
  const cakeMessage = document.getElementById("cake-message");
  const cakeInstructions = document.getElementById("cake-instructions");
  const wishRitual = document.getElementById("wish-ritual");
  let cakeDrag = null;
  function pointAt(element) {
    const rect = element.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }
  function cutCake(origin) {
    if (cakeScene.classList.contains("sliced")) return;
    cakeScene.classList.add("sliced", "wished");
    cakeScene.setAttribute("aria-disabled", "true");
    cakeMessage.textContent = "The bigger slice is yours. Birthday rules.";
    cakeInstructions.textContent = "Another slice? Reset the cake below.";
    sliceButton.textContent = "Reset the cake \u21ba";
    celebrate(110, origin ?? pointAt(cakeScene));
  }
  function endCakeDrag(event, cancelled = false) {
    if (!cakeDrag || cakeDrag.id !== event.pointerId) return;
    const drag = cakeDrag;
    cakeDrag = null;
    cakeScene.classList.remove("dragging");
    cakeScene.style.removeProperty("--knife-x");
    cakeScene.style.removeProperty("--knife-y");
    if (cakeScene.hasPointerCapture(event.pointerId)) cakeScene.releasePointerCapture(event.pointerId);
    if (cancelled) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    const endY = (event.clientY - drag.box.top) / drag.box.height;
    const crossesMiddle = (drag.x - (drag.box.left + drag.box.width / 2)) * (event.clientX - (drag.box.left + drag.box.width / 2)) <= 0;
    if (Math.abs(dx) >= drag.box.width * 0.42 && Math.abs(dx) > Math.abs(dy) * 1.3 && crossesMiddle && endY >= 0.28 && endY <= 0.88) {
      cutCake({ x: event.clientX, y: event.clientY });
    } else if (drag.horizontal) {
      cakeMessage.textContent = "A little further across the cake.";
    }
  }
  cakeScene.addEventListener("pointerdown", event => {
    if (!event.isPrimary || event.button !== 0 || cakeScene.classList.contains("sliced")) return;
    const box = cakeScene.getBoundingClientRect();
    const startY = (event.clientY - box.top) / box.height;
    const startX = (event.clientX - box.left) / box.width;
    if (startY < 0.28 || startY > 0.88 || startX < 0.08 || startX > 0.92) return;
    cakeDrag = { id: event.pointerId, x: event.clientX, y: event.clientY, box, horizontal: false };
    cakeScene.setPointerCapture(event.pointerId);
    cakeScene.focus({ preventScroll: true });
  });
  cakeScene.addEventListener("pointermove", event => {
    if (!cakeDrag || cakeDrag.id !== event.pointerId) return;
    const dx = event.clientX - cakeDrag.x;
    const dy = event.clientY - cakeDrag.y;
    if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.3) cakeDrag.horizontal = true;
    if (!cakeDrag.horizontal) return;
    event.preventDefault();
    cakeScene.classList.add("dragging");
    cakeScene.style.setProperty("--knife-x", `${Math.max(8, Math.min(92, (event.clientX - cakeDrag.box.left) / cakeDrag.box.width * 100))}%`);
    cakeScene.style.setProperty("--knife-y", `${Math.max(18, Math.min(88, (event.clientY - cakeDrag.box.top) / cakeDrag.box.height * 100))}%`);
  });
  cakeScene.addEventListener("pointerup", event => endCakeDrag(event));
  cakeScene.addEventListener("pointercancel", event => endCakeDrag(event, true));
  cakeScene.addEventListener("lostpointercapture", event => endCakeDrag(event, true));
  cakeScene.addEventListener("keydown", event => {
    if ((event.key === "Enter" || event.key === " ") && !event.repeat) {
      event.preventDefault();
      cutCake(pointAt(cakeScene));
    }
  });
  wishButton.addEventListener("click", () => {
    const blown = !wishRitual.classList.contains("blown");
    wishRitual.classList.toggle("blown", blown);
    wishButton.setAttribute("aria-pressed", String(blown));
    wishButton.setAttribute("aria-label", blown ? "Relight the candle" : "Blow out the candle");
    document.getElementById("candle-hint").textContent = blown ? "Tap to relight." : "Tap the candle when you're ready.";
    document.getElementById("wish-message").textContent = blown ? "Wish made. Your secret's safe." : "Ready for another wish.";
    celebrate(blown ? 110 : 28, pointAt(wishButton));
  });
  sliceButton.addEventListener("click", () => {
    if (!cakeScene.classList.contains("sliced")) {
      cutCake(pointAt(cakeScene));
    } else {
      cakeScene.classList.remove("wished", "sliced");
      cakeScene.setAttribute("aria-disabled", "false");
      cakeMessage.textContent = "The first slice is yours.";
      cakeInstructions.textContent = "Drag across the cake to slice it. Or press Enter.";
      sliceButton.textContent = "Cut the cake \u2661";
      cakeScene.focus({ preventScroll: true });
      celebrate(24, pointAt(cakeScene));
    }
  });

  config.wishes.forEach((wish, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "wish-card";
    button.setAttribute("aria-expanded", "false");
    const number = document.createElement("span");
    number.className = "wish-number";
    number.textContent = String(index + 1).padStart(2, "0");
    const symbol = document.createElement("span");
    symbol.className = "wish-symbol";
    symbol.textContent = wish.symbol;
    symbol.setAttribute("aria-hidden", "true");
    const title = document.createElement("span");
    title.className = "wish-title";
    title.textContent = wish.title;
    const hint = document.createElement("span");
    hint.className = "wish-hint";
    hint.textContent = "TAP TO OPEN";
    const reveal = document.createElement("span");
    reveal.className = "wish-reveal";
    reveal.id = `wish-text-${index}`;
    reveal.textContent = wish.text;
    reveal.hidden = true;
    button.setAttribute("aria-controls", reveal.id);
    button.append(number, symbol, title, hint, reveal);
    button.addEventListener("click", () => {
      const expanded = button.getAttribute("aria-expanded") !== "true";
      button.setAttribute("aria-expanded", String(expanded));
      reveal.hidden = !expanded;
      hint.hidden = expanded;
    });
    document.getElementById("wish-cards").append(button);
  });

  let audioContext;
  let audio;
  let melodyTimer;
  let playing = false;
  let audioPending = false;
  const voices = new Set();
  function updateMusicState(isPlaying) {
    playing = isPlaying;
    document.body.classList.toggle("playing", playing);
    soundToggle.setAttribute("aria-pressed", String(playing));
    soundToggle.setAttribute("aria-label", playing ? "Pause music" : "Play music");
    songButton.setAttribute("aria-pressed", String(playing));
    document.getElementById("sound-label").textContent = playing ? "sound on" : "sound off";
    songButton.textContent = playing ? "Pause music \u2161" : "Play music \u266b";
  }
  function scheduleMelody() {
    // An original, looping pentatonic phrase; no recording or external request.
    const notes = [523.25, 659.25, 783.99, 659.25, 587.33, 523.25, 440, 523.25, 659.25, 880, 783.99, 659.25, 587.33, 440, 523.25, 0];
    const start = audioContext.currentTime + 0.06;
    notes.forEach((frequency, index) => {
      if (!frequency) return;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const time = start + index * 0.48;
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.055, time + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.3);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      voices.add(oscillator);
      oscillator.addEventListener("ended", () => {
        voices.delete(oscillator);
        oscillator.disconnect();
        gain.disconnect();
      }, { once: true });
      oscillator.start(time);
      oscillator.stop(time + 1.4);
    });
  }
  function stopMusic() {
    clearInterval(melodyTimer);
    if (audio) audio.pause();
    for (const voice of voices) voice.stop();
    voices.clear();
    if (spotifyEmbedUrl) {
      spotifyPlayer.replaceChildren();
      spotifyPlayer.hidden = true;
      return;
    }
    updateMusicState(false);
  }
  function showSpotifyPlayer() {
    if (!spotifyPlayer.firstElementChild) {
      const frame = document.createElement("iframe");
      frame.title = `${config.songTitle || "Our song"} on Spotify`;
      frame.src = spotifyEmbedUrl;
      frame.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
      frame.referrerPolicy = "no-referrer";
      frame.addEventListener("error", () => {
        reportError("Spotify couldn't load. Check your connection or use the direct song link below.", new Error("Spotify iframe failed"));
      });
      spotifyPlayer.append(frame);
    }
    spotifyPlayer.hidden = false;
  }
  async function toggleMusic() {
    if (spotifyEmbedUrl) {
      showSpotifyPlayer();
      spotifyPlayer.scrollIntoView({ behavior: reducedMotion.matches ? "instant" : "smooth", block: "center" });
      return;
    }
    if (audioPending) return;
    if (playing) {
      stopMusic();
      return;
    }
    audioPending = true;
    try {
      if (config.audioFile) {
        if (!audio) {
          audio = new Audio(config.audioFile);
          audio.loop = true;
          audio.volume = 0.4;
          audio.addEventListener("error", () => {
            stopMusic();
            reportError("The music couldn't load. Check audioFile in config.js and include the audio file when sharing.", audio.error);
          });
        }
        await audio.play();
      } else {
        if (!window.AudioContext) throw new Error("Web Audio is not available in this browser");
        audioContext ??= new AudioContext();
        await audioContext.resume();
        scheduleMelody();
        melodyTimer = setInterval(scheduleMelody, 7680);
      }
      updateMusicState(true);
      if (document.hidden || experience.hidden) stopMusic();
    } catch (error) {
      stopMusic();
      reportError("The music couldn't start. Try again, and check your browser's audio permission and the audio file.", error);
    } finally {
      audioPending = false;
    }
  }
  soundToggle.addEventListener("click", toggleMusic);
  songButton.addEventListener("click", toggleMusic);
  document.addEventListener("visibilitychange", () => { if (document.hidden && !spotifyEmbedUrl) stopMusic(); });
  window.addEventListener("pagehide", stopMusic);
  window.addEventListener("pageshow", () => {
    if (spotifyEmbedUrl && !experience.hidden) showSpotifyPlayer();
  });

  document.getElementById("hug-button").addEventListener("click", () => {
    document.getElementById("hug-message").textContent = `A proper one when I see you, ${config.nickname}. \u2661`;
    celebrate(110, pointAt(document.getElementById("hug-button")));
  });
  document.getElementById("lock-button").addEventListener("click", () => {
    stopMusic();
    experience.hidden = true;
    gate.hidden = false;
    codeInput.value = "";
    clearCodeError();
    document.querySelectorAll(".confetti").forEach(container => container.replaceChildren());
    window.scrollTo({ top: 0, behavior: "instant" });
    codeInput.focus({ preventScroll: true });
  });
  document.addEventListener("click", event => {
    if (!(event.target instanceof Element) || event.target.closest("[data-effects-toggle], #wish-button, #slice-button, #hug-button")) return;
    if (window.getSelection()?.isCollapsed === false) return;
    const target = event.target.closest("button, a, .letter, .polaroid");
    if (target?.disabled) return;
    const origin = event.detail > 0 ? { x: event.clientX, y: event.clientY } : target ? pointAt(target) : undefined;
    const count = event.target.closest("[data-digit], #delete-digit, #secret-code") ? 10 : event.target.closest("#camera, .gallery-photo, .wish-card") ? 34 : 18;
    celebrate(count, origin);
    if (target && effectsEnabled) {
      target.classList.remove("click-glow");
      void target.offsetWidth;
      target.classList.add("click-glow");
      target.addEventListener("animationend", () => target.classList.remove("click-glow"), { once: true });
    }
  });
})();
