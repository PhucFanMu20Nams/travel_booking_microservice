export const uiText = {
  common: {
    home: 'Home',
    unknown: 'Unknown',
    searchPlaceholder: 'Search...',
    sync: {
      syncingModules: 'Syncing modules...',
      lastSyncAt: (time: string) => `Last sync ${time}`,
      awaitingSync: 'Awaiting sync'
    },
    confirmModal: {
      title: 'Confirm',
      description: 'Are you sure you want to continue?',
      confirm: 'Confirm',
      cancel: 'Cancel'
    },
    emailVerification: {
      column: 'Email verified',
      verified: 'Verified',
      pending: 'Pending'
    }
  },
  layout: {
    brandSubtitle: 'Flight booking system',
    multiServiceStack: 'MULTI-SERVICE STACK',
    logout: 'Logout',
    sidebar: {
      dashboard: 'Dashboard',
      flights: 'Flights',
      wallet: 'My Wallet',
      bookings: 'Bookings',
      bookingsList: 'List',
      newBooking: 'New booking',
      management: 'MANAGEMENT',
      users: 'Users',
      passengers: 'Passengers',
      airports: 'Airports',
      aircraft: 'Aircraft',
      reviewWalletTopUps: 'Review wallet top-ups'
    },
    routes: {
      dashboard: 'Dashboard',
      users: 'Users',
      create: 'Create',
      edit: 'Edit',
      airports: 'Airports',
      aircrafts: 'Aircraft',
      flights: 'Flights',
      seats: 'Seats',
      passengers: 'Passengers',
      payments: 'Payments',
      wallet: 'My Wallet',
      bookings: 'Bookings',
      reconcile: 'Review wallet top-ups',
      login: 'Sign in'
    }
  },
  users: {
    list: {
      eyebrow: 'IDENTITY DIRECTORY',
      title: 'User Management',
      subtitle:
        'This list emphasizes business identity, role, and verification status instead of treating internal IDs as the primary focus.',
      createAction: 'Create',
      summary: (visible: number, total: number) => `${visible} visible / ${total} total`,
      searchPlaceholder: 'Search by name or email',
      columns: {
        identity: 'Users',
        role: 'Role',
        passenger: 'Passenger',
        createdAt: 'Created at',
        actions: 'Actions'
      },
      rowMeta: (id: number, passportNumber: string, age: number) => `USR-${id} · ${passportNumber} · ${age}y`,
      deleteModal: {
        title: 'Delete user',
        description: 'Are you sure you want to delete this user?'
      },
      loadError: 'Unable to load the user list. Please try again.'
    }
  }
} as const;
