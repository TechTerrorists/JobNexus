export interface AppConfig {
    pageTitle: string;
    pageDescription: string;
    companyName: string;

    supportsChatInput: boolean;
    supportsVideoInput: boolean;
    supportsScreenShare: boolean;
    isPreConnectBufferEnabled: boolean;

    logo: string;
    startButtonText: string;
    accent?: string;
    logoDark?: string;
    accentDark?: string;

    // agent dispatch configuration
    agentName?: string;

    // LiveKit Cloud Sandbox configuration
    sandboxId?: string;
}

export const APP_CONFIG_DEFAULTS: AppConfig = {
    companyName: 'JobNexus',
    pageTitle: 'JobNexus Mock Interview',
    pageDescription: 'AI-enabled mock interview platform',

    supportsChatInput: true,
    supportsVideoInput: true,
    supportsScreenShare: true,
    isPreConnectBufferEnabled: true,

    logo: '/jN-logo.png',
    accent: '#002cf2',
    logoDark: '/jN-logo.png',
    accentDark: '#1fd5f9',
    startButtonText: 'Start call',

    // agent dispatch configuration
    agentName: process.env.AGENT_NAME ?? undefined,

    // LiveKit Cloud Sandbox configuration
    sandboxId: undefined,
};
