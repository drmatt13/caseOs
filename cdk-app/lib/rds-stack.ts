import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";

export interface RdsStackProps extends cdk.StackProps {
  enableRdsProxy?: boolean;
}

export class RdsStack extends cdk.Stack {
  public readonly proxyEndpoint: string;
  public readonly databaseEndpoint: string;
  public readonly primaryEndpoint: string;
  public readonly credentialsSecretArn: string;

  constructor(scope: Construct, id: string, props?: RdsStackProps) {
    super(scope, id, props);

    // RDS Proxy is optional because some accounts/plans cannot create it.
    // Default is disabled to keep the stack free-tier/account-plan friendly.
    const enableRdsProxy = props?.enableRdsProxy ?? false;

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
    }

    const credentialsSecret = new secretsmanager.Secret(
      this,
      "PostgresCredentialsSecret",
      {
        secretName: "caseos/postgres/credentials",
        generateSecretString: {
          secretStringTemplate: JSON.stringify({
            username: "app_user",
          }),
          generateStringKey: "password",
          excludePunctuation: true,
        },
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
      credentials: rds.Credentials.fromSecret(credentialsSecret),
      databaseName: "app_db",
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

    new cdk.CfnOutput(this, "RdsProxyEndpoint", {
      value: this.proxyEndpoint,
      exportName: "CaseOs:RdsStack:RdsProxyEndpoint",
    });

    new cdk.CfnOutput(this, "RdsProxyEnabled", {
      value: String(enableRdsProxy),
      exportName: "CaseOs:RdsStack:RdsProxyEnabled",
    });

    new cdk.CfnOutput(this, "RdsProxyPort", {
      value: "5432",
      exportName: "CaseOs:RdsStack:RdsProxyPort",
    });

    new cdk.CfnOutput(this, "RdsDatabaseEndpoint", {
      value: this.databaseEndpoint,
      exportName: "CaseOs:RdsStack:RdsDatabaseEndpoint",
    });

    new cdk.CfnOutput(this, "RdsPrimaryEndpoint", {
      value: this.primaryEndpoint,
      exportName: "CaseOs:RdsStack:RdsPrimaryEndpoint",
    });

    new cdk.CfnOutput(this, "RdsCredentialsSecretArn", {
      value: this.credentialsSecretArn,
      exportName: "CaseOs:RdsStack:RdsCredentialsSecretArn",
    });
  }
}
