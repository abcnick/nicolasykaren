/**
 * Wedding Invitation Site - Configuration Module
 * Single source of truth for all event data.
 * 
 * To customize: Update the values below with your actual event details.
 * The wedding date MUST be in ISO 8601 format for the countdown timer to work.
 */
const CONFIG = {
  wedding: {
    date: "2028-06-14T16:00:00-05:00", // ISO 8601 — update with actual wedding date
    couple: { name1: "Karen", name2: "Nicolas" }
  },

  ceremony: {
    venue: "Venue Name", // TODO: Replace with actual venue
    address: "Full Address, City, Country", // TODO: Replace with actual address
    mapsUrl: "https://maps.google.com/?q=Venue+Name+City+Country", // TODO: Replace with actual Maps URL
    time: "4:00 PM"
  },

  reception: {
    venue: "Reception Venue", // TODO: Replace with actual venue
    address: "Full Address", // TODO: Replace with actual address
    startTime: "7:00 PM"
  },

  itinerary: [
    { time: "4:00 PM", description: "Ceremonia" },
    { time: "5:00 PM", description: "Cóctel" },
    { time: "7:00 PM", description: "Recepción y Cena" }
  ],

  dressCode: {
    text: "Formal / Black Tie Optional",
    colors: [
      { hex: "#1B2838", name: "Midnight Blue" },
      { hex: "#2C3E50", name: "Navy" },
      { hex: "#C9A96E", name: "Bronze" },
      { hex: "#D4AF37", name: "Gold" }
    ]
  },

  gift: {
    heading: "Lluvia de Sobres Digital",
    message: "Tu presencia es nuestro mejor regalo. Si deseas tener un detalle adicional, puedes hacerlo a través de los siguientes medios:",
    bankDetails: {
      bankName: "Bank Name", // TODO: Replace with actual bank
      accountHolder: "Karen & Nicolas",
      accountNumber: "XXXX-XXXX-XXXX" // TODO: Replace with actual account number
    },
    paymentLink: "" // Empty = won't show
  },

  messages: [
    { heading: "Nuestra Historia", body: "Nos conocimos y supimos que era para siempre..." },
    { heading: "Información Importante", body: "Los esperamos con mucha ilusión para celebrar juntos este día tan especial." }
  ],

  photos: [
    { src: "img/photos/pareja.jpg", alt: "Karen y Nicolas" },
    { src: "img/photos/parejacorazon.jpg", alt: "Karen y Nicolas - corazón" },
    { src: "img/photos/parejaatardecer.jpg", alt: "Karen y Nicolas al atardecer" }
  ],

  logo: {
    src: "img/logo.png",
    alt: "Karen & Nicolas Wedding"
  },

  api: {
    baseUrl: "https://script.google.com/macros/s/AKfycbyIntdkwOwugY9PvfSyVR7_WWh40TPdn_hRcDroDM4TKyCRlZhzF8uobkO92WA8IqDe/exec" // TODO: Replace with actual Apps Script deployment URL
  },

  admin: {
    passwordHash: "40dd46400b93ee50bc1e23c7f4cfb858a68741054cb2460756bb9e07bd20ba5f" // TODO: Replace with SHA-256 hash of your admin password
  }
};
 