export class AuthorisationX {
    readonly personToken: string;
    readonly bookletId: number;

    static fromPersonTokenAndBookletId(personToken: string, bookletId: number): AuthorisationX {
      return new AuthorisationX(personToken + '##' + bookletId.toString());
    }

    constructor(authString: string) {
      if ((typeof authString !== 'string') || (authString.length === 0)) {
        this.personToken = '';
        this.bookletId = 0;
      } else {
        const retSplits = authString.split('##');
        this.personToken = retSplits[0];

        if (retSplits.length > 1) {
          this.bookletId = +retSplits[1];
        } else {
          this.bookletId = 0;
        }
      }
    }

    toAuthString(): string {
      return this.personToken + '##' + this.bookletId.toString();
    }
}
