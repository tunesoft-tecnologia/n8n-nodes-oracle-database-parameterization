import { IExecuteFunctions } from "n8n-core";

import {
  IDataObject,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
} from "n8n-workflow";
import { ConnectionAttributes } from "oracledb";
const oracledb = require("oracledb");

import { copyInputItems } from "./GenericFunctions";
import { IOracleCredentials } from "../../credentials/Oracle.credentials";

export class OracleDatabase implements INodeType {
  description: INodeTypeDescription = {
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

      // {
      // 	displayName: 'SQL',
      // 	name: 'sql',
      // 	type: 'string',
      // 	typeOptions: {
      // 		alwaysOpenEditWindow: true,
      // 	},
      // 	default: '',
      // 	placeholder: 'SELECT id, name FROM product WHERE id < 40',
      // 	required: false,
      // 	description: 'The SQL to execute',
      // },

      // ----------------------------------
      //         executeQuery
      // ----------------------------------
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

      // ----------------------------------
      //         insert
      // ----------------------------------
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
        description:
          "Comma-separated list of the properties which should used as columns for the new rows",
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
            description:
              "Whether to ignore any ignorable errors that occur while executing the INSERT statement",
          },
          {
            displayName: "Priority",
            name: "priority",
            type: "options",
            options: [
              {
                name: "Low Prioirity",
                value: "LOW_PRIORITY",
                description:
                  "Delays execution of the INSERT until no other clients are reading from the table",
              },
              {
                name: "High Priority",
                value: "HIGH_PRIORITY",
                description:
                  "Overrides the effect of the --low-priority-updates option if the server was started with that option. It also causes concurrent inserts not to be used.",
              },
            ],
            default: "LOW_PRIORITY",
            description:
              "Ignore any ignorable errors that occur while executing the INSERT statement",
          },
        ],
      },

      // ----------------------------------
      //         update
      // ----------------------------------
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
        // eslint-disable-next-line n8n-nodes-base/node-param-description-miscased-id
        description:
          'Name of the property which decides which rows in the database should be updated. Normally that would be "id".',
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
        description:
          "Comma-separated list of the properties which should used as columns for rows to update",
      },

      // ----------------------------------
      //         upsert
      // ----------------------------------
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
        // eslint-disable-next-line n8n-nodes-base/node-param-description-miscased-id
        description:
          'Name of the property which decides which rows in the database should be upsert. Normally that would be "id".',
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
        description:
          "Comma-separated list of the properties which should used as columns for rows to upsert",
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const credentials = await this.getCredentials("oracleCredentials");

    // Destructuring SSL configuration
    const { user, password, connectionString } = credentials;

    const connection = await oracledb.getConnection({
      user,
      password,
      connectionString,
    } as ConnectionAttributes);
    console.log("Conectou no banco Oracle");
    const items = this.getInputData();
    const operation = this.getNodeParameter("operation", 0) as string;
    let returnItems = [];

    if (operation === "executeQuery") {
      // ----------------------------------
      //         executeQuery
      // ----------------------------------

      console.log("Entrou ExecuteQuery");
      try {
        const query = this.getNodeParameter("query", 0) as string;
        const result = await connection.execute(query);
        console.log(result.rows);
        returnItems = this.helpers.returnJsonArray(
          result as unknown as IDataObject[]
        );
      } catch (error) {
        throw new NodeOperationError(this.getNode(), error.message);
      } finally {
        if (connection) {
          try {
            await connection.close();
          } catch (error) {
            console.error(
              `OracleDB: Failed to close the database connection: ${error}`
            );
          }
        }
      }
    } else if (operation === "insert") {
      // ----------------------------------
      //         insert
      // ----------------------------------

      try {
        const table = this.getNodeParameter("table", 0) as string;
        const columnString = this.getNodeParameter("columns", 0) as string;
        const columns = columnString.split(",").map((column) => column.trim());
        const insertItems = copyInputItems(items, columns);
        const insertPlaceholder = `(${columns.map((column) => "?").join(",")})`;
        const options = this.getNodeParameter("options", 0) as IDataObject;
        const insertIgnore = options.ignore as boolean;
        const insertPriority = options.priority as string;

        const insertSQL = `INSERT ${insertPriority || ""} ${
          insertIgnore ? "IGNORE" : ""
        } INTO ${table}(${columnString}) VALUES ${items
          .map((item) => insertPlaceholder)
          .join(",")};`;
        const queryItems = insertItems.reduce(
          (collection, item) => collection.concat(Object.values(item as any)),
          []
        ); // tslint:disable-line:no-any

        const queryResult: any = await connection.execute(
          insertSQL,
          queryItems
        );

        returnItems = this.helpers.returnJsonArray(
          queryResult[0] as unknown as IDataObject
        );
      } catch (error) {
        if (this.continueOnFail()) {
          returnItems = this.helpers.returnJsonArray({ error: error.message });
        } else {
          await connection.close();
          throw error;
        }
      }
    } else if (operation === "update") {
      // ----------------------------------
      //         update
      // ----------------------------------

      try {
        const table = this.getNodeParameter("table", 0) as string;
        const updateKey = this.getNodeParameter("updateKey", 0) as string;
        const columnString = this.getNodeParameter("columns", 0) as string;
        const columns = columnString.split(",").map((column) => column.trim());

        if (!columns.includes(updateKey)) {
          columns.unshift(updateKey);
        }

        const updateItems = copyInputItems(items, columns);
        const updateSQL = `UPDATE ${table} SET ${columns
          .map((column) => `${column} = ?`)
          .join(",")} WHERE ${updateKey} = ?;`;
        const queryQueue = updateItems.map((item) =>
          connection.execute(
            updateSQL,
            Object.values(item).concat(item[updateKey])
          )
        );
        const queryResult = await Promise.all(queryQueue);
        returnItems = this.helpers.returnJsonArray(
          queryResult.map(
            (result: any) => result[0]
          ) as unknown as IDataObject[]
        );
      } catch (error) {
        if (this.continueOnFail()) {
          returnItems = this.helpers.returnJsonArray({ error: error.message });
        } else {
          await connection.close();
          throw error;
        }
      }
    } else if (operation === "upsert") {
      // ----------------------------------
      //         upsert
      // ----------------------------------

      try {
        const table = this.getNodeParameter("table", 0) as string;
        const uniqueKeyString = this.getNodeParameter("uniqueKey", 0) as string;
        const columnString = this.getNodeParameter("columns", 0) as string;
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

        const updateItems = copyInputItems(items, allColumns);
        const updateSQL = `INSERT INTO ${table} ( ${allColumns.join(",")} )
					VALUES ( ${allColumns.map((_) => "?").join(",")} )
					ON DUPLICATE KEY UPDATE ${columns
            .map((column) => `${column}=VALUES(${column})`)
            .join(",")};`;
        const queryQueue = updateItems.map((item) =>
          connection.execute(updateSQL, Object.values(item))
        );
        const queryResult = await Promise.all(queryQueue);
        returnItems = this.helpers.returnJsonArray(
          queryResult.map(
            (result: any) => result[0]
          ) as unknown as IDataObject[]
        );
      } catch (error) {
        if (this.continueOnFail()) {
          returnItems = this.helpers.returnJsonArray({ error: error.message });
        } else {
          await connection.close();
          throw error;
        }
      }
    } else {
      if (this.continueOnFail()) {
        returnItems = this.helpers.returnJsonArray({
          error: `The operation "${operation}" is not supported!`,
        });
      } else {
        await connection.close();
        throw new NodeOperationError(
          this.getNode(),
          `The operation "${operation}" is not supported!`
        );
      }
    }

    // await connection.close();

    return this.prepareOutputData(returnItems);
  }
}
