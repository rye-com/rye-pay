/* The `AuthService` class provides methods to set an API key or a function to generate a JWT token,
and a method to get an authentication header based on the provided credentials. */
export class AuthService {
  private static instance: AuthService;
  private apiKey?: string;
  private generateJWT?: () => Promise<string>;

  /**
   * The getInstance function returns an instance of the AuthService class, creating one if it doesn't
   * already exist.
   * @returns The `AuthService.instance` is being returned.
   */
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

  /**
   * The function `getAuthHeader` returns an authentication header string based on the provided API key
   * or JWT token.
   * @returns a Promise that resolves to a string. The string being returned depends on the conditions
   * inside the function. If only API key is provided, it returns a string starting with 'Basic '
   * followed by the base64 encoded value of `this.apiKey` concatenated with a colon. If only
   * `this.generateJWT` is provided, it generates a JWT token. If both are provided, it resorts to the JWT method.
   */
  public async getAuthHeader(): Promise<string> {
    if (this.generateJWT) {
      const token = await this.generateJWT();
      return `Bearer ${token}`;
    }

    if (this.apiKey) {
      return 'Basic ' + btoa(this.apiKey + ':');
    }

    throw new Error('Authentication method not provided');
  }
}
