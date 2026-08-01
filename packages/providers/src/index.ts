export interface StorageProvider {
  putObject(key: string, data: Uint8Array, contentType: string): Promise<void>;
  getSignedReadUrl(key: string, expiresInSeconds: number): Promise<string>;
}

export interface MessagingProvider {
  sendSms(input: { to: string; body: string; correlationId?: string }): Promise<{ messageId: string }>;
  sendEmail(input: { to: string; subject: string; html: string; correlationId?: string }): Promise<{ messageId: string }>;
}

export interface EventBusProvider {
  publish<T>(topic: string, event: T, options?: { correlationId?: string }): Promise<void>;
}

export interface SecretsProvider {
  getSecret(name: string): Promise<string>;
}

export interface ObservabilityProvider {
  trackEvent(name: string, properties?: Record<string, string>, metrics?: Record<string, number>): void;
  trackException(error: Error, properties?: Record<string, string>): void;
}

export interface AIProvider {
  summarizeConversation(input: { transcript: string; purpose: 'administrative' | 'service' }): Promise<{ summary: string; confidence?: number }>;
}

export interface ProviderRegistry {
  storage: StorageProvider;
  messaging: MessagingProvider;
  events: EventBusProvider;
  secrets: SecretsProvider;
  observability: ObservabilityProvider;
  ai: AIProvider;
}
