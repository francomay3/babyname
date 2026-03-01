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
  loginOrDivider: string;
  loginEmailPlaceholder: string;
  loginPasswordPlaceholder: string;
  loginNamePlaceholder: string;
  loginSignInButton: string;
  loginCreateAccountButton: string;
  loginRegisterLink: string;
  loginSignInLink: string;
  loginErrorInvalidCredential: string;
  loginErrorEmailInUse: string;
  loginErrorWeakPassword: string;
  loginErrorGeneric: string;

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

  // ── Name detail modal ────────────────────────────────────────────────────────
  nameModalProposedBy: string;
  nameModalRanking: string;
  nameModalNoVotes: string;
  nameModalOf: (n: number) => string;

  // ── Users tab ────────────────────────────────────────────────────────────────
  tabUsers: string;
  usersTitle: string;

  // ── User profile page ────────────────────────────────────────────────────────
  profileViewProfile: string;
  profileBack: string;
  profileRankingSection: string;
  profileNamesSection: string;
  profileVotesSection: string;
  profileNoNames: string;
  profileNoVotes: string;
  profileDeleteName: string;
  profileVotesMore: (n: number) => string;
  profileVotesShowLess: string;

  // ── Info modal ───────────────────────────────────────────────────────────────
  infoTitle: string;
  infoPurpose: string;
  infoNotBinding: string;
  infoLucia: string;
  infoGender: string;
  infoDueDateLabel: string;
  infoDueDateValue: string;

  // ── Phase UI — AddNamesPage ───────────────────────────────────────────────────
  phaseAddNotice: (date: string) => string;
  phaseAddClosed: string;
  phaseAddClosedSub: string;

  // ── Phase UI — VotePage ───────────────────────────────────────────────────────
  phaseVoteNotYetTitle: string;
  phaseVoteNotYetBody: (date: string) => string;
  phaseSelectingTitle: string;
  phaseSelectingBody: (date: string) => string;

  // ── Admin panel ──────────────────────────────────────────────────────────────
  adminViewProfile: string;
  adminPhasesSection: string;
  adminDate1Label: string;
  adminDate2Label: string;
  adminPhasesSaved: string;
  adminPhaseAdd: string;
  adminPhaseSelecting: string;
  adminPhaseVote: string;
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
    appTitle: '🍞 BabyBread',

    tabNames: '✨ Nombres',
    tabVote: '⚔️ Votar',
    tabRanking: '🏆 Ranking',

    femaleLabel: 'Nena',
    femalePluralLabel: 'Nenas',
    maleLabel: 'Nene',
    malePluralLabel: 'Nenes',

    loginSubtitle:
      'Ayudanos a elegir el nombre del bebe que tenemos en el horno',
    loginButton: 'Entrar con Google',
    loginOrDivider: 'o',
    loginEmailPlaceholder: 'Email',
    loginPasswordPlaceholder: 'Contraseña',
    loginNamePlaceholder: 'Tu nombre',
    loginSignInButton: 'Entrar',
    loginCreateAccountButton: 'Crear cuenta',
    loginRegisterLink: '¿No tenés cuenta? Registrate',
    loginSignInLink: '¿Ya tenés cuenta? Ingresá',
    loginErrorInvalidCredential: 'Email o contraseña incorrectos.',
    loginErrorEmailInUse: 'Ese email ya está registrado.',
    loginErrorWeakPassword: 'La contraseña debe tener al menos 6 caracteres.',
    loginErrorGeneric: 'No se pudo iniciar sesión. Intentá de nuevo.',

    addTitle: '✨ Sugerí un nombre',
    addPlaceholder: 'Escribí un nombre...',
    addButton: 'Agregar',
    addNamesCount: (n) => `${n} nombres`,
    addEmptyState: 'Todavía no hay nombres. ¡Empezá vos!',
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

    nameModalProposedBy: 'Propuesto por',
    nameModalRanking: 'Ranking combinado',
    nameModalNoVotes: 'Sin votos todavía',
    nameModalOf: (n) => `de ${n} en total`,

    tabUsers: '👥 Gente',
    usersTitle: '👥 Usuarios',
    profileViewProfile: 'Mi perfil',
    profileBack: '← Volver',
    profileRankingSection: '🏆 Ranking',
    profileNamesSection: '✨ Nombres sugeridos',
    profileVotesSection: '🗳️ Historial de votos',
    profileNoNames: 'Todavía no sugirió ningún nombre.',
    profileNoVotes: 'Todavía no votó ningún duelo.',
    profileDeleteName: 'Borrar nombre',
    profileVotesMore: (n) => `Ver ${n} duelo${n === 1 ? '' : 's'} más`,
    profileVotesShowLess: 'Ver menos',

    rankingTitle: '🏆 Ranking',
    rankingCombined: 'Global',
    rankingMine: 'Personal',
    rankingColName: 'Nombre',
    rankingColElo: 'ELO',
    rankingColWL: 'W / L',
    rankingColBreakdown: 'Desglose',
    rankingNoVotesFemale: 'Todavía no hay votos para nenas.',
    rankingNoVotesMale: 'Todavía no hay votos para nenes.',

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

    infoTitle: '¿De qué se trata?',
    infoPurpose: 'Esta app es para elegir el nombre del bebé al nacer, involucrando a amigos y familia en la elección.',
    infoNotBinding: '🚨 <strong>Aclaración importante:</strong> nos reservamos el derecho de elegir un nombre diferente al ganador 😄 Esto no es vinculante, pero tu voto sí importa.',
    infoLucia: 'La última vez, con Lucía, elegimos los dos nombres ganadores y así se formó su nombre. Pero no necesariamente va a ser lo mismo esta vez.',
    infoGender: 'Todavía no sabemos si va a ser un nene o una nena. ¡lo vamos a saber cuando nazca! Por eso la app tiene las dos categorías.',
    infoDueDateLabel: 'Fecha estimada de parto:',
    infoDueDateValue: '<strong>16 de junio</strong> 🍼',

    adminViewProfile: 'Ver perfil',

    phaseAddNotice: (date) => `Podés agregar nombres hasta el <strong>${date}</strong>. Después empieza la votación final!`,
    phaseAddClosed: 'Esta sección está cerrada',
    phaseAddClosedSub: 'Los nombres seleccionados ya están listos para votar',
    phaseVoteNotYetTitle: 'La votacion todavia no empezó!',
    phaseVoteNotYetBody: (date) => `Podés agregar nombres hasta el <strong>${date}</strong>. La votación aún no comenzó.`,
    phaseSelectingTitle: 'Estamos eligiendo los nombres finales',
    phaseSelectingBody: (date) => `El agregado de nombres cerró. La votación comienza el <strong>${date}</strong>.`,
    adminPhasesSection: 'Fases',
    adminDate1Label: 'Fin de sugerencias',
    adminDate2Label: 'Inicio de votación',
    adminPhasesSaved: '¡Guardar fechas!',
    adminPhaseAdd: 'Sugerencias abiertas',
    adminPhaseSelecting: 'Selección en curso',
    adminPhaseVote: 'Votación abierta',
  },

  // ── English ───────────────────────────────────────────────────────────────────
  en: {
    logout: 'Sign out',
    langToggleLabel: '🇦🇷 Cambiar a español',
    langToggleLabelMobile: '🇦🇷',
    appTitle: '🍞 BabyBread',

    tabNames: '✨ Names',
    tabVote: '⚔️ Vote',
    tabRanking: '🏆 Ranking',

    femaleLabel: 'Girl',
    femalePluralLabel: 'Girls',
    maleLabel: 'Boy',
    malePluralLabel: 'Boys',

    loginSubtitle:
      "Help us choose the name of the baby mom is currently baking",
    loginButton: 'Sign in with Google',
    loginOrDivider: 'or',
    loginEmailPlaceholder: 'Email',
    loginPasswordPlaceholder: 'Password',
    loginNamePlaceholder: 'Your name',
    loginSignInButton: 'Sign in',
    loginCreateAccountButton: 'Create account',
    loginRegisterLink: "Don't have an account? Sign up",
    loginSignInLink: 'Already have an account? Sign in',
    loginErrorInvalidCredential: 'Incorrect email or password.',
    loginErrorEmailInUse: 'That email is already in use.',
    loginErrorWeakPassword: 'Password must be at least 6 characters.',
    loginErrorGeneric: 'Could not sign in. Please try again.',

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

    nameModalProposedBy: 'Proposed by',
    nameModalRanking: 'Combined ranking',
    nameModalNoVotes: 'No votes yet',
    nameModalOf: (n) => `of ${n} total`,

    tabUsers: '👥 People',
    usersTitle: '👥 Users',
    profileViewProfile: 'My profile',
    profileBack: '← Back',
    profileRankingSection: '🏆 Ranking',
    profileNamesSection: '✨ Suggested names',
    profileVotesSection: '🗳️ Vote history',
    profileNoNames: 'No names suggested yet.',
    profileNoVotes: 'No duels voted yet.',
    profileDeleteName: 'Delete name',
    profileVotesMore: (n) => `Show ${n} more duel${n === 1 ? '' : 's'}`,
    profileVotesShowLess: 'Show less',

    rankingTitle: '🏆 Ranking',
    rankingCombined: 'Global',
    rankingMine: 'Personal',
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

    infoTitle: 'What is this?',
    infoPurpose: 'This app is for choosing the baby\'s name at birth, involving friends and family in the decision.',
    infoNotBinding: '🚨 <strong>Important note:</strong> we reserve the right to choose a different name than the winner 😄 This is not binding, but your vote absolutely counts.',
    infoLucia: 'Last time, with Lucía, we picked the two winning names and combined them to form her name. But it won\'t necessarily work the same way this time.',
    infoGender: 'We don\'t know yet whether it\'s a boy or a girl. We\'ll find out at birth! That\'s why the app has both categories.',
    infoDueDateLabel: 'Estimated due date:',
    infoDueDateValue: '<strong>June 16</strong> 🍼',

    adminViewProfile: 'View profile',

    phaseAddNotice: (date) => `You can suggest names until <strong>${date}</strong>. Then the voting phase starts!`,
    phaseAddClosed: 'This section is closed',
    phaseAddClosedSub: 'The selected names are ready for voting',
    phaseVoteNotYetTitle: "Voting hasn't started yet!",
    phaseVoteNotYetBody: (date) => `You can suggest names until <strong>${date}</strong>. Voting hasn't begun yet.`,
    phaseSelectingTitle: "We're choosing the final names",
    phaseSelectingBody: (date) => `Name suggestions are closed. Voting starts on <strong>${date}</strong>.`,
    adminPhasesSection: 'Phases',
    adminDate1Label: 'End of suggestions',
    adminDate2Label: 'Start of voting',
    adminPhasesSaved: 'Save dates!',
    adminPhaseAdd: 'Suggestions open',
    adminPhaseSelecting: 'Selection in progress',
    adminPhaseVote: 'Voting open',
  },
};
