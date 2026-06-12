# COGNITO CUSTOM DOMAIN DNS

Amazon Cognito custom hosted UI domains are backed by a Cognito-managed
CloudFront distribution. When creating the domain, Cognito asks CloudFront to
claim the custom hostname.

Do not create the custom domain DNS record before the Cognito domain exists.
If the hostname already points at another CloudFront distribution, Cognito can
fail with a generic CloudFormation error:

```text
AWS::Cognito::UserPoolDomain
Resource handler returned message: "Invalid request provided: AWS::Cognito::UserPoolDomain"
```

CloudTrail shows the useful underlying error:

```text
One or more aliases specified for the distribution includes an incorrectly
configured DNS record that points to another CloudFront distribution.
```

## Correct Deploy Order

1. Set `COGNITO_DOMAIN_NAME` and `COGNITO_DOMAIN_CERTIFICATE_ARN`.
2. Make sure the parent/root domain has DNS records. For `auth.example.com`,
   `example.com` must resolve.
3. Make sure the custom Cognito hostname does not already point at CloudFront.
   For `auth.example.com`, remove any existing `auth.example.com` CNAME or
   alias record before deploying.
4. Deploy the CDK stacks.
5. Read the `UserPoolDomainCloudFrontEndpoint` CloudFormation output.
6. Create the custom domain DNS record pointing at that output.

## Check DNS

PowerShell:

```powershell
Resolve-DnsName auth.example.com
```

Bash:

```bash
dig auth.example.com
```

Before the first Cognito custom-domain deploy, the custom hostname should not
return an old CloudFront target. If it returns something like
`dxxxxxxxxxxxxx.cloudfront.net`, remove that DNS record and wait for DNS to
clear before redeploying.

## Check AWS State

Check whether Cognito already owns the domain:

```powershell
aws cognito-idp describe-user-pool-domain --domain auth.example.com --region us-east-1 --profile=<PROFILE>
```

Check whether an existing CloudFront distribution still has the alias:

```powershell
aws cloudfront list-distributions --profile=<PROFILE> --query "DistributionList.Items[?contains(Aliases.Items || [''], 'auth.example.com')].{Id:Id,DomainName:DomainName,Status:Status,Aliases:Aliases.Items}" --output json
```

Check that the certificate is valid:

```powershell
aws acm describe-certificate --certificate-arn <COGNITO_DOMAIN_CERTIFICATE_ARN> --region us-east-1 --profile=<PROFILE>
```

The certificate must be `ISSUED`, must be in `us-east-1`, and must cover the
custom Cognito hostname.

## Recover From The Failure

1. Remove the custom hostname DNS record if it points at CloudFront.
2. Delete the rolled-back Cognito stack if CloudFormation left one:

```powershell
aws cloudformation delete-stack --stack-name <CDK_APP_NAME>-CognitoStack --region us-east-1 --profile=<PROFILE>
```

3. Wait for the stack delete to finish:

```powershell
aws cloudformation wait stack-delete-complete --stack-name <CDK_APP_NAME>-CognitoStack --region us-east-1 --profile=<PROFILE>
```

4. Redeploy.
5. Add the DNS record only after `UserPoolDomainCloudFrontEndpoint` is
   available.

## Delete Timing

Deleting a Cognito user pool with a custom hosted UI domain can be slow.
Cognito has to remove the managed CloudFront distribution that backs the custom
domain, and CloudFront distribution changes are globally propagated. During
this cleanup, the Cognito stack can sit in `DELETE_IN_PROGRESS` longer than the
other stacks.

For fast create/destroy test cycles, leave `COGNITO_DOMAIN_NAME` and
`COGNITO_DOMAIN_CERTIFICATE_ARN` empty and use the generated Cognito hosted UI
domain. Re-enable the custom domain only when you need to test that path.
