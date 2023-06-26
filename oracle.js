const oracledb = require("oracledb");
const path = require("path");
async function connect() {
  try {
    oracledb.initOracleClient({
      libDir: path.relative(__dirname, "./nodes/Oracle/oic/instantclient_11_2"),
    });
    const user = "system";
    const sid = null;
    const serial = null;
    const connection = await oracledb.getConnection({
      user: "system",
      password: "oracle",
      connectionString: "localhost/xe",
    });

    await connection.execute(
      // "SELECT * FROM ANONYMOUS.TODO t",
      "INSERT INTO ANONYMOUS.TODO (TITLE, DESCRIPTION) VALUES ('teste', 'teste leitura')",
      [],
      {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
        autoCommit: false,
      }
    );

    const sessionInfo = await connection.execute(
      `SELECT SYS_CONTEXT('USERENV', 'SID') AS SID, SYS_CONTEXT('USERENV', 'SERIAL#') AS SERIAL FROM DUAL`
    );
    sid = sessionInfo.rows[0].SID;
    serial = sessionInfo.rows[0].SERIAL;

    const result = await connection.execute(
      // "SELECT * FROM ANONYMOUS.TODO t",
      "INSERT INTO ANONYMOUS.TODO (TITLE, DESCRIPTION) VALUES ('teste', 'teste leitura')",
      [],
      {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
        autoCommit: false,
      }
    );
    const connection2 = await oracledb.getConnection({
      user: "system",
      password: "oracle",
      connectionString: "localhost/xe",
      externalAuth: false, // Defina como `true` se estiver usando autenticação externa
      sessionId: sid,
      serialNumber: serial,
    });

    console.log(sessionInfo);
    console.log(result);
  } catch (error) {
    console.log(error);
  }
}

connect();
