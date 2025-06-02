// Diese Datei definiert Typen für das Matomo-Tracking
declare global {
  interface MatomoTracking {
    push: (args: [string, ...unknown[]]) => void
  }

  interface Window {
    _paq: MatomoTracking | undefined
  }
}

export {}
