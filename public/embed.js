(function () {
  const script = document.currentScript;
  const chatbotId = script?.getAttribute("data-chatbot-id");

  if (!chatbotId) {
    console.error("Chatbot: missing chatbot-id");
    return;
  }

  const origin = "http://localhost:3000";
  let open = false;

  const iframe = document.createElement("iframe");
  iframe.src = `${origin}/embed/chatbot?chatbot_id=${chatbotId}`;
  iframe.style.position = "fixed";
  iframe.style.bottom = "24px";
  iframe.style.right = "88px";
  iframe.style.width = "380px";
  iframe.style.height = "620px";
  iframe.style.border = "none";
  iframe.style.zIndex = "9999";
  iframe.style.borderRadius = "20px";
  iframe.style.boxShadow = "0 20px 48px rgba(2, 6, 23, 0.24)";
  iframe.style.display = "block";
  iframe.style.opacity = "0";
  iframe.style.transform = "translateY(18px) scale(0.97)";
  iframe.style.pointerEvents = "none";
  iframe.style.transition = "opacity 220ms cubic-bezier(0.23, 1, 0.32, 1), transform 220ms cubic-bezier(0.23, 1, 0.32, 1)";

  const bubble = document.createElement("button");
  bubble.style.position = "fixed";
  bubble.style.bottom = "20px";
  bubble.style.right = "20px";
  bubble.style.width = "58px";
  bubble.style.height = "58px";
  bubble.style.borderRadius = "999px";
  bubble.style.background = "linear-gradient(135deg, #4f46e5, #0284c7)";
  bubble.style.border = "none";
  bubble.style.cursor = "pointer";
  bubble.style.zIndex = "10000";
  bubble.style.boxShadow = "0 14px 30px rgba(79, 70, 229, 0.35)";
  bubble.style.fontSize = "22px";
  bubble.style.color = "white";
  bubble.style.display = "flex";
  bubble.style.alignItems = "center";
  bubble.style.justifyContent = "center";
  bubble.style.transition = "transform 140ms cubic-bezier(0.23, 1, 0.32, 1), filter 160ms cubic-bezier(0.23, 1, 0.32, 1)";
  bubble.innerHTML = "Chat";

  bubble.addEventListener("mouseenter", function () {
    bubble.style.filter = "brightness(1.06)";
  });

  bubble.addEventListener("mouseleave", function () {
    bubble.style.filter = "brightness(1)";
    bubble.style.transform = "scale(1)";
  });

  bubble.addEventListener("mousedown", function () {
    bubble.style.transform = "scale(0.97)";
  });

  bubble.addEventListener("mouseup", function () {
    bubble.style.transform = "scale(1)";
  });

  bubble.addEventListener("click", function () {
    open = !open;
    if (open) {
      iframe.style.opacity = "1";
      iframe.style.transform = "translateY(0) scale(1)";
      iframe.style.pointerEvents = "auto";
    } else {
      iframe.style.opacity = "0";
      iframe.style.transform = "translateY(18px) scale(0.97)";
      iframe.style.pointerEvents = "none";
    }
  });

  document.body.appendChild(iframe);
  document.body.appendChild(bubble);
})();
