import mysql from "mysql2";
import type { ConnectionOptions } from "mysqldump";

export const parseDbUrl = (dbUrl: string): ConnectionOptions => {
  const [_, user, password, host, portString, database] = dbUrl.match(/^mysql:\/\/(.+):(.+)@(.+):(\d+)\/(.+)$/) ?? [];

  if (!user || !password || !host || !portString || !database) {
    throw new Error("Invalid database URL");
  }

  return { database, host, password, port: +portString, user } as const;
};

export const getBackupName = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  const amPm = now.getHours() < 12 ? "AM" : "PM";

  return `NFLBackup-${year}-${month}-${day}-${amPm}.sql`;
};

export const executeSqlFile = (fileContents: string): Promise<unknown> =>
  new Promise((resolve, reject): void => {
    const connOptions = parseDbUrl(process.env.DATABASE_URL ?? "") as mysql.ConnectionOptions;
    const connection = mysql.createConnection({
      ...connOptions,
      multipleStatements: true,
      timezone: "local",
    });

    connection.connect();
    connection.query(fileContents, (error, results): void => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }

      connection.end();
    });
  });
