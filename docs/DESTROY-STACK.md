# DESTROY STACK

Use this when you want to tear down the deployed CDK stacks for an environment.

## Destroy all stacks

From `/cdk-app`:

```powershell
cdk destroy --all --profile=<PROFILE>
```

Replace `<PROFILE>` with the AWS CLI profile used for the deployment.

CDK will show the stacks it plans to destroy and ask for confirmation before
deleting them. Review the list carefully, then confirm when it matches the
environment you want to remove.

## Notes

- This tears down the deployed CloudFormation stacks.
- Use the same profile/account/region that you used for deployment.
- Stateful resources may be retained if the stack configured removal protection
  or retain policies.
- After destroy completes, check the AWS CloudFormation console if you want to
  confirm all target stacks reached `DELETE_COMPLETE`.
