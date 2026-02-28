// ─────────────────────────────────────────────────────────────────────────────
// All user-facing strings for the app.
// Add / modify strings here to update copy in both languages.
// ─────────────────────────────────────────────────────────────────────────────

export type Locale = 'es' | 'en';

export interface Strings {
  // ── Header ──────────────────────────────────────────────────────────────────
  logout: string;
  /** Full label on the lang-toggle button — desktop (flag + text) */
  langToggleLabel: string;
  /** Flag-only label for mobile */
  langToggleLabelMobile: string;
  /** App title shown in the header — desktop */
  appTitle: string;

  // ── Main tabs ───────────────────────────────────────────────────────────────
  tabNames: string;
  tabVote: string;
  tabRanking: string;

  // ── Gender labels ────────────────────────────────────────────────────────────
  /** Singular, capitalised: "Nena" / "Girl" */
  femaleLabel: string;
  /** Plural, capitalised: "Nenas" / "Girls" */
  femalePluralLabel: string;
  /** Singular, capitalised: "Nene" / "Boy" */
  maleLabel: string;
  /** Plural, capitalised: "Nenes" / "Boys" */
  malePluralLabel: string;

  // ── Login page ───────────────────────────────────────────────────────────────
  loginSubtitle: string;
  loginButton: string;

  // ── Add-names page ───────────────────────────────────────────────────────────
  addTitle: string;
  addPlaceholder: string;
  addButton: string;
  /** e.g. "3 nombres" / "3 names" */
  addNamesCount: (n: number) => string;
  addEmptyState: string;
  addNotifDuplicateTitle: string;
  addNotifDuplicateFemaleMsg: (name: string) => string;
  addNotifDuplicateMaleMsg: (name: string) => string;
  addNotifSuccessTitle: string;
  addNotifSuccessMsg: (name: string) => string;
  addNotifErrorTitle: string;
  addNotifErrorMsg: string;

  // ── Vote page ────────────────────────────────────────────────────────────────
  voteQuestion: string;
  voteSkip: string;
  voteNotEnoughTitle: string;
  voteNotEnoughLink: string;
  voteAllDoneTitle: string;
  voteAllDoneSubtitle: string;
  voteAllDoneLink: string;
  voteErrorTitle: string;
  voteErrorMsg: string;

  // ── Ranking page ─────────────────────────────────────────────────────────────
  rankingTitle: string;
  rankingCombined: string;
  rankingMine: string;
  rankingColName: string;
  rankingColElo: string;
  rankingColWL: string;
  rankingColBreakdown: string;
  rankingNoVotesFemale: string;
  rankingNoVotesMale: string;

  // ── Admin panel ──────────────────────────────────────────────────────────────
  adminDrawerTitle: string;
  adminSectionUsers: string;
  adminSectionAdmins: string;
  adminSectionDanger: string;
  adminNamesCount: (n: number) => string;
  adminVotesCount: (n: number) => string;
  adminDeleteVotes: string;
  adminDeleteUser: string;
  adminAddAdmin: string;
  adminRemoveAdmin: string;
  adminResetDb: string;
  adminResetConfirmPrompt: string;
  adminResetConfirmWord: string;
  adminResetSuccess: string;
  adminConfirmTitle: string;
  adminCancel: string;
  adminConfirm: string;
  adminYouLabel: string;
  adminDeleteVotesSuccess: string;
  adminDeleteUserSuccess: string;
  adminErrorMsg: string;
}

export const locales: Record<Locale, Strings> = {
  // ── Español ──────────────────────────────────────────────────────────────────
  es: {
    logout: 'Cerrar sesión',
    langToggleLabel: '🇺🇸 Switch to English',
    langToggleLabelMobile: '🇺🇸',
    appTitle: '👶 BabyName',

    tabNames: '✨ Nombres',
    tabVote: '⚔️ Votar',
    tabRanking: '🏆 Ranking',

    femaleLabel: 'Nena',
    femalePluralLabel: 'Nenas',
    maleLabel: 'Nene',
    malePluralLabel: 'Nenes',

    loginSubtitle:
      'Elegí el nombre perfecto para tu bebé jugando a duelos entre nombres. ¡El ganador se gana el corazón de la familia!',
    loginButton: 'Entrar con Google',

    addTitle: '✨ Sugerí un nombre',
    addPlaceholder: 'Escribí un nombre...',
    addButton: 'Agregar',
    addNamesCount: (n) => `${n} nombres`,
    addEmptyState: 'Todavía no hay nombres. ¡Sé el primero!',
    addNotifDuplicateTitle: '¡Ya existe!',
    addNotifDuplicateFemaleMsg: (name) => `"${name}" ya está en la lista de nenas.`,
    addNotifDuplicateMaleMsg: (name) => `"${name}" ya está en la lista de nenes.`,
    addNotifSuccessTitle: '¡Nombre agregado!',
    addNotifSuccessMsg: (name) => `"${name}" entró al ruedo 🎉`,
    addNotifErrorTitle: 'Error',
    addNotifErrorMsg: 'No se pudo agregar el nombre. Intentá de nuevo.',

    voteQuestion: '¿Cuál te gusta más?',
    voteSkip: 'Saltar este duelo',
    voteNotEnoughTitle: 'Necesitás al menos 2 nombres para votar.',
    voteNotEnoughLink: 'Agregá más nombres en la pestaña "Nombres" →',
    voteAllDoneTitle: '¡Votaste todos los duelos posibles!',
    voteAllDoneSubtitle: 'Cuando se agreguen nuevos nombres van a aparecer nuevos duelos.',
    voteAllDoneLink: 'Ir a agregar nombres →',
    voteErrorTitle: 'Error al votar',
    voteErrorMsg: 'No se pudo guardar el voto. El duelo volvió a la lista.',

    rankingTitle: '🏆 Ranking',
    rankingCombined: 'Combinado',
    rankingMine: 'El mío',
    rankingColName: 'Nombre',
    rankingColElo: 'ELO',
    rankingColWL: 'W / L',
    rankingColBreakdown: 'Desglose',
    rankingNoVotesFemale: 'Todavía no hay votos para nenas. ¡Empezá a votar!',
    rankingNoVotesMale: 'Todavía no hay votos para nenes. ¡Empezá a votar!',

    adminDrawerTitle: '⚙️ Admin',
    adminSectionUsers: 'Usuarios',
    adminSectionAdmins: 'Administradores',
    adminSectionDanger: 'Zona de peligro',
    adminNamesCount: (n) => `${n} nombres`,
    adminVotesCount: (n) => `${n} votos`,
    adminDeleteVotes: 'Borrar votos',
    adminDeleteUser: 'Borrar usuario',
    adminAddAdmin: 'Dar admin',
    adminRemoveAdmin: 'Quitar admin',
    adminResetDb: 'Resetear base de datos',
    adminResetConfirmPrompt: 'Escribí RESET para confirmar. Esta acción no se puede deshacer.',
    adminResetConfirmWord: 'RESET',
    adminResetSuccess: '¡Base de datos reseteada!',
    adminConfirmTitle: '¿Estás seguro?',
    adminCancel: 'Cancelar',
    adminConfirm: 'Confirmar',
    adminYouLabel: 'tú',
    adminDeleteVotesSuccess: 'Votos borrados.',
    adminDeleteUserSuccess: 'Usuario borrado.',
    adminErrorMsg: 'Ocurrió un error. Intentá de nuevo.',
  },

  // ── English ───────────────────────────────────────────────────────────────────
  en: {
    logout: 'Sign out',
    langToggleLabel: '🇦🇷 Cambiar a español',
    langToggleLabelMobile: '🇦🇷',
    appTitle: '👶 BabyName',

    tabNames: '✨ Names',
    tabVote: '⚔️ Vote',
    tabRanking: '🏆 Ranking',

    femaleLabel: 'Girl',
    femalePluralLabel: 'Girls',
    maleLabel: 'Boy',
    malePluralLabel: 'Boys',

    loginSubtitle:
      "Pick the perfect name for your baby by playing name duels. The winner wins the family's heart!",
    loginButton: 'Sign in with Google',

    addTitle: '✨ Suggest a name',
    addPlaceholder: 'Type a name...',
    addButton: 'Add',
    addNamesCount: (n) => `${n} names`,
    addEmptyState: 'No names yet. Be the first!',
    addNotifDuplicateTitle: 'Already exists!',
    addNotifDuplicateFemaleMsg: (name) => `"${name}" is already in the girls list.`,
    addNotifDuplicateMaleMsg: (name) => `"${name}" is already in the boys list.`,
    addNotifSuccessTitle: 'Name added!',
    addNotifSuccessMsg: (name) => `"${name}" is in the running 🎉`,
    addNotifErrorTitle: 'Error',
    addNotifErrorMsg: 'Could not add the name. Please try again.',

    voteQuestion: 'Which one do you like more?',
    voteSkip: 'Skip this duel',
    voteNotEnoughTitle: 'You need at least 2 names to vote.',
    voteNotEnoughLink: 'Add more names in the "Names" tab →',
    voteAllDoneTitle: "You've voted on all possible duels!",
    voteAllDoneSubtitle: 'New duels will appear when new names are added.',
    voteAllDoneLink: 'Go add names →',
    voteErrorTitle: 'Vote error',
    voteErrorMsg: 'Could not save the vote. The duel is back in the queue.',

    rankingTitle: '🏆 Ranking',
    rankingCombined: 'Combined',
    rankingMine: 'Mine',
    rankingColName: 'Name',
    rankingColElo: 'ELO',
    rankingColWL: 'W / L',
    rankingColBreakdown: 'Breakdown',
    rankingNoVotesFemale: 'No votes yet for girls. Start voting!',
    rankingNoVotesMale: 'No votes yet for boys. Start voting!',

    adminDrawerTitle: '⚙️ Admin',
    adminSectionUsers: 'Users',
    adminSectionAdmins: 'Admins',
    adminSectionDanger: 'Danger Zone',
    adminNamesCount: (n) => `${n} names`,
    adminVotesCount: (n) => `${n} votes`,
    adminDeleteVotes: 'Reset votes',
    adminDeleteUser: 'Delete user',
    adminAddAdmin: 'Grant admin',
    adminRemoveAdmin: 'Remove admin',
    adminResetDb: 'Reset database',
    adminResetConfirmPrompt: 'Type RESET to confirm. This action cannot be undone.',
    adminResetConfirmWord: 'RESET',
    adminResetSuccess: 'Database reset!',
    adminConfirmTitle: 'Are you sure?',
    adminCancel: 'Cancel',
    adminConfirm: 'Confirm',
    adminYouLabel: 'you',
    adminDeleteVotesSuccess: 'Votes deleted.',
    adminDeleteUserSuccess: 'User deleted.',
    adminErrorMsg: 'An error occurred. Please try again.',
  },
};
