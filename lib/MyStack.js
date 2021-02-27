import * as cdk from "@aws-cdk/core";
import * as iam from "@aws-cdk/aws-iam";
import * as sst from "@serverless-stack/resources";

export default class MyStack extends sst.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Create Api
    const api = new sst.Api(this, "Api", {
      defaultAuthorizationType: "AWS_IAM",
      routes: {
        "GET /private": "src/private.main",
        "GET /public": {
          authorizationType: "NONE",
          function: "src/public.main",
        },
      },
    });

    const { account, region } = sst.Stack.of(this);

    // Create auth provider
    const auth = new sst.Auth(this, "Auth", {
      cognito: {
        signInAliases: { email: true },
      },
    });

    // Allow authenticated users to invoke the API
    auth.attachPermissionsForAuthUsers([
      new iam.PolicyStatement({
        actions: ["execute-api:Invoke"],
        effect: iam.Effect.ALLOW,
        resources: [
          `arn:aws:execute-api:${region}:${account}:${api.httpApi.httpApiId}/*`,
        ],
      }),
    ]);

    new cdk.CfnOutput(this, "UserPoolId", {
      value: auth.cognitoUserPool.userPoolId,
    });
    new cdk.CfnOutput(this, "UserPoolClientId", {
      value: auth.cognitoUserPoolClient.userPoolClientId,
    });
    new cdk.CfnOutput(this, "IdentityPoolId", {
      value: auth.cognitoCfnIdentityPool.ref,
    });

    // Show API endpoint in output
    new cdk.CfnOutput(this, "ApiEndpoint", {
      value: api.httpApi.apiEndpoint,
    });
  }
}
