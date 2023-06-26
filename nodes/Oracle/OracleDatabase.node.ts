import { IExecuteFunctions } from "n8n-core";

import {
  IDataObject,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
} from "n8n-workflow";
import { ConnectionAttributes } from "oracledb";
import path from "path";
// const oracledb = require("oracledb");
import oracledb from "oracledb";

export class OracleDatabase implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Oracle Database",
    name: "Oracle Database",
    icon: "file:oracle.svg",
    group: ["input"],
    version: 1,
    description: "Upsert, get, add and update data in Oracle database",
    defaults: {
      name: "Oracle Database",
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
        displayName: "SQL Statment",
        name: "query",
        type: "string",
        typeOptions: {
          alwaysOpenEditWindow: true,
        },
        default: "",
        placeholder: "SELECT id, name FROM product WHERE id < 40",
        required: true,
        description: "The SQL query to execute",
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const credentials = await this.getCredentials("oracleCredentials");
    let connection = null;

    const { user, password, connectionString, thinMode } = credentials;
    const dbConfig = {
      user,
      password,
      connectionString,
    } as ConnectionAttributes;

    if (!thinMode) {
      oracledb.initOracleClient({ libDir: process.env.LD_LIBRARY_PATH });
    }
    connection = await oracledb.getConnection(dbConfig);

    let returnItems = [];

    try {
      const query = this.getNodeParameter("query", 0) as string;
      const result = await connection.execute(query, [], {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      });
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

    return this.prepareOutputData(returnItems);
  }
}
