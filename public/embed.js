(function () {

  const script = document.currentScript;
  const chatbotId = script?.getAttribute('data-chatbot-id');

  if (!chatbotId) {
    console.error('Chatbot: missing chatbot-id');
    return;
  }

  const origin = 'http://localhost:3000';
  let open = false;


  const iframe = document.createElement("iframe")

  iframe.src = `${origin}/embed/chatbot?chatbot_id=${chatbotId}`;

  iframe.style.position = "fixed"
  iframe.style.bottom = "20px"
  iframe.style.right = "90px"
  iframe.style.width = "380px"
  iframe.style.height = "600px"
  iframe.style.border = "none"
  iframe.style.zIndex = "9999"
  iframe.style.borderRadius = "16px"
  iframe.style.boxShadow = "0 8px 32px rgba(0,0,0,0.15)"
  iframe.style.display = "block"
  iframe.style.opacity = '0'
  iframe.style.transform = 'translateY(20px) scale(0.95)'
  iframe.style.pointerEvents = 'none'
  iframe.style.transition = 'opacity 0.3s ease, transform 0.3s ease'


  const bubble = document.createElement('button');
  bubble.style.position = 'fixed';
  bubble.style.bottom = '20px';
  bubble.style.right = '20px';
  bubble.style.width = '56px';
  bubble.style.height = '56px';
  bubble.style.borderRadius = '50%';
  bubble.style.background = 'linear-gradient(135deg, #6366f1, #3b82f6)';
  bubble.style.border = 'none';
  bubble.style.cursor = 'pointer';
  bubble.style.zIndex = '10000';
  bubble.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)';
  bubble.style.fontSize = '24px';
  bubble.style.display = 'flex';
  bubble.style.alignItems = 'center';
  bubble.style.justifyContent = 'center';
  bubble.innerHTML = '💬';


  bubble.addEventListener('click', function () {
    open = !open;
    if (open) {
      iframe.style.opacity = '1'
      iframe.style.transform = 'translateY(0) scale(1)'
      iframe.style.pointerEvents = 'auto'
    } else {
      iframe.style.opacity = '0'
      iframe.style.transform = 'translateY(20px) scale(0.95)'
      iframe.style.pointerEvents = 'none' 
    }
  });

  document.body.appendChild(iframe)
  document.body.appendChild(bubble)
})();