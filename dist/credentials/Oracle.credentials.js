"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Oracle = void 0;
class Oracle {
    constructor() {
        this.name = "oracleCredentials";
        this.displayName = "Oracle Credentials";
        this.documentationUrl = "oracleCredentials";
        this.properties = [
            {
                displayName: "User",
                name: "user",
                type: "string",
                default: "system",
            },
            {
                displayName: "Password",
                name: "password",
                type: "string",
                typeOptions: {
                    password: true,
                },
                default: "",
            },
            {
                displayName: "Conecction String",
                name: "connectionString",
                type: "string",
                default: "localhost/orcl",
            },
        ];
    }
}
exports.Oracle = Oracle;
//# sourceMappingURL=Oracle.credentials.js.map