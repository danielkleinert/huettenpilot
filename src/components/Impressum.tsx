export default function Impressum() {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-card rounded-lg">
      <h1 className="text-3xl font-bold mb-6 text-foreground">Impressum</h1>
      
      <div className="space-y-6 text-foreground">
        <section>
          <h2 className="text-xl font-semibold mb-2">Angaben gemäß § 5 TMG</h2>
          <div className="space-y-1">
            <p><strong>Name:</strong> Daniel Kleinert</p>
            <p><strong>Anschrift:</strong></p>
            <p>Sternbergstr. 15</p>
            <p>76131 Karlsruhe</p>
            <p>Deutschland</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Kontakt</h2>
          <div className="space-y-1">
            <p><strong>E-Mail:</strong> huettenpilot@gmail.com</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Redaktionell Verantwortlicher</h2>
          <p>Daniel Kleinert</p>
          <p>Sternbergstr. 15</p>
          <p>76131 Karlsruhe</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Haftungsausschluss</h2>
          
          <h3 className="text-lg font-medium mb-2">Haftung für Inhalte</h3>
          <p className="mb-4">
            Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den 
            allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht 
            unter der Verpflichtung, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach 
            Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
          </p>

          <h3 className="text-lg font-medium mb-2">Haftung für Links</h3>
          <p className="mb-4">
            Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. 
            Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten 
            Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
          </p>

          <h3 className="text-lg font-medium mb-2">Verfügbarkeit der Hütteninformationen</h3>
          <p>
            Die Verfügbarkeitsdaten der Berghütten werden von externen Anbietern bezogen. Wir übernehmen keine 
            Gewähr für die Richtigkeit, Vollständigkeit oder Aktualität dieser Informationen. Bitte prüfen Sie 
            Verfügbarkeiten immer direkt bei der jeweiligen Hütte vor der Buchung.
          </p>
        </section>
      </div>
    </div>
  )
}