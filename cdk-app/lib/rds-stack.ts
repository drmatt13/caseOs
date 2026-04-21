import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";

export interface RdsStackProps extends cdk.StackProps {
  enableRdsProxy?: boolean;
  primaryDatabaseName?: string;
  primaryDatabaseUsername?: string;
}

export class RdsStack extends cdk.Stack {
  public readonly proxyEndpoint: string;
  public readonly databaseEndpoint: string;
  public readonly primaryEndpoint: string;
  public readonly credentialsSecretArn: string;
  public readonly primaryDatabaseUrl: string;
  public readonly directDatabaseUrl: string;

  constructor(scope: Construct, id: string, props?: RdsStackProps) {
    super(scope, id, props);

    // RDS Proxy is optional because some accounts/plans cannot create it.
    // Default is disabled to keep the stack free-tier/account-plan friendly.
    const enableRdsProxy = props?.enableRdsProxy ?? false;
    const primaryDatabaseName = props?.primaryDatabaseName ?? "app_db";
    const primaryDatabaseUsername = props?.primaryDatabaseUsername ?? "app_user";

    const vpc = ec2.Vpc.fromLookup(this, "DefaultVpc", { isDefault: true });

    const dbSecurityGroup = new ec2.SecurityGroup(
      this,
      "PostgresSecurityGroup",
      {
        vpc,
        description: "Security group for PostgreSQL instance",
        allowAllOutbound: true,
      },
    );

    const proxySecurityGroup = enableRdsProxy
      ? new ec2.SecurityGroup(this, "PostgresProxySecurityGroup", {
          vpc,
          description: "Security group for RDS Proxy",
          allowAllOutbound: true,
        })
      : undefined;

    if (proxySecurityGroup) {
      // Allow client access to the proxy so it can be used as a drop-in PostgreSQL endpoint.
      proxySecurityGroup.addIngressRule(
        ec2.Peer.anyIpv4(),
        ec2.Port.tcp(5432),
        "Allow PostgreSQL client traffic",
      );

      dbSecurityGroup.addIngressRule(
        proxySecurityGroup,
        ec2.Port.tcp(5432),
        "Allow proxy to reach PostgreSQL",
      );
    } else {
      // Direct database access is used for local Prisma workflows when the proxy is disabled.
      dbSecurityGroup.addIngressRule(
        ec2.Peer.anyIpv4(),
        ec2.Port.tcp(5432),
        "Allow PostgreSQL client traffic",
      );
    }

    const credentialsSecret = new rds.DatabaseSecret(
      this,
      "PostgresCredentialsSecret",
      {
        secretName: "caseos/postgres/credentials",
        username: primaryDatabaseUsername,
        dbname: primaryDatabaseName,
        excludeCharacters: " %+~`#$&*()|[]{}:;<>?!'/@\"\\",
      },
    );

    const database = new rds.DatabaseInstance(this, "PostgresDatabase", {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE3,
        ec2.InstanceSize.MICRO,
      ),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      publiclyAccessible: true,
      credentials: rds.Credentials.fromSecret(
        credentialsSecret,
        primaryDatabaseUsername,
      ),
      databaseName: primaryDatabaseName,
      securityGroups: [dbSecurityGroup],
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      multiAz: false,
      backupRetention: cdk.Duration.days(0),
      deleteAutomatedBackups: true,
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const proxy = enableRdsProxy
      ? database.addProxy("PostgresProxy", {
          vpc,
          secrets: [credentialsSecret],
          securityGroups: proxySecurityGroup ? [proxySecurityGroup] : undefined,
          iamAuth: false,
          requireTLS: false,
          debugLogging: false,
        })
      : undefined;

    this.proxyEndpoint = proxy?.endpoint ?? database.instanceEndpoint.hostname;
    this.databaseEndpoint = database.instanceEndpoint.hostname;
    this.primaryEndpoint = this.proxyEndpoint;
    this.credentialsSecretArn = credentialsSecret.secretArn;

    // Runtime URL for app code. Resolves to proxy when enabled, direct DB when disabled.
    this.primaryDatabaseUrl = cdk.Fn.join("", [
      `postgresql://${primaryDatabaseUsername}:`,
      credentialsSecret.secretValueFromJson("password").unsafeUnwrap(),
      "@",
      this.primaryEndpoint,
      `:5432/${primaryDatabaseName}`,
    ]);

    // Direct URL for admin/debug workflows (e.g. migrations, diagnostics).
    this.directDatabaseUrl = cdk.Fn.join("", [
      `postgresql://${primaryDatabaseUsername}:`,
      credentialsSecret.secretValueFromJson("password").unsafeUnwrap(),
      "@",
      this.databaseEndpoint,
      `:5432/${primaryDatabaseName}`,
    ]);

    new cdk.CfnOutput(this, "RdsProxyEndpoint", {
      value: this.proxyEndpoint,
      exportName: "RdsStack:RdsProxyEndpoint",
    });

    new cdk.CfnOutput(this, "RdsProxyEnabled", {
      value: String(enableRdsProxy),
      exportName: "RdsStack:RdsProxyEnabled",
    });

    new cdk.CfnOutput(this, "RdsProxyPort", {
      value: "5432",
      exportName: "RdsStack:RdsProxyPort",
    });

    new cdk.CfnOutput(this, "RdsDatabaseEndpoint", {
      value: this.databaseEndpoint,
      exportName: "RdsStack:RdsDatabaseEndpoint",
    });

    new cdk.CfnOutput(this, "RdsPrimaryEndpoint", {
      value: this.primaryEndpoint,
      exportName: "RdsStack:RdsPrimaryEndpoint",
    });

    new cdk.CfnOutput(this, "PrimaryDatabaseUrlTemplate", {
      value: `postgresql://${primaryDatabaseUsername}:<password>@${this.primaryEndpoint}:5432/${primaryDatabaseName}`,
      exportName: "RdsStack:PrimaryDatabaseUrlTemplate",
    });

    new cdk.CfnOutput(this, "DirectDatabaseUrlTemplate", {
      value: `postgresql://${primaryDatabaseUsername}:<password>@${this.databaseEndpoint}:5432/${primaryDatabaseName}`,
      exportName: "RdsStack:DirectDatabaseUrlTemplate",
    });

    new cdk.CfnOutput(this, "RdsCredentialsSecretArn", {
      value: this.credentialsSecretArn,
      exportName: "RdsStack:RdsCredentialsSecretArn",
    });
  }
}
