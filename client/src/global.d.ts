interface GoogleTokenClient {
  requestAccessToken: () => void;
}

interface GoogleOAuth2TokenResponse {
  access_token?: string;
}

interface GoogleIdentityServices {
  accounts: {
    oauth2: {
      initTokenClient: (config: {
        client_id: string;
        scope: string;
        callback: (response: GoogleOAuth2TokenResponse) => void;
      }) => GoogleTokenClient;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentityServices;
    __E2E_TESTING__?: boolean;
    setAgeRange?: (min: number, max: number) => void;
  }
}

export {};
