import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Footer from '../components/Footer';

export default function PrivacyPolicy()
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
          <h1 className="text-3xl font-bold text-primary">{t('footer.privacy')}</h1>
          <p className="text-gray-500 mt-2 text-sm">Dernière mise à jour : avril 2026</p>
        </header>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-primary mb-3">1. Responsable du traitement</h2>
          <p className="text-gray-700 leading-relaxed">
            L'application SafeSchool est opérée dans le cadre d'un établissement scolaire.
            Le responsable du traitement des données est l'établissement ayant déployé cette
            instance de l'application. Pour toute question relative à vos données personnelles,
            contactez l'administration de votre établissement.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-primary mb-3">2. Données collectées</h2>
          <p className="text-gray-700 leading-relaxed mb-3">
            Dans le cadre du fonctionnement de l'application, les données suivantes sont traitées :
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>Adresse e-mail et identifiant de connexion</li>
            <li>Rôle dans l'établissement (élève, enseignant, personnel, administrateur)</li>
            <li>Contenu des signalements saisis par les utilisateurs autorisés</li>
            <li>Notes et commentaires associés aux dossiers</li>
            <li>Journaux d'activité techniques (logs de connexion et d'action)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-primary mb-3">3. Finalités du traitement</h2>
          <p className="text-gray-700 leading-relaxed">
            Les données sont traitées exclusivement aux fins suivantes : gestion et suivi des
            signalements de situations préoccupantes, coordination entre les membres du personnel
            habilités, et supervision administrative. Aucune donnée n'est utilisée à des fins
            commerciales ou partagée avec des tiers extérieurs à l'établissement.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-primary mb-3">4. Durée de conservation</h2>
          <p className="text-gray-700 leading-relaxed">
            Les données relatives aux signalements sont conservées pour la durée nécessaire au
            traitement des dossiers, conformément aux obligations légales applicables aux
            établissements scolaires. Les journaux techniques sont conservés pendant une durée
            maximale de 90 jours.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-primary mb-3">5. Droits des utilisateurs</h2>
          <p className="text-gray-700 leading-relaxed">
            Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez
            d'un droit d'accès, de rectification et d'effacement de vos données personnelles,
            ainsi que d'un droit à la limitation du traitement. Pour exercer ces droits, adressez
            une demande écrite à l'administration de votre établissement.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-primary mb-3">6. Sécurité</h2>
          <p className="text-gray-700 leading-relaxed">
            L'accès à l'application est sécurisé par authentification. Les mots de passe sont
            stockés sous forme hachée (bcrypt). Les communications entre le navigateur et le
            serveur sont chiffrées. L'accès aux données est strictement limité aux utilisateurs
            disposant des droits correspondants à leur rôle.
          </p>
        </section>

      </main>

      <Footer />

    </div>
  );
}
