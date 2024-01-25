export class AuthService {
  private static instance: AuthService;
  private apiKey?: string;
  private generateJWT?: () => Promise<string>;

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  public setGenerateJWT(generateJWT: () => Promise<string>) {
    this.generateJWT = generateJWT;
  }

  public async getAuthHeader(): Promise<string> {
    if (this.apiKey) {
      return 'Basic ' + btoa(this.apiKey + ':');
    }
    if (this.generateJWT) {
      const token = await this.generateJWT();
      return `Bearer ${token}`;
    }
    throw new Error('Authentication method not provided');
  }
}
