declare global {
  interface Window {
    ChatBot: {
      init: (config: { chatbotId: string }) => void
    }
  }
}

(function () {

  window.ChatBot = {
    init: function (config: { chatbotId: string }) {

      const iframe = document.createElement("iframe")

      iframe.src =
        `http://localhost:3000/embed/chatbot?chatbotId=${config.chatbotId}`

      iframe.style.position = "fixed"
      iframe.style.bottom = "20px"
      iframe.style.right = "20px"
      iframe.style.width = "380px"
      iframe.style.height = "600px"
      iframe.style.border = "none"
      iframe.style.zIndex = "9999"

      document.body.appendChild(iframe)
    }
  }

})();