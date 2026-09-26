// Dictate into one scene at a time using the browser's speech recognition service.
// Audio is not recorded or uploaded by this application.
window.SceneSpeech = (function () {
  let active = null;
  const recognitionClass = () => window.SpeechRecognition || window.webkitSpeechRecognition;

  function status(idx, message) {
    const el = document.getElementById("speechStatus" + idx);
    if (el) el.textContent = message;
  }

  function buttonState(idx, recording) {
    const button = document.getElementById("speechButton" + idx);
    if (!button) return;
    button.classList.toggle("is-recording", recording);
    button.setAttribute("aria-pressed", String(recording));
    const label = recording ? "Stop voice input" : "Speak to enter a scene description";
    button.setAttribute("aria-label", label);
    button.title = label;
    const icon = button.querySelector("i");
    if (icon) icon.className = recording ? "fa fa-stop" : "fa fa-microphone";
  }

  function initScene(idx) {
    const button = document.getElementById("speechButton" + idx);
    if (!button) return;
    let unavailable = "";
    if (window.isSecureContext === false) {
      unavailable = "Voice input needs HTTPS or localhost.";
    } else if (!recognitionClass()) {
      unavailable = "Voice input is unavailable in this browser. Try a browser with speech recognition, such as Chrome.";
    }
    button.disabled = Boolean(unavailable);
    if (unavailable) {
      button.title = unavailable;
      status(idx, unavailable);
    }
  }

  function cancel(idx) {
    if (!active || (idx !== undefined && active.idx !== idx)) return;
    const session = active;
    active = null; // Ignore delayed results, including those for a removed/recreated scene.
    clearTimeout(session.stopTimer);
    buttonState(session.idx, false);
    status(session.idx, "");
    try { session.recognition.abort(); } catch (_) {}
  }

  function toggle(idx) {
    if (active && active.idx === idx) {
      if (active.stopping) return;
      const session = active;
      session.stopping = true;
      status(idx, "Finishing voice input…");
      session.stopTimer = setTimeout(function () { cancel(idx); }, 5000);
      try { session.recognition.stop(); } catch (_) { cancel(idx); }
      return;
    }
    cancel();
    initScene(idx);
    const button = document.getElementById("speechButton" + idx);
    const textarea = document.getElementById("textual" + idx);
    if (!button || button.disabled || !textarea) return;
    const language = document.getElementById("textualLanguage" + idx)?.value === "en" ? "en-US" : "vi-VN";
    let recognition;
    try {
      recognition = new (recognitionClass())();
    } catch (_) {
      status(idx, "Could not start voice input in this browser.");
      return;
    }
    const session = { idx, textarea, recognition, committed: new Set(), writing: false, stopping: false };
    active = session;
    const current = () => active === session && document.getElementById("textual" + idx) === textarea;
    recognition.lang = language;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    buttonState(idx, true);
    status(idx, "Allow microphone access to start voice input…");

    recognition.onstart = function () {
      if (current() && !session.stopping) {
        status(idx, "Listening (" + (language === "vi-VN" ? "Vietnamese" : "English") + ")… Click the microphone to stop.");
      }
    };
    recognition.onresult = function (event) {
      if (!current()) return;
      const final = [];
      const interim = [];
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript.trim();
        if (result.isFinal) {
          if (!session.committed.has(i)) {
            session.committed.add(i);
            if (text) final.push(text);
          }
        } else if (text) interim.push(text);
      }
      if (final.length) {
        const separator = textarea.value && !/\s$/.test(textarea.value) ? " " : "";
        textarea.value += separator + final.join(" ");
        const clear = document.getElementById("cancelText" + idx);
        if (clear) clear.style.display = "block";
        session.writing = true;
        try { textarea.dispatchEvent(new Event("input", { bubbles: true })); }
        finally { session.writing = false; }
      }
      status(idx, interim.length ? "Hearing: " + interim.join(" ") :
        (session.stopping ? "Finishing voice input…" : "Listening… Click the microphone to stop."));
    };
    recognition.onerror = function (event) {
      if (!current()) return;
      const messages = {
        "not-allowed": "Microphone access was denied. Allow it in your browser's site settings, then try again.",
        "service-not-allowed": "Speech recognition is blocked by this browser or its settings.",
        "audio-capture": "No microphone is available. Check your microphone connection and settings.",
        "no-speech": "No speech was detected. Click the microphone and try again.",
        "network": "Could not reach the browser's speech service. Check your connection and try again.",
        "language-not-supported": "The selected speech language is not supported by this browser.",
        "aborted": "Voice input stopped.",
      };
      const message = messages[event.error] || "Voice input failed. Please try again.";
      cancel(idx);
      status(idx, message);
    };
    recognition.onend = function () {
      if (!current()) return;
      clearTimeout(session.stopTimer);
      active = null;
      buttonState(idx, false);
      status(idx, session.committed.size ? "Voice input complete. Edit the text or press Search." : "No speech captured. Click the microphone to try again.");
    };
    try { recognition.start(); }
    catch (_) {
      cancel(idx);
      status(idx, "Could not start voice input. Check microphone access and try again.");
    }
  }

  // Typing or changing language takes control away from an in-flight dictation.
  document.addEventListener("input", function (event) {
    if (active && event.target === active.textarea && !active.writing) cancel();
  });
  document.addEventListener("change", function (event) {
    if (active && event.target.id === "textualLanguage" + active.idx) cancel();
  });
  window.addEventListener("pagehide", function () { cancel(); });

  return { initScene, toggle, cancel };
})();
