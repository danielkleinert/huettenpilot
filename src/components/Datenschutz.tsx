export default function Datenschutz() {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-card rounded-lg">
      <h1 className="text-3xl font-bold mb-6 text-foreground">Datenschutzerklärung</h1>
      
      <div className="space-y-6 text-foreground">
        <section>
          <h2 className="text-xl font-semibold mb-2">1. Datenschutz auf einen Blick</h2>
          
          <h3 className="text-lg font-medium mb-2">Allgemeine Hinweise</h3>
          <p className="mb-4">
            Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten 
            passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie 
            persönlich identifiziert werden können.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">2. Allgemeine Hinweise und Pflichtinformationen</h2>
          
          <h3 className="text-lg font-medium mb-2">Datenschutz</h3>
          <p className="mb-4">
            Der Betreiber dieser Seiten nimmt den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre 
            personenbezogenen Daten vertraulich und entsprechend den gesetzlichen Datenschutzvorschriften sowie 
            dieser Datenschutzerklärung.
          </p>

          <h3 className="text-lg font-medium mb-2">Verantwortliche Stelle</h3>
          <p className="mb-4">
            Verantwortlich für die Datenverarbeitung auf dieser Website ist:<br/>
            Daniel Kleinert<br/>
            Sternbergstr. 15<br/>
            76131 Karlsruhe<br/>
            E-Mail: huettenpilot@gmail.com
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">3. Datenerfassung auf dieser Website</h2>
          
          <h3 className="text-lg font-medium mb-2">Server-Log-Dateien</h3>
          <p className="mb-4">
            Diese Website wird über Netlify gehostet. Beim Aufruf dieser Website werden automatisch Informationen 
            in Server-Log-Dateien gespeichert, die Ihr Browser automatisch übermittelt. Dies sind:
          </p>
          <ul className="list-disc list-inside mb-4 space-y-1">
            <li>Browsertyp und Browserversion</li>
            <li>Verwendetes Betriebssystem</li>
            <li>Referrer URL</li>
            <li>Hostname des zugreifenden Rechners</li>
            <li>Uhrzeit der Serveranfrage</li>
            <li>IP-Adresse</li>
          </ul>
          <p className="mb-4">
            Diese Daten werden nicht mit anderen Datenquellen zusammengeführt. Die Datenverarbeitung erfolgt 
            auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO zur Bereitstellung der Website.
          </p>


          <h3 className="text-lg font-medium mb-2">Externe Datenquellen</h3>
          <p className="mb-4">
            Die Hüttenverfügbarkeiten werden von hut-reservation.org über unsere Server abgerufen. 
            Dabei werden keine personenbezogenen Daten von Ihnen an Drittanbieter übertragen.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">4. Ihre Rechte</h2>
          <p className="mb-4">Sie haben folgende Rechte:</p>
          <ul className="list-disc list-inside mb-4 space-y-1">
            <li>Recht auf Auskunft über Ihre gespeicherten personenbezogenen Daten</li>
            <li>Recht auf Berichtigung unrichtiger Daten</li>
            <li>Recht auf Löschung Ihrer Daten</li>
            <li>Recht auf Einschränkung der Datenverarbeitung</li>
            <li>Recht auf Datenübertragbarkeit</li>
            <li>Widerspruchsrecht gegen die Verarbeitung</li>
            <li>Beschwerderecht bei einer Aufsichtsbehörde</li>
          </ul>
          <p>
            Bei Fragen wenden Sie sich an: huettenpilot@gmail.com
          </p>
        </section>
      </div>
    </div>
  )
}