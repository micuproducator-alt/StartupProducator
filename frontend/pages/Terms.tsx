import React from "react";

export const Terms: React.FC = () => {
  return (
    <div className="prose prose-indigo max-w-none text-gray-600 space-y-4">
      <section>
        <h2 className="text-xl font-semibold text-gray-800">1. Introducere</h2>
        <p>
          Locallio este o platformă de anunțuri destinată producătorilor locali
          din România. Utilizarea site-ului implică acceptarea acestor termeni.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-800">
          2. Rolul Platformei
        </h2>
        <p>
          Platforma acționează exclusiv ca un{" "}
          <strong>intermediar tehnologic</strong>. Nu suntem parte în
          tranzacțiile dintre vânzători și cumpărători. Nu garantăm calitatea,
          siguranța sau legalitatea produselor listate.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-800">
          3. Responsabilitatea Utilizatorului
        </h2>
        <p>
          Utilizatorii sunt singurii responsabili pentru conținutul anunțurilor
          (text, imagini, preț). Este interzisă postarea de produse ilegale,
          ofensatoare sau care încalcă drepturile de autor.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-800">
          4. Moderare și Ștergere
        </h2>
        <p>
          Ne rezervăm dreptul de a șterge sau suspenda orice anunț care încalcă
          regulile platformei sau care este raportat ca fiind fraudulos, fără
          nicio notificare prealabilă.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-800">
          5. Limitarea Răspunderii
        </h2>
        <p>
          MiculProducator nu poate fi tras la răspundere pentru eventuale daune
          directe sau indirecte rezultate din utilizarea platformei sau din
          interacțiunile cu alți utilizatori.
        </p>
      </section>
    </div>
  );
};
