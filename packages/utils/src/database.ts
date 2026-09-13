import mysql from "mysql2";
import type { ConnectionOptions } from "mysqldump";

export const parseDbUrl = (dbUrl: string): ConnectionOptions => {
  let url: URL;

  try {
    url = new URL(dbUrl);
  } catch {
    throw new Error("Invalid database URL");
  }

  if (url.protocol !== "mysql:") {
    throw new Error("Invalid database URL");
  }

  const user = decodeURIComponent(url.username);
  const password = decodeURIComponent(url.password);
  const database = url.pathname.replace(/^\//, "");

  if (!user || !password || !url.hostname || !database) {
    throw new Error("Invalid database URL");
  }

  return { database, host: url.hostname, password, port: Number(url.port) || 3306, user } as const;
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
      timezone: "Z",
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

/**
 * Runs `fn` while holding a named MySQL advisory lock, so overlapping scheduled runs can
 * single-flight instead of piling up on the same work. Returns false when another holder
 * has the lock (fn is not invoked). The lock lives on its own connection and is released
 * when fn settles.
 */
export const withAdvisoryLock = async <T>(lockName: string, fn: () => Promise<T>): Promise<boolean> => {
  const connOptions = parseDbUrl(process.env.DATABASE_URL ?? "") as mysql.ConnectionOptions;
  const connection = mysql.createConnection({ ...connOptions, timezone: "Z" });
  const promiseConnection = connection.promise();

  try {
    await promiseConnection.connect();
    const [rows] = await promiseConnection.query("SELECT GET_LOCK(?, 0) AS Acquired", [lockName]);
    const acquired = (rows as Array<{ Acquired: number }>)[0]?.Acquired === 1;

    if (!acquired) {
      return false;
    }

    try {
      await fn();
    } finally {
      await promiseConnection.query("DO RELEASE_LOCK(?)", [lockName]);
    }

    return true;
  } finally {
    await promiseConnection.end();
  }
};
