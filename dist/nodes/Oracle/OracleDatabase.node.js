"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OracleDatabase = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const oracledb = require("oracledb");
const GenericFunctions_1 = require("./GenericFunctions");
class OracleDatabase {
    constructor() {
        this.description = {
            displayName: "Oracle Database",
            name: "oracleDatabase",
            icon: "file:oracle.svg",
            group: ["input"],
            version: 1,
            description: "Upsert, get, add and update data in Oracle database",
            defaults: {
                name: "oracleDatabase",
            },
            inputs: ["main"],
            outputs: ["main"],
            credentials: [
                {
                    name: "oracleCredentials",
                    required: true,
                },
            ],
            properties: [
                {
                    displayName: "Operation",
                    name: "operation",
                    type: "options",
                    noDataExpression: true,
                    options: [
                        {
                            name: "Execute Query",
                            value: "executeQuery",
                            description: "Execute an SQL query",
                            action: "Execute a SQL query",
                        },
                        {
                            name: "Insert",
                            value: "insert",
                            description: "Insert rows in database",
                            action: "Insert rows in database",
                        },
                        {
                            name: "Update",
                            value: "update",
                            description: "Update rows in database",
                            action: "Update rows in database",
                        },
                        {
                            name: "Upsert",
                            value: "upsert",
                            description: "Update or insert rows in database",
                            action: "Update or insert rows in database",
                        },
                    ],
                    default: "insert",
                },
                {
                    displayName: "Query",
                    name: "query",
                    type: "string",
                    typeOptions: {
                        alwaysOpenEditWindow: true,
                    },
                    displayOptions: {
                        show: {
                            operation: ["executeQuery"],
                        },
                    },
                    default: "",
                    placeholder: "SELECT id, name FROM product WHERE id < 40",
                    required: true,
                    description: "The SQL query to execute",
                },
                {
                    displayName: "Table",
                    name: "table",
                    type: "string",
                    displayOptions: {
                        show: {
                            operation: ["insert"],
                        },
                    },
                    default: "",
                    required: true,
                    description: "Name of the table in which to insert data to",
                },
                {
                    displayName: "Columns",
                    name: "columns",
                    type: "string",
                    displayOptions: {
                        show: {
                            operation: ["insert"],
                        },
                    },
                    default: "",
                    placeholder: "id,name,description",
                    description: "Comma-separated list of the properties which should used as columns for the new rows",
                },
                {
                    displayName: "Options",
                    name: "options",
                    type: "collection",
                    displayOptions: {
                        show: {
                            operation: ["insert"],
                        },
                    },
                    default: {},
                    placeholder: "Add modifiers",
                    description: "Modifiers for INSERT statement",
                    options: [
                        {
                            displayName: "Ignore",
                            name: "ignore",
                            type: "boolean",
                            default: true,
                            description: "Whether to ignore any ignorable errors that occur while executing the INSERT statement",
                        },
                        {
                            displayName: "Priority",
                            name: "priority",
                            type: "options",
                            options: [
                                {
                                    name: "Low Prioirity",
                                    value: "LOW_PRIORITY",
                                    description: "Delays execution of the INSERT until no other clients are reading from the table",
                                },
                                {
                                    name: "High Priority",
                                    value: "HIGH_PRIORITY",
                                    description: "Overrides the effect of the --low-priority-updates option if the server was started with that option. It also causes concurrent inserts not to be used.",
                                },
                            ],
                            default: "LOW_PRIORITY",
                            description: "Ignore any ignorable errors that occur while executing the INSERT statement",
                        },
                    ],
                },
                {
                    displayName: "Table",
                    name: "table",
                    type: "string",
                    displayOptions: {
                        show: {
                            operation: ["update"],
                        },
                    },
                    default: "",
                    required: true,
                    description: "Name of the table in which to update data in",
                },
                {
                    displayName: "Update Key",
                    name: "updateKey",
                    type: "string",
                    displayOptions: {
                        show: {
                            operation: ["update"],
                        },
                    },
                    default: "id",
                    required: true,
                    description: 'Name of the property which decides which rows in the database should be updated. Normally that would be "id".',
                },
                {
                    displayName: "Columns",
                    name: "columns",
                    type: "string",
                    displayOptions: {
                        show: {
                            operation: ["update"],
                        },
                    },
                    default: "",
                    placeholder: "name,description",
                    description: "Comma-separated list of the properties which should used as columns for rows to update",
                },
                {
                    displayName: "Table",
                    name: "table",
                    type: "string",
                    displayOptions: {
                        show: {
                            operation: ["upsert"],
                        },
                    },
                    default: "",
                    required: true,
                    description: "Name of the table in which to upsert data in",
                },
                {
                    displayName: "unique Key",
                    name: "uniqueKey",
                    type: "string",
                    displayOptions: {
                        show: {
                            operation: ["upsert"],
                        },
                    },
                    default: "id",
                    required: true,
                    description: 'Name of the property which decides which rows in the database should be upsert. Normally that would be "id".',
                },
                {
                    displayName: "Columns",
                    name: "columns",
                    type: "string",
                    displayOptions: {
                        show: {
                            operation: ["upsert"],
                        },
                    },
                    default: "",
                    placeholder: "name,description",
                    description: "Comma-separated list of the properties which should used as columns for rows to upsert",
                },
            ],
        };
    }
    async execute() {
        const credentials = await this.getCredentials("oracleCredentials");
        const { user, password, connectionString } = credentials;
        const connection = await oracledb.getConnection({
            user,
            password,
            connectionString,
        });
        console.log("Conectou no banco Oracle");
        const items = this.getInputData();
        const operation = this.getNodeParameter("operation", 0);
        let returnItems = [];
        if (operation === "executeQuery") {
            console.log("Entrou ExecuteQuery");
            try {
                const query = this.getNodeParameter("query", 0);
                const result = await connection.execute(query);
                console.log(result.rows);
                returnItems = this.helpers.returnJsonArray(result);
            }
            catch (error) {
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), error.message);
            }
            finally {
                if (connection) {
                    try {
                        await connection.close();
                    }
                    catch (error) {
                        console.error(`OracleDB: Failed to close the database connection: ${error}`);
                    }
                }
            }
        }
        else if (operation === "insert") {
            try {
                const table = this.getNodeParameter("table", 0);
                const columnString = this.getNodeParameter("columns", 0);
                const columns = columnString.split(",").map((column) => column.trim());
                const insertItems = (0, GenericFunctions_1.copyInputItems)(items, columns);
                const insertPlaceholder = `(${columns.map((column) => "?").join(",")})`;
                const options = this.getNodeParameter("options", 0);
                const insertIgnore = options.ignore;
                const insertPriority = options.priority;
                const insertSQL = `INSERT ${insertPriority || ""} ${insertIgnore ? "IGNORE" : ""} INTO ${table}(${columnString}) VALUES ${items
                    .map((item) => insertPlaceholder)
                    .join(",")};`;
                const queryItems = insertItems.reduce((collection, item) => collection.concat(Object.values(item)), []);
                const queryResult = await connection.execute(insertSQL, queryItems);
                returnItems = this.helpers.returnJsonArray(queryResult[0]);
            }
            catch (error) {
                if (this.continueOnFail()) {
                    returnItems = this.helpers.returnJsonArray({ error: error.message });
                }
                else {
                    await connection.close();
                    throw error;
                }
            }
        }
        else if (operation === "update") {
            try {
                const table = this.getNodeParameter("table", 0);
                const updateKey = this.getNodeParameter("updateKey", 0);
                const columnString = this.getNodeParameter("columns", 0);
                const columns = columnString.split(",").map((column) => column.trim());
                if (!columns.includes(updateKey)) {
                    columns.unshift(updateKey);
                }
                const updateItems = (0, GenericFunctions_1.copyInputItems)(items, columns);
                const updateSQL = `UPDATE ${table} SET ${columns
                    .map((column) => `${column} = ?`)
                    .join(",")} WHERE ${updateKey} = ?;`;
                const queryQueue = updateItems.map((item) => connection.execute(updateSQL, Object.values(item).concat(item[updateKey])));
                const queryResult = await Promise.all(queryQueue);
                returnItems = this.helpers.returnJsonArray(queryResult.map((result) => result[0]));
            }
            catch (error) {
                if (this.continueOnFail()) {
                    returnItems = this.helpers.returnJsonArray({ error: error.message });
                }
                else {
                    await connection.close();
                    throw error;
                }
            }
        }
        else if (operation === "upsert") {
            try {
                const table = this.getNodeParameter("table", 0);
                const uniqueKeyString = this.getNodeParameter("uniqueKey", 0);
                const columnString = this.getNodeParameter("columns", 0);
                const uniqueKeys = uniqueKeyString
                    .split(",")
                    .map((column) => column.trim());
                const columns = columnString.split(",").map((column) => column.trim());
                const allColumns = [...columns];
                for (const uniqueKey of uniqueKeys) {
                    if (!allColumns.includes(uniqueKey)) {
                        allColumns.unshift(uniqueKey);
                    }
                }
                const updateItems = (0, GenericFunctions_1.copyInputItems)(items, allColumns);
                const updateSQL = `INSERT INTO ${table} ( ${allColumns.join(",")} )
					VALUES ( ${allColumns.map((_) => "?").join(",")} )
					ON DUPLICATE KEY UPDATE ${columns
                    .map((column) => `${column}=VALUES(${column})`)
                    .join(",")};`;
                const queryQueue = updateItems.map((item) => connection.execute(updateSQL, Object.values(item)));
                const queryResult = await Promise.all(queryQueue);
                returnItems = this.helpers.returnJsonArray(queryResult.map((result) => result[0]));
            }
            catch (error) {
                if (this.continueOnFail()) {
                    returnItems = this.helpers.returnJsonArray({ error: error.message });
                }
                else {
                    await connection.close();
                    throw error;
                }
            }
        }
        else {
            if (this.continueOnFail()) {
                returnItems = this.helpers.returnJsonArray({
                    error: `The operation "${operation}" is not supported!`,
                });
            }
            else {
                await connection.close();
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), `The operation "${operation}" is not supported!`);
            }
        }
        return this.prepareOutputData(returnItems);
    }
}
exports.OracleDatabase = OracleDatabase;
//# sourceMappingURL=OracleDatabase.node.js.map