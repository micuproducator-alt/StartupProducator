// În folderul routes, deschide index.js
var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

// --- ADAUGĂ ACEASTĂ RUTĂ PENTRU ANUNȚURI ---
router.post("/api/ads", function (req, res) {
  console.log("Date primite de la React:", req.body);

  // Aici, în viitor, vei salva datele în MongoDB sau altă bază de date.
  // Momentan, trimitem un răspuns de succes înapoi la React.
  res.status(201).json({
    message: "Anunț primit cu succes!",
    id: "id_generat_" + Math.random().toString(36).substr(2, 9),
  });
});

module.exports = router;
