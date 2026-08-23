/**
 * Wedding Invitation Site - Configuration Module
 * Single source of truth for all event data.
 * 
 * To customize: Update the values below with your actual event details.
 * The wedding date MUST be in ISO 8601 format for the countdown timer to work.
 */
const CONFIG = {
  wedding: {
    date: "2027-08-23T16:00:00-05:00", // ISO 8601 — update with actual wedding date
    couple: { name1: "Nicolas Gutierrez", name2: "Karen Cabrera" }
  },

  ceremony: {
    venue: "la mejora hacienda del mundo", // TODO: Replace with actual venue
    address: "Casa de fang", // TODO: Replace with actual address
    mapsUrl: "https://maps.google.com/?q=Venue+Name+City+Country", // TODO: Replace with actual Maps URL
    time: "4:00 PM"
  },

  reception: {
    venue: "inicia cuando inicia", // TODO: Replace with actual venue
    address: "se acaba cuando acaba", // TODO: Replace with actual address
    startTime: "7:00 PM"
  },

  itinerary: [
    { time: "4:00 PM", description: "Ceremonia", icon: "church" },
    { time: "5:00 PM", description: "Cóctel", icon: "cocktail" },
    { time: "7:00 PM", description: "Recepción y Cena", icon: "dinner" }
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
    { heading: "Nuestra Historia ❤️", body: "Todo comenzó cuando teníamos 13 y 14 años. Éramos dos adolescentes que estudiaban juntos y que, sin saberlo, estaban empezando una historia que iba a durar muchísimo más de lo que cualquiera imaginaba.\n\nNos volvimos mejores amigos. Hacíamos todo juntos, íbamos para todos lados y, básicamente, donde estaba uno, estaba el otro. Ella era mi famosa \"llaverito\": siempre pegada a mí. 😂\n\nPasaron los años y, mientras nuestra amistad crecía, yo cometí el pequeño error de enamorarme de mi mejor amiga.\n\nPero claro… ¿qué podía salir mal?\n\nPues nada… excepto que tardé 8 años en hacer algo al respecto. 😅\n\nDespués de tantos años de amistad, finalmente decidí que ya era hora de intentar llevar nuestra historia a otro nivel. La invité a salir, pero esta vez no como amigos… sino con otras intenciones.\n\nY llegó el momento del primer beso.\n\nMe lo negó. 🫠\n\nDespués de 8 años de amistad, todo ese valor, toda esa preparación mental… y un rotundo \"no\".\n\nPero aparentemente el universo tenía otros planes, porque en nuestra siguiente cita fue ella quien me pidió el beso.\n\nY yo, obviamente, no me pude negar. 😂❤️\n\nY así empezó oficialmente todo.\n\nDesde ese momento llegaron los viajes, las aventuras, los planes improvisados, las historias que solo nosotros entendemos, los momentos buenos y no tan buenos, y eventualmente… decidimos dar otro paso: vivir juntos.\n\nDespués llegaron nuestros dos pequeños compañeros de cuatro patas, porque al parecer adoptar perritos era una excelente idea cuando todavía no habíamos aprendido a tener una casa en orden. 🐶❤️\n\nY hoy, después de tantos años, tantas etapas y tantas historias, estamos aquí.\n\nLos dos adolescentes que se conocieron a los 13 y 14 años.\nLos mejores amigos que hacían todo juntos.\nEl \"llaverito\" y el que tardó 8 años en darse cuenta de lo que sentía.\nLos que tuvieron un primer beso rechazado… y luego uno que sí funcionó.\nLos que viajaron, vivieron juntos, adoptaron perritos y construyeron una vida.\n\nY ahora…\n\nnos vamos a casar. 💍❤️\n\nAl final, parece que aquel \"no\" del primer beso solo necesitaba una segunda cita. 😂\n\nY qué bueno que la tuvimos." }
  ],

  photos: [
    { src: "img/photos/7.jpeg", alt: "Karen y Nicolas1" },
    { src: "img/photos/6.jpeg", alt: "Karen y Nicolas2 - corazón" },
    { src: "img/photos/5.jpeg", alt: "Karen y Nicolas3 al atardecer" },
    { src: "img/photos/4.jpeg", alt: "Karen y Nicolas4" },
    { src: "img/photos/3.jpeg", alt: "Karen y Nicolas5 - corazón" },
    { src: "img/photos/2.jpeg", alt: "Karen y Nicolas6 al atardecer" },
    { src: "img/photos/1.jpeg", alt: "Karen y Nicolas6 al atardecer" }
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
 