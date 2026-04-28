import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Footer from '../components/Footer';

export default function TermsOfService()
{
  const { t } = useTranslation();

  return (
    <div className="flex flex-col min-h-screen bg-surface font-sans">

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">

        <Link
          to="/login"
          className="text-primary hover:underline text-sm inline-block mb-8 focus:outline-none focus:ring-2 focus:ring-primary rounded"
        >
          ← {t('footer.backToApp')}
        </Link>

        <header className="mb-10">
          <h1 className="text-3xl font-bold text-primary">{t('footer.terms')}</h1>
          <p className="text-gray-500 mt-2 text-sm">Dernière mise à jour : avril 2026</p>
        </header>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-primary mb-3">1. Objet</h2>
          <p className="text-gray-700 leading-relaxed">
            SafeSchool est une application de gestion et de suivi des signalements de situations
            préoccupantes au sein des établissements scolaires. Elle est destinée exclusivement
            aux membres du personnel et aux élèves enregistrés dans le système par
            l'administration de l'établissement.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-primary mb-3">2. Accès et comptes utilisateurs</h2>
          <p className="text-gray-700 leading-relaxed">
            L'accès à l'application est conditionné à la possession d'un compte créé par
            l'administration. Les identifiants sont personnels et ne doivent pas être partagés.
            Tout accès non autorisé ou toute tentative de contournement des mécanismes
            d'authentification est strictement interdit et susceptible d'entraîner des sanctions
            disciplinaires.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-primary mb-3">3. Utilisation acceptable</h2>
          <p className="text-gray-700 leading-relaxed mb-3">
            Les utilisateurs s'engagent à :
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>Utiliser l'application uniquement dans le cadre de leurs fonctions dans l'établissement</li>
            <li>Saisir des informations exactes et de bonne foi dans les signalements</li>
            <li>Respecter la confidentialité des dossiers auxquels ils ont accès</li>
            <li>Ne pas tenter d'accéder à des données dépassant leur niveau d'habilitation</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-primary mb-3">4. Contenu des signalements</h2>
          <p className="text-gray-700 leading-relaxed">
            Les signalements doivent être rédigés avec rigueur et objectivité. Tout contenu
            manifestement inexact, diffamatoire ou sans lien avec une situation préoccupante
            réelle engage la responsabilité de son auteur. L'administration se réserve le droit
            de clôturer tout dossier ne répondant pas à ces critères.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-primary mb-3">5. Responsabilités</h2>
          <p className="text-gray-700 leading-relaxed">
            L'établissement met en œuvre les mesures techniques raisonnables pour assurer la
            disponibilité et la sécurité de l'application. Il ne saurait être tenu responsable
            d'une interruption de service ou d'une perte de données résultant d'un événement
            extérieur à son contrôle. Les utilisateurs sont responsables des informations qu'ils
            saisissent dans le système.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-primary mb-3">6. Modification des présentes conditions</h2>
          <p className="text-gray-700 leading-relaxed">
            Ces conditions d'utilisation peuvent être mises à jour à tout moment par
            l'administration. Les utilisateurs seront informés de toute modification substantielle.
            La poursuite de l'utilisation de l'application après notification vaut acceptation
            des nouvelles conditions.
          </p>
        </section>

      </main>

      <Footer />

    </div>
  );
}
