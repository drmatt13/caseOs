import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export class PromoCodesStack extends cdk.Stack {
  public readonly promoCodesTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.promoCodesTable = new dynamodb.Table(this, "PromoCodesTable", {
      tableName: "PromoCodes",
      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    new cdk.CfnOutput(this, "PromoCodesTableName", {
      value: this.promoCodesTable.tableName,
      exportName: "PromoCodesStack:TableName",
    });

    new cdk.CfnOutput(this, "PromoCodesTableArn", {
      value: this.promoCodesTable.tableArn,
      exportName: "PromoCodesStack:TableArn",
    });
  }
}
