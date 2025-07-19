import React from "react";
import whatsappIcon from "../assets/whatsapp_icon.png";

const WHATSAPP_LINK = "https://wa.me/2348166948210";

const WhatsappFAB = () => {
  return (
    <a
      href={WHATSAPP_LINK}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 animate-bounce hover:scale-110 transition-transform duration-200"
      aria-label="Chat with us on WhatsApp"
    >
      <span className="w-14 h-14 flex items-center justify-center rounded-full border-2 border-green-500 bg-white p-2 shadow-lg hover:shadow-2xl">
        <img
          src={whatsappIcon}
          alt="WhatsApp"
          className="w-10 h-10 object-cover rounded-full"
        />
      </span>
    </a>
  );
};

export default WhatsappFAB; 