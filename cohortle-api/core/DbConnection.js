const { Sequelize, QueryTypes } = require("sequelize");
const { resolveDbConfig } = require("../utils/dbEnvironment");

class MySqlAdapterSetting {
  constructor(databaseName, user, password, hostname, port) {
    this.databaseName = databaseName;
    this.user = user;
    this.password = password;
    this.hostname = hostname;
    this.port = port;
    this._connection = createSequelizeConnection(
      databaseName,
      user,
      password,
      hostname,
      port,
    );
  }

  getConnection() {
    if (!this._connection) {
      this._connection = createSequelizeConnection(
        this.databaseName,
        this.user,
        this.password,
        this.hostname,
        this.port,
      );
    }
    return this._connection;
  }
}

function createSequelizeConnection(
  databaseName,
  user,
  password,
  hostname,
  port,
) {
  return new Sequelize(databaseName, user, password, {
    dialect: "mysql",
    dialectOptions: {
      multipleStatements: true,
    },
    host: hostname,
    port: port,
    logging: false,
    timezone: "+00:00",
    pool: {
      max: 10,
      min: 0,
      idle: 10000,
      acquire: 60000,
    },
    define: {
      timestamps: false,
      underscoredAll: true,
      underscored: true,
    },
  });
}

function createInstance() {
  const dbConfig = resolveDbConfig();
  let classObj = new MySqlAdapterSetting(
    "",
    dbConfig.user,
    dbConfig.password,
    dbConfig.host,
    dbConfig.port,
  );
  return classObj;
}

let dbConnection = createInstance().getConnection();

module.exports = {
  dbConnection,
};
