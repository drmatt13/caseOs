import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";

const secretsManagerClient = new SecretsManagerClient({});

interface DatabaseSecretShape {
  username?: string;
  password?: string;
  engine?: string;
  host?: string;
  port?: number | string;
  dbname?: string;
}

export type GetDatabaseUrlConfig = {
  primaryDatabaseSecretArn?: string;
  primaryDatabaseUrl?: string;
  primaryDatabaseSslmode?: string;
};

export async function getDatabaseUrl({
  primaryDatabaseSecretArn,
  primaryDatabaseUrl,
  primaryDatabaseSslmode,
}: GetDatabaseUrlConfig): Promise<string> {
  if (primaryDatabaseSecretArn) {
    const secretResponse = await secretsManagerClient.send(
      new GetSecretValueCommand({
        SecretId: primaryDatabaseSecretArn,
      }),
    );

    if (!secretResponse.SecretString) {
      throw new Error(
        "PRIMARY_DATABASE_SECRET_ARN resolved, but Secrets Manager returned an empty SecretString.",
      );
    }

    let secret: DatabaseSecretShape;

    try {
      secret = JSON.parse(secretResponse.SecretString) as DatabaseSecretShape;
    } catch (error) {
      throw new Error(
        `Unable to parse database secret JSON from Secrets Manager: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    const username = secret.username;
    const password = secret.password;
    const host = secret.host;
    const port = String(secret.port ?? "5432");
    const dbname = secret.dbname;
    const engine = secret.engine;

    if (!username || !password || !host || !dbname) {
      throw new Error(
        "Database secret is missing one or more required fields: username, password, host, dbname.",
      );
    }

    if (engine && engine !== "postgres" && engine !== "postgresql") {
      throw new Error(
        `Unsupported database engine "${engine}" for Cognito post-confirmation trigger.`,
      );
    }

    const connectionUrl = new URL(
      `postgresql://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${dbname}`,
    );
    connectionUrl.searchParams.set(
      "sslmode",
      primaryDatabaseSslmode ?? "no-verify",
    );

    console.log(
      "Using PRIMARY_DATABASE_SECRET_ARN from Secrets Manager for Prisma.",
      {
        secretArn: primaryDatabaseSecretArn,
        host,
        port,
        dbname,
        username,
        sslmode: connectionUrl.searchParams.get("sslmode") ?? "no-verify",
      },
    );

    return connectionUrl.toString();
  }

  if (primaryDatabaseUrl) {
    console.log("Using PRIMARY_DATABASE_URL from environment for Prisma.", {
      databaseUrl: primaryDatabaseUrl.replace(/:[^:@]+@/, ":****@"),
    });

    return primaryDatabaseUrl;
  }

  throw new Error(
    "In local mode, PRIMARY_DATABASE_URL must be set to connect to the database. In cloud mode, PRIMARY_DATABASE_SECRET_ARN must be set to fetch database credentials from Secrets Manager.",
  );
}
