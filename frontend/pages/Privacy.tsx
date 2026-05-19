
import React from 'react';

export const Privacy: React.FC = () => {
  return (
    <div className="prose prose-indigo max-w-none text-gray-600 space-y-4">
      <p className="italic text-sm">Ultima actualizare: {new Date().toLocaleDateString('ro-RO')}</p>
      
      <section>
        <h2 className="text-lg font-semibold text-gray-800">1. Ce date colectăm?</h2>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li><strong>Date furnizate voluntar:</strong> Email (pentru gestionarea anunțului), număr de telefon (pentru contact), locație și detalii despre produse.</li>
          <li><strong>Date colectate automat:</strong> Adresa IP, tipul de browser și identificatori de dispozitiv (prin serviciile de găzduire și baza de date Supabase).</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-800">2. Scopul prelucrării</h2>
        <p className="text-sm">Datele sunt utilizate strict pentru:</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Publicarea și gestionarea anunțurilor tale.</li>
          <li>Permiterea contactului între cumpărător și vânzător.</li>
          <li>Prevenirea fraudei și securitatea platformei.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-800">3. Stocarea datelor</h2>
        <p className="text-sm">Datele sunt stocate securizat utilizând infrastructura <strong>Supabase</strong>. Nu vindem datele tale personale către terțe părți.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-800">4. Drepturile tale (GDPR)</h2>
        <p className="text-sm">Conform Regulamentului General privind Protecția Datelor, ai dreptul de a solicita accesul, rectificarea sau ștergerea datelor tale personale. Poți șterge orice anunț utilizând link-ul de gestionare primit la creare.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-800">5. Contact</h2>
        <p className="text-sm">Pentru orice întrebări legate de datele tale, ne poți contacta prin funcția de suport a platformei.</p>
      </section>
    </div>
  );
};
