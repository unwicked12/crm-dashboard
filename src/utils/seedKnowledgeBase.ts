import { knowledgeBaseService, KnowledgeBaseArticle } from '../services/knowledgeBaseService';

const articles: Omit<KnowledgeBaseArticle, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: "Traitement d'une association",
    content: "Demander le numéro SIREN : Utilisez-le pour télécharger l'\"Avis de situation SIRENE\" (équivalent de l'Extrait KBIS pour une association).\n\nDocuments requis : Un document mentionnant les rôles des personnes présentes dans l'association. Le client doit apparaître sur ce document avec un rôle précis (ex : président, responsable financier).",
    category: "Associations",
    tags: ["association", "SIREN", "documents", "validation"]
  },
  {
    title: "Carte grise non au nom du vendeur inscrit",
    content: "Vendeur professionnel : Demander le \"Récépissé de DA ANTS\" prouvant que le vendeur est le nouvel acquéreur.\n\nPropriétaire du véhicule décédé : Si le vendeur est un héritier, demander la dévolution successorale confirmant son statut. Les fonds doivent être versés à l'héritier ou au notaire.\n\nSociété de leasing : Si le vendeur apparaît en tant que cotitulaire sur la carte grise, demander le certificat de cession prouvant que le contrat de leasing est soldé et que le locataire est devenu propriétaire.",
    category: "Documents",
    tags: ["carte grise", "vendeur", "leasing", "succession"]
  },
  {
    title: "Validation d'une société hors France (en Europe)",
    content: "1. Demander l'équivalent d'un Extrait KBIS/Registry of Commerce (datant de moins de 3 mois).\n2. Fournir le document CashSentinel \"Déclaration des bénéficiaires effectifs ultimes\" pour qu'il soit rempli et signé (3 pages).\n3. Emplacement du document : OPS TEAM > AUTOMOTIVES > DOCUMENTS > FOR CLIENTS TO FILL > DECLARATION DES BENEFICIAIRES EFFECTIFS.",
    category: "Validation",
    tags: ["société étrangère", "Europe", "documents", "KBIS"]
  },
  {
    title: "Validation d'un compte Société",
    content: "Si la personne inscrite n'apparaît ni sur le KBIS ni sur le RBE, écrire à l'agence ou au propriétaire du contrat pour mettre à jour le dossier avec une personne autorisée figurant sur le KBIS ou le RBE.",
    category: "Validation",
    tags: ["société", "KBIS", "RBE", "validation"]
  },
  {
    title: "Création de compte pour un collaborateur par une agence",
    content: "Depuis le tableau de bord principal de l'agence :\n1. Aller dans Outils > Liste des collaborateurs > Ajouter un nouveau collaborateur.\n2. Une fois ajouté, le collaborateur doit :\n   - Accéder au lien spécifique à l'agence\n   - Créer son compte via ce lien",
    category: "Procédures",
    tags: ["compte", "collaborateur", "agence", "création"]
  },
  {
    title: "Validation d'un compte client (Particuliers)",
    content: "Pour valider l'identité d'un particulier, les documents requis dépendent de trois cas possibles :\n\nCas 1 : Le client possède une pièce d'identité valide (CNI, passeport ou permis format carte de crédit).\n\nCas 2 : La pièce d'identité est expirée :\n- Fournir une pièce d'identité expirée + un permis de conduire ancien format.\n\nCas 3 : Le client ne possède aucune pièce d'identité ou permis :\n- Demander tout document justifiant l'identité.\n- Faire valider le dossier par un Compliance Officer.",
    category: "Validation",
    tags: ["compte client", "particulier", "identité", "validation"]
  },
  {
    title: "Les 3 conditions pour valider un virement (1st Val)",
    content: "1. Correspondance des noms et prénoms :\n- Les noms/prénoms sur le virement doivent correspondre à ceux du compte CashSentinel.\n- Exception : Pour les comptes joints, vérifier que l'adresse de domicile correspond. Sinon, effectuer un SEPAMAIL.\n\n2. Compte actif :\n- Le compte doit être en statut vert et \"Active\".\n\n3. Statut du contrat :\n- Le contrat doit être au minimum en statut Envoyé (Sent) ou Accepté (Accepted).\n- Ne pas valider de virement si le contrat est en Draft ou New.",
    category: "Validation",
    tags: ["virement", "validation", "conditions"]
  },
  {
    title: "Procédure pour un SEPAMAIL",
    content: "1. Remplir la case IBAN : Indiquer l'IBAN à l'origine du virement (visible en haut à gauche sur un virement classique).\n2. Référence de la relation commerciale : Inscrire \"Client\".\n3. Nom et prénom : Renseigner ceux du compte CashSentinel (pas ceux du compte bancaire).",
    category: "Procédures",
    tags: ["SEPAMAIL", "IBAN", "procédure"]
  },
  {
    title: "Statuts des contrats et leur signification",
    content: "- Draft : Brouillon, le contrat n'est pas encore enregistré.\n- New : Brouillon enregistré.\n- Sent : Contrat envoyé pour approbation de l'acheteur.\n- Accepted : Contrat accepté par l'acheteur.\n- Completed : Véhicule livré, le vendeur est prêt à recevoir son paiement.\n- Closed : Vendeur payé, contrat finalisé.",
    category: "Statuts",
    tags: ["contrat", "statuts", "signification"]
  },
  {
    title: "Modification d'un contrat",
    content: "1. Aller dans Liste des contrats.\n2. Cliquer sur Modifier/Éditer.\n3. Ajouter une note expliquant la raison de la modification.\n4. Pour un changement de numéro de contrat :\n   - Supprimer l'ancien numéro.\n   - Ajouter le nouveau.",
    category: "Procédures",
    tags: ["contrat", "modification", "procédure"]
  },
  {
    title: "Entrée des paiements instantanés",
    content: "1. Ouvrir en parallèle :\n   - Le site BNP\n   - La page client du Back Office\n2. Accéder au compte courant de CashSentinel et ouvrir toutes les opérations reçues.\n3. Utiliser la fonction Ctrl + F et rechercher \"instant reçus\".",
    category: "Paiements",
    tags: ["paiement", "instantané", "BNP", "procédure"]
  }
];

export const seedKnowledgeBase = async () => {
  try {
    for (const article of articles) {
      await knowledgeBaseService.createArticle(article);
    }
    console.log('Knowledge base seeded successfully');
  } catch (error) {
    console.error('Error seeding knowledge base:', error);
  }
};
