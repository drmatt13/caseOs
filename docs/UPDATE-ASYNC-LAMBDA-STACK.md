# Update Async Lambda Stack Only

From `cdk-app/`, deploy only this stack:

```bash
cdk deploy --exclusively AsynchronousLambdaFunctionsStack -c enableWebSockets=true -c useCustomWsAuthorizer=true --require-approval never --profile=dev
```

