(function () {
  const script = document.currentScript;
  const chatbotId = script?.getAttribute("data-chatbot-id");

  if (!chatbotId) {
    console.error("Chatbot: missing chatbot-id");
    return;
  }

  // Resolve the chatbot host: prefer an explicit data-origin, otherwise derive
  // it from this script's own src (where embed.js was served from). Never fall
  // back to window.location.origin — that's the embedding page, not our app.
  let origin = script?.getAttribute("data-origin");
  if (!origin && script?.src) {
    try {
      origin = new URL(script.src).origin;
    } catch (e) {
      origin = null;
    }
  }
  if (!origin) {
    console.error("Chatbot: could not resolve embed origin");
    return;
  }

  const DEFAULT_COLOR = "#4f46e5";
  let open = false;

  const chatIcon =
    '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>' +
    "</svg>";

  const closeIcon =
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">' +
    '<path d="M18 6L6 18M6 6l12 12"/>' +
    "</svg>";

  const iframe = document.createElement("iframe");
  iframe.src = origin + "/embed/chatbot?chatbot_id=" + encodeURIComponent(chatbotId);
  iframe.title = "Chat with us";
  iframe.style.position = "fixed";
  iframe.style.border = "none";
  iframe.style.zIndex = "2147483646";
  iframe.style.boxShadow = "0 20px 48px rgba(2, 6, 23, 0.24)";
  iframe.style.display = "block";
  iframe.style.opacity = "0";
  iframe.style.transform = "translateY(18px) scale(0.97)";
  iframe.style.pointerEvents = "none";
  iframe.style.background = "#fff";
  iframe.style.transition =
    "opacity 220ms cubic-bezier(0.23, 1, 0.32, 1), transform 220ms cubic-bezier(0.23, 1, 0.32, 1)";

  const bubble = document.createElement("button");
  bubble.type = "button";
  bubble.setAttribute("aria-label", "Open chat");
  bubble.setAttribute("aria-expanded", "false");
  bubble.style.position = "fixed";
  bubble.style.bottom = "20px";
  bubble.style.right = "20px";
  bubble.style.width = "58px";
  bubble.style.height = "58px";
  bubble.style.borderRadius = "999px";
  bubble.style.background = DEFAULT_COLOR;
  bubble.style.border = "none";
  bubble.style.cursor = "pointer";
  bubble.style.zIndex = "2147483647";
  bubble.style.boxShadow = "0 14px 30px rgba(15, 23, 42, 0.3)";
  bubble.style.color = "white";
  bubble.style.display = "flex";
  bubble.style.alignItems = "center";
  bubble.style.justifyContent = "center";
  bubble.style.padding = "0";
  bubble.style.transition =
    "transform 140ms cubic-bezier(0.23, 1, 0.32, 1), filter 160ms cubic-bezier(0.23, 1, 0.32, 1)";
  bubble.innerHTML = chatIcon;

  // Match the bubble to the chatbot's accent color (endpoint is public + CORS-enabled)
  fetch(origin + "/api/chatbot/" + encodeURIComponent(chatbotId))
    .then(function (res) { return res.ok ? res.json() : null; })
    .then(function (data) {
      if (data && data.color) bubble.style.background = data.color;
    })
    .catch(function () { /* keep default color */ });

  // Size the panel for the viewport: full-screen sheet on phones, floating card on desktop
  function layout() {
    var mobile = window.innerWidth < 480;

    // On a full-screen mobile sheet the bubble would cover the message input,
    // so dock it to the top-right as a close button while the chat is open.
    if (mobile && open) {
      bubble.style.top = "14px";
      bubble.style.bottom = "auto";
      bubble.style.right = "14px";
      bubble.style.width = "44px";
      bubble.style.height = "44px";
    } else {
      bubble.style.top = "auto";
      bubble.style.bottom = "20px";
      bubble.style.right = "20px";
      bubble.style.width = "58px";
      bubble.style.height = "58px";
    }

    if (mobile) {
      iframe.style.top = "0";
      iframe.style.left = "0";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "100%";
      iframe.style.height = "100%";
      iframe.style.borderRadius = "0";
    } else {
      iframe.style.top = "auto";
      iframe.style.left = "auto";
      iframe.style.bottom = "90px";
      iframe.style.right = "20px";
      iframe.style.width = "380px";
      iframe.style.height = Math.min(620, window.innerHeight - 110) + "px";
      iframe.style.borderRadius = "20px";
    }
  }
  layout();
  window.addEventListener("resize", layout);

  function setOpen(next) {
    open = next;
    bubble.setAttribute("aria-expanded", String(open));
    bubble.setAttribute("aria-label", open ? "Close chat" : "Open chat");
    bubble.innerHTML = open ? closeIcon : chatIcon;
    layout();
    if (open) {
      iframe.style.opacity = "1";
      iframe.style.transform = "translateY(0) scale(1)";
      iframe.style.pointerEvents = "auto";
    } else {
      iframe.style.opacity = "0";
      iframe.style.transform = "translateY(18px) scale(0.97)";
      iframe.style.pointerEvents = "none";
    }
  }

  bubble.addEventListener("mouseenter", function () {
    bubble.style.filter = "brightness(1.08)";
    bubble.style.transform = "scale(1.05)";
  });

  bubble.addEventListener("mouseleave", function () {
    bubble.style.filter = "brightness(1)";
    bubble.style.transform = "scale(1)";
  });

  bubble.addEventListener("mousedown", function () {
    bubble.style.transform = "scale(0.95)";
  });

  bubble.addEventListener("mouseup", function () {
    bubble.style.transform = "scale(1.05)";
  });

  bubble.addEventListener("click", function () {
    setOpen(!open);
  });

  document.body.appendChild(iframe);
  document.body.appendChild(bubble);
})();
