/* Suit l'état de la connexion réseau du navigateur (en ligne / hors ligne) */
import { useEffect, useState } from "react";

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return online;
}

/* Compteur incrémenté à chaque retour de connexion — à ajouter aux dépendances
   d'un useEffect de chargement pour recharger les données à la reconnexion */
export function useReconnectKey(): number {
  const [key, setKey] = useState(0);

  useEffect(() => {
    const onOnline = () => setKey((k) => k + 1);
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  return key;
}
