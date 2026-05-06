function temperatureEstimee(mois, heure) {
  // Temperatures moyennes min et max a El Jadida par mois
  // mois : 1 = janvier, 2 = fevrier, ..., 12 = decembre
  // Tmoy : la temperature moyenne du mois
  // A : l'amplitude thermique journaliere
  // h0 : le decalage horaire permettant d'obtenir la temperature maximale a une heure precise de mois (ex: 9 pour 15h, 10 pour: 16h)
  const MOINS = {
    1: { Tmin: 10.9, Tmax: 16.8, Tmoy: 13.85, A: 2.95, h0: 8},
    2: { Tmin: 11.2, Tmax: 17.3, Tmoy: 14.25, A: 3.05, h0: 9},
    3: { Tmin: 12.7, Tmax: 19.1, Tmoy: 15.9, A: 3.2, h0: 9},
    4: { Tmin: 14.1, Tmax: 20.2, Tmoy: 17.15, A: 3.05, h0: 9},
    5: { Tmin: 16.2, Tmax: 22.5, Tmoy: 19.35, A: 3.15, h0: 9},
    6: { Tmin: 18.5, Tmax: 24.9, Tmoy: 21.7, A: 3.2, h0: 9},
    7: { Tmin: 20.1, Tmax: 26.4, Tmoy: 23.25, A: 3.15, h0: 9},
    8: { Tmin: 20.8, Tmax: 27.3, Tmoy: 24.05, A: 3.25, h0: 9},
    9: { Tmin: 19.9, Tmax: 26.0, Tmoy: 22.95, A: 3.05, h0: 9},
    10: { Tmin: 18.1, Tmax: 24.1, Tmoy: 21.1, A: 3.0, h0: 9},
    11: { Tmin: 14.4, Tmax: 20.2, Tmoy: 17.3, A: 2.9, h0: 9},
    12: { Tmin: 12.2, Tmax: 18.1, Tmoy: 15.15, A: 2.95, h0: 9},
  };

  if (!MOINS[mois]) {
    throw new Error("Le mois doit etre compris entre 1 et 12.");
  }

  if (heure < 0 || heure > 23) {
    throw new Error("L'heure doit etre comprise entre 0 et 23.");
  }

  // Bruit meteorologique entre -1.5 C et 1.5 C
  const b = Math.random() * 3 - 1.5;

  const T = MOINS[mois].Tmoy + MOINS[mois].A * Math.sin(((2 * Math.PI) / 24) * (heure - MOINS[mois].h0)) + b;

  return T;
}


// Les zones exactes correspondant a la carte d'El Jadida
const districts = [
    "Sidi Bouzid",
    "Bennani",
    "El Manar",
    "Sidi Moussa",
    "Essaada",
    "Mouilha",
    "Cité Portugaise",
    "Najd",
    "Les Facultés",
    "Quatier Jaouhara"
];

// Generer les donnees pour TOUTES les zones en meme temps
const now = new Date();
const allData = districts.map((district, index) => {
    const sensorNumber = index + 1;
    const temperature = temperatureEstimee(now.getMonth(), now.getHours());

    return {
        sensor_id: "TEMP-ELJ-" + String(sensorNumber).padStart(3, "0"),
        city: "El Jadida",
        district: district,
        temperature: temperature,
        unit: "C",
        timestamp: new Date().toISOString()
    };
});

// Preparer le message Kafka
msg.topic = "smartcity.temperature.readings";
// On envoie le tableau complet converti en JSON
msg.payload = JSON.stringify(allData);

return msg;
