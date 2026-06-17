/**
 * Rejette toute chaîne contenant un octet NUL (\x00).
 *
 * Les octets NUL ne sont jamais légitimes dans les champs texte saisis par les
 * utilisateurs et constituent un vecteur classique d'attaques par injection /
 * troncature (par ex. les astuces de type « poison null byte » contre les
 * parseurs en aval, le driver de base de données ou le système de fichiers) ;
 * on les filtre donc dès la couche DTO.
 *
 * La règle `no-control-regex` signale tout caractère de contrôle dans un
 * littéral d'expression régulière. Ici, ce caractère de contrôle est précisément
 * l'objet du motif : la règle est donc désactivée intentionnellement pour cette
 * unique définition partagée, plutôt qu'à chaque site d'appel.
 */
// eslint-disable-next-line no-control-regex
export const NO_NULL_BYTE = /^[^\x00]*$/;
